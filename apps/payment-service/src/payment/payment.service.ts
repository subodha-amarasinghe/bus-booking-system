import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { PAYMENT_FAILED, PAYMENT_SUCCEEDED } from '@bus-booking/shared-events';
import { PaymentMethod, PaymentStatus } from '@bus-booking/shared-types';
import type {
  ProcessOnlinePaymentRequest,
  RecordOfflinePaymentRequest,
} from '@bus-booking/shared-types';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
  ) {}

  async processOnline(dto: ProcessOnlinePaymentRequest) {
    const payment = await this.repo.create({
      bookingId: dto.bookingId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.ONLINE,
      providerRef: dto.provider,
    });

    // Stub gateway: succeed unless amount is zero (already validated positive)
    const success = true;
    if (success) {
      const paidAt = new Date();
      const updated = await this.repo.update(payment.id, {
        status: PaymentStatus.SUCCEEDED,
        providerRef: `online_${randomUUID()}`,
        paidAt,
      });
      this.notifications.emit(PAYMENT_SUCCEEDED, {
        event: PAYMENT_SUCCEEDED,
        paymentId: updated.id,
        bookingId: updated.bookingId,
        userId: updated.userId,
        amount: updated.amount,
        currency: updated.currency,
        method: updated.method,
        providerRef: updated.providerRef ?? undefined,
        occurredAt: paidAt,
      });
      return updated;
    }

    const updated = await this.repo.update(payment.id, {
      status: PaymentStatus.FAILED,
      failureReason: 'Gateway declined',
    });
    this.notifications.emit(PAYMENT_FAILED, {
      event: PAYMENT_FAILED,
      paymentId: updated.id,
      bookingId: updated.bookingId,
      userId: updated.userId,
      amount: updated.amount,
      currency: updated.currency,
      reason: updated.failureReason ?? undefined,
      occurredAt: new Date(),
    });
    return updated;
  }

  async recordOffline(dto: RecordOfflinePaymentRequest) {
    const paidAt = new Date();
    const payment = await this.repo.create({
      bookingId: dto.bookingId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.SUCCEEDED,
      method: dto.method,
      providerRef: dto.receiptNo,
      paidAt,
    });
    this.notifications.emit(PAYMENT_SUCCEEDED, {
      event: PAYMENT_SUCCEEDED,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      providerRef: payment.providerRef ?? undefined,
      occurredAt: paidAt,
    });
    return payment;
  }
}
