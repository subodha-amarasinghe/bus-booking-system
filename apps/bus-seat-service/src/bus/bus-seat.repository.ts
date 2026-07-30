import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Bus, Prisma, SeatLayout, Trip } from '../generated/prisma/client';

@Injectable()
export class BusSeatRepository {
  constructor(private readonly prisma: PrismaService) {}

  createBus(data: {
    plateNumber: string;
    name?: string;
    capacity: number;
    operatorId?: string;
  }): Promise<Bus> {
    return this.prisma.bus.create({ data });
  }

  listBuses(filter: {
    operatorId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Bus[]> {
    return this.prisma.bus.findMany({
      where: {
        operatorId: filter.operatorId,
        isActive: filter.isActive,
      },
      skip: filter.skip,
      take: filter.take,
    });
  }

  findBus(id: string): Promise<Bus | null> {
    return this.prisma.bus.findUnique({ where: { id } });
  }

  saveLayout(data: {
    busId: string;
    rows: number;
    columns: number;
    seats: Prisma.InputJsonValue;
  }): Promise<SeatLayout> {
    return this.prisma.seatLayout.upsert({
      where: { busId: data.busId },
      create: data,
      update: {
        rows: data.rows,
        columns: data.columns,
        seats: data.seats,
      },
    });
  }

  findLayoutByBusId(busId: string): Promise<SeatLayout | null> {
    return this.prisma.seatLayout.findUnique({ where: { busId } });
  }

  findTripById(id: string): Promise<Trip | null> {
    return this.prisma.trip.findUnique({ where: { id } });
  }

  createTrip(data: {
    busId: string;
    routeId: string;
    departureAt: Date;
    arrivalAt?: Date;
    fareAmount: number;
    currency?: string;
    availableSeats?: number;
  }): Promise<Trip> {
    return this.prisma.trip.create({ data });
  }

  searchTrips(filter: {
    routeId?: string;
    routeIds?: string[];
    departureDate?: Date;
    minFare?: number;
    maxFare?: number;
    skip?: number;
    take?: number;
  }): Promise<Trip[]> {
    const where: Prisma.TripWhereInput = {
      fareAmount: {
        gte: filter.minFare,
        lte: filter.maxFare,
      },
    };

    if (filter.routeId) {
      where.routeId = filter.routeId;
    } else if (filter.routeIds) {
      where.routeId = { in: filter.routeIds };
    }

    if (filter.departureDate) {
      const dayStart = new Date(filter.departureDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.departureAt = { gte: dayStart, lt: dayEnd };
    }

    return this.prisma.trip.findMany({
      where,
      orderBy: { departureAt: 'asc' },
      skip: filter.skip,
      take: filter.take,
    });
  }
}
