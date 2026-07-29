import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  BOOKING_CONFIRMED,
  CANCELLATION_COMPLETED,
} from '@bus-booking/shared-events';
import { RefundStatus } from '@bus-booking/shared-types';
import type {
  CalculateRefundRequest,
  CancellationRequest,
} from '@bus-booking/shared-types';
import { ModificationRepository } from './modification.repository';

@Injectable()
export class ModificationService {
  private readonly logger = new Logger(ModificationService.name);

  constructor(
    private readonly repo: ModificationRepository,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
  ) {}

  async requestCancellation(dto: CancellationRequest) {
    const cancellation = await this.repo.createCancellation({
      bookingId: dto.bookingId,
      userId: dto.userId,
      reason: dto.reason,
      status: 'REQUESTED',
    });

    const refundCalc = this.calculateRefund({
      bookingId: dto.bookingId,
      cancellationAt: new Date(),
    });

    const refund = await this.repo.createRefund({
      bookingId: dto.bookingId,
      userId: dto.userId,
      cancellationId: cancellation.id,
      amount: refundCalc.amount,
      currency: refundCalc.currency,
      status: RefundStatus.APPROVED,
      reason: dto.reason,
      processedAt: new Date(),
    });

    await this.repo.updateCancellation(cancellation.id, {
      status: 'COMPLETED',
    });

    this.notifications.emit(CANCELLATION_COMPLETED, {
      event: CANCELLATION_COMPLETED,
      bookingId: dto.bookingId,
      userId: dto.userId,
      refundId: refund.id,
      refundAmount: refund.amount,
      currency: refund.currency,
      reason: dto.reason,
      occurredAt: new Date(),
    });

    return { cancellation, refund };
  }

  calculateRefund(dto: CalculateRefundRequest): {
    bookingId: string;
    amount: number;
    currency: string;
    percentage: number;
  } {
    // Stub policy: 80% refund if cancelled more than 2h before departure (unknown here)
    const percentage = 80;
    const amount = 1000 * (percentage / 100);
    return {
      bookingId: dto.bookingId,
      amount,
      currency: 'LKR',
      percentage,
    };
  }

  onBookingConfirmed(payload: unknown): void {
    this.logger.log(`Received ${BOOKING_CONFIRMED}: ${JSON.stringify(payload)}`);
  }
}
