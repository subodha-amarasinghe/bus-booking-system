import { Injectable } from '@nestjs/common';
import type { RouteCoordinate } from '@bus-booking/shared-types';
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

  listLocations(filter: { skip?: number; take?: number }): Promise<Location[]> {
    return this.prisma.location.findMany({
      orderBy: { name: 'asc' },
      skip: filter.skip,
      take: filter.take,
    });
  }

  listRoutes(filter: {
    originLocationId?: string;
    destinationLocationId?: string;
    skip?: number;
    take?: number;
  }): Promise<Route[]> {
    return this.prisma.route.findMany({
      where: {
        originLocationId: filter.originLocationId,
        destinationLocationId: filter.destinationLocationId,
      },
      orderBy: { name: 'asc' },
      skip: filter.skip,
      take: filter.take,
    });
  }

  createRoute(data: {
    name: string;
    routeNumber: string;
    originLocationId: string;
    destinationLocationId: string;
    distanceKm: number;
    estimatedDurationMin: number;
    pathCoordinates: RouteCoordinate[];
  }): Promise<Route> {
    return this.prisma.route.create({ data });
  }
}
