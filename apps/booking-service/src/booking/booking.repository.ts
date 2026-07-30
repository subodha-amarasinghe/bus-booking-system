import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Booking } from '../generated/prisma/client';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdempotencyKey(key: string): Promise<Booking | null> {
    return this.prisma.booking.findUnique({ where: { idempotencyKey: key } });
  }

  findByUserId(userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findConfirmedOrLockedByTrip(tripId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        tripId,
        status: { in: ['LOCKED', 'CONFIRMED'] },
      },
    });
  }

  findActiveSeat(tripId: string, seatNo: number): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        tripId,
        seatNo,
        status: { in: ['LOCKED', 'CONFIRMED'] },
      },
    });
  }

  create(data: {
    tripId: string;
    userId: string;
    seatNo: number;
    status: string;
    passengerName: string;
    passengerPhone: string;
    fareAmount?: number;
    currency?: string;
    lockToken?: string;
    lockExpiresAt?: Date;
    idempotencyKey?: string;
    confirmedAt?: Date;
  }): Promise<Booking> {
    return this.prisma.booking.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      status: string;
      lockToken: string | null;
      lockExpiresAt: Date | null;
      confirmedAt: Date;
      passengerName: string;
      passengerPhone: string;
      fareAmount: number;
      idempotencyKey: string;
    }>,
  ): Promise<Booking> {
    return this.prisma.booking.update({ where: { id }, data });
  }
}
