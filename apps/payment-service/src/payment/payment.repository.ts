import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Payment } from '../generated/prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    bookingId: string;
    userId: string;
    amount: number;
    currency?: string;
    status: string;
    method: string;
    providerRef?: string;
    failureReason?: string;
    paidAt?: Date;
  }): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      status: string;
      providerRef: string;
      failureReason: string;
      paidAt: Date;
    }>,
  ): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }
}
