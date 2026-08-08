import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  Cancellation,
  CancellationPolicy,
  Prisma,
  Refund,
} from '../generated/prisma/client';

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

  findActivePolicy(): Promise<CancellationPolicy | null> {
    return this.prisma.cancellationPolicy.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findPolicyById(id: string): Promise<CancellationPolicy | null> {
    return this.prisma.cancellationPolicy.findUnique({ where: { id } });
  }

  async upsertPolicy(data: {
    id?: string;
    name: string;
    description?: string | null;
    rules: Prisma.InputJsonValue;
    isActive: boolean;
  }): Promise<CancellationPolicy> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isActive) {
        await tx.cancellationPolicy.updateMany({
          where: {
            isActive: true,
            ...(data.id ? { NOT: { id: data.id } } : {}),
          },
          data: { isActive: false },
        });
      }

      if (data.id) {
        const existing = await tx.cancellationPolicy.findUnique({
          where: { id: data.id },
        });
        if (existing) {
          return tx.cancellationPolicy.update({
            where: { id: data.id },
            data: {
              name: data.name,
              description: data.description ?? null,
              rules: data.rules,
              isActive: data.isActive,
            },
          });
        }
      }

      return tx.cancellationPolicy.create({
        data: {
          ...(data.id ? { id: data.id } : {}),
          name: data.name,
          description: data.description ?? null,
          rules: data.rules,
          isActive: data.isActive,
        },
      });
    });
  }
}
