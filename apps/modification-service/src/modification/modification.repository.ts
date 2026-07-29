import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Cancellation, Refund } from '../generated/prisma/client';

@Injectable()
export class ModificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  createCancellation(data: {
    bookingId: string;
    userId: string;
    reason?: string;
    status?: string;
  }): Promise<Cancellation> {
    return this.prisma.cancellation.create({ data });
  }

  updateCancellation(
    id: string,
    data: Partial<{ status: string }>,
  ): Promise<Cancellation> {
    return this.prisma.cancellation.update({ where: { id }, data });
  }

  createRefund(data: {
    bookingId: string;
    paymentId?: string;
    userId: string;
    cancellationId: string;
    amount: number;
    currency?: string;
    status?: string;
    reason?: string;
    processedAt?: Date;
  }): Promise<Refund> {
    return this.prisma.refund.create({ data });
  }
}
