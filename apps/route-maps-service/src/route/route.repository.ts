import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Location, Route } from '../generated/prisma/client';

@Injectable()
export class RouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  createLocation(data: {
    name: string;
    code?: string;
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
  }): Promise<Location> {
    return this.prisma.location.create({ data });
  }

  findLocation(id: string): Promise<Location | null> {
    return this.prisma.location.findUnique({ where: { id } });
  }

  createRoute(data: {
    name: string;
    originLocationId: string;
    destinationLocationId: string;
    distanceKm?: number;
    estimatedDurationMin?: number;
  }): Promise<Route> {
    return this.prisma.route.create({ data });
  }
}
