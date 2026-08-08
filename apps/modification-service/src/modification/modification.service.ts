import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  BOOKING_CONFIRMED,
  CANCELLATION_COMPLETED,
} from '@bus-booking/shared-events';
import {
  CancellationPolicyRuleSchema,
  RefundStatus,
  resolveRefundAmount,
} from '@bus-booking/shared-types';
import type {
  CalculateRefundRequest,
  CancellationPolicy,
  CancellationPolicyRule,
  CancellationRequest,
  UpsertCancellationPolicyRequest,
} from '@bus-booking/shared-types';
import type { CancellationPolicy as PolicyRow, Prisma } from '../generated/prisma/client';
import { ModificationRepository } from './modification.repository';

const STUB_FARE_AMOUNT = 1000;

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

    const refundCalc = await this.calculateRefund({
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

  async calculateRefund(dto: CalculateRefundRequest): Promise<{
    bookingId: string;
    amount: number;
    currency: string;
    percentage: number;
    deductionAmount: number;
  }> {
    const policy = await this.getActivePolicy();
    const rules = policy?.rules ?? [
      {
        minHoursBeforeDeparture: 12,
        deductionAmount: 300,
        label: 'More than 12 hours before departure',
      },
      {
        minHoursBeforeDeparture: 6,
        deductionAmount: 350,
        label: 'Between 12 to 6 hours before departure',
      },
      {
        minHoursBeforeDeparture: 0,
        noRefund: true,
        label: 'Less than 6 hours before departure',
      },
    ];

    // Without a known departure, assume the most generous qualifying tier
    // (highest threshold) so early cancellations are not under-quoted.
    const hours =
      dto.hoursBeforeDeparture ??
      Math.max(...rules.map((rule) => rule.minHoursBeforeDeparture), 0);

    const fareAmount = dto.fareAmount ?? STUB_FARE_AMOUNT;
    const resolved = resolveRefundAmount(rules, hours, fareAmount);

    return {
      bookingId: dto.bookingId,
      amount: resolved.amount,
      currency: 'LKR',
      percentage: resolved.percentage,
      deductionAmount: resolved.deductionAmount,
    };
  }

  async getActivePolicy(): Promise<CancellationPolicy | null> {
    const row = await this.repo.findActivePolicy();
    return row ? this.toPolicy(row) : null;
  }

  async upsertPolicy(
    dto: UpsertCancellationPolicyRequest,
  ): Promise<CancellationPolicy> {
    const rules = [...dto.rules].sort(
      (a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture,
    );
    const row = await this.repo.upsertPolicy({
      id: dto.id,
      name: dto.name,
      description: dto.description,
      rules: rules as unknown as Prisma.InputJsonValue,
      isActive: dto.isActive,
    });
    return this.toPolicy(row);
  }

  private toPolicy(row: PolicyRow): CancellationPolicy {
    const parsed = CancellationPolicyRuleSchema.array().safeParse(row.rules);
    const rules: CancellationPolicyRule[] = parsed.success ? parsed.data : [];

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      rules,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  onBookingConfirmed(payload: unknown): void {
    this.logger.log(`Received ${BOOKING_CONFIRMED}: ${JSON.stringify(payload)}`);
  }
}
