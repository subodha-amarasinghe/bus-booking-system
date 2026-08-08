import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { PAYMENT_FAILED, PAYMENT_SUCCEEDED } from '@bus-booking/shared-events';
import { PaymentMethod, PaymentStatus } from '@bus-booking/shared-types';
import type {
  ProcessOnlinePaymentRequest,
  ProcessOnlinePaymentResponse,
  RecordOfflinePaymentRequest,
} from '@bus-booking/shared-types';
import type { Payment as PaymentRow } from '../generated/prisma/client';
import { DomainException } from '../common/exceptions/domain.exception';
import { PaymentRepository } from './payment.repository';
import { StripeGateway } from './stripe.gateway';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly stripe: StripeGateway,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
  ) {}

  async processOnline(
    dto: ProcessOnlinePaymentRequest,
  ): Promise<ProcessOnlinePaymentResponse> {
    const payment = await this.repo.create({
      bookingId: dto.bookingId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.ONLINE,
      providerRef: dto.provider,
    });

    if (!this.stripe.enabled) {
      return this.completeStubOnline(payment);
    }

    const passengerOrigin =
      process.env.PASSENGER_WEB_ORIGIN?.replace(/\/$/, '') ??
      'http://localhost:3200';
    const successUrl =
      dto.returnUrl ??
      `${passengerOrigin}/payment/${dto.bookingId}?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      dto.cancelUrl ??
      `${passengerOrigin}/payment/${dto.bookingId}?status=cancelled`;

    try {
      const session = await this.stripe.createCheckoutSession({
        paymentId: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        successUrl,
        cancelUrl,
      });

      const updated = await this.repo.update(payment.id, {
        providerRef: session.sessionId,
      });

      return {
        ...this.toPayment(updated),
        checkoutUrl: session.checkoutUrl,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Stripe Checkout failed';
      this.logger.error(message);
      const failed = await this.repo.update(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason: message,
      });
      this.emitFailed(failed, message);
      if (error instanceof DomainException) throw error;
      throw new DomainException(message, 502, 'STRIPE_CHECKOUT_FAILED');
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<{
    received: true;
    paymentId?: string;
    status?: string;
  }> {
    const event = this.stripe.constructEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId =
        session.metadata?.paymentId ?? session.client_reference_id ?? undefined;
      const providerRef = session.id;

      const payment = paymentId
        ? await this.repo.findById(paymentId)
        : await this.repo.findByProviderRef(providerRef);

      if (!payment) {
        this.logger.warn(
          `Stripe session ${providerRef} has no matching payment row`,
        );
        return { received: true };
      }

      if (payment.status === PaymentStatus.SUCCEEDED) {
        return { received: true, paymentId: payment.id, status: payment.status };
      }

      if (session.payment_status && session.payment_status !== 'paid') {
        this.logger.warn(
          `Ignoring checkout.session.completed for ${providerRef} — payment_status=${session.payment_status}`,
        );
        return { received: true, paymentId: payment.id, status: payment.status };
      }

      const paidAt = new Date();
      const updated = await this.repo.update(payment.id, {
        status: PaymentStatus.SUCCEEDED,
        providerRef,
        paidAt,
        failureReason: null,
      });
      this.emitSucceeded(updated, paidAt);
      return { received: true, paymentId: updated.id, status: updated.status };
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const payment =
        (session.metadata?.paymentId
          ? await this.repo.findById(session.metadata.paymentId)
          : null) ?? (await this.repo.findByProviderRef(session.id));

      if (payment && payment.status === PaymentStatus.PENDING) {
        const updated = await this.repo.update(payment.id, {
          status: PaymentStatus.FAILED,
          failureReason: 'Checkout session expired',
        });
        this.emitFailed(updated, 'Checkout session expired');
        return { received: true, paymentId: updated.id, status: updated.status };
      }
    }

    return { received: true };
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
    this.emitSucceeded(payment, paidAt);
    return this.toPayment(payment);
  }

  private async completeStubOnline(
    payment: PaymentRow,
  ): Promise<ProcessOnlinePaymentResponse> {
    const paidAt = new Date();
    const updated = await this.repo.update(payment.id, {
      status: PaymentStatus.SUCCEEDED,
      providerRef: `stub_${randomUUID()}`,
      paidAt,
    });
    this.emitSucceeded(updated, paidAt);
    return this.toPayment(updated);
  }

  private emitSucceeded(payment: PaymentRow, occurredAt: Date): void {
    this.notifications.emit(PAYMENT_SUCCEEDED, {
      event: PAYMENT_SUCCEEDED,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      providerRef: payment.providerRef ?? undefined,
      occurredAt,
    });
  }

  private emitFailed(payment: PaymentRow, reason: string): void {
    this.notifications.emit(PAYMENT_FAILED, {
      event: PAYMENT_FAILED,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      reason,
      occurredAt: new Date(),
    });
  }

  private toPayment(row: PaymentRow): ProcessOnlinePaymentResponse {
    return {
      id: row.id,
      bookingId: row.bookingId,
      userId: row.userId,
      amount: row.amount,
      currency: row.currency,
      status: row.status as PaymentStatus,
      method: row.method as PaymentMethod,
      providerRef: row.providerRef ?? undefined,
      failureReason: row.failureReason ?? undefined,
      paidAt: row.paidAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
