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
    departureDate?: Date;
    minFare?: number;
    maxFare?: number;
    skip?: number;
    take?: number;
  }): Promise<Trip[]> {
    return this.prisma.trip.findMany({
      where: {
        routeId: filter.routeId,
        fareAmount: {
          gte: filter.minFare,
          lte: filter.maxFare,
        },
      },
      skip: filter.skip,
      take: filter.take,
    });
  }
}
