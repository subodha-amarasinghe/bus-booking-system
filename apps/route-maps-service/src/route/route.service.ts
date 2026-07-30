import { Injectable } from '@nestjs/common';
import type {
  CreateLocationRequest,
  CreateRouteRequest,
  GetOsmPathRequest,
  ListLocationsRequest,
  ListRoutesRequest,
  OsmPathResponse,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { RouteRepository } from './route.repository';
import { sriLankanRouteWaypoints } from './sri-lankan-route-corridors';

@Injectable()
export class RouteService {
  constructor(private readonly repo: RouteRepository) {}

  createLocation(dto: CreateLocationRequest) {
    return this.repo.createLocation(dto);
  }

  listLocations(dto: ListLocationsRequest) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 100;
    return this.repo.listLocations({
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  listRoutes(dto: ListRoutesRequest) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 100;
    return this.repo.listRoutes({
      originLocationId: dto.originLocationId,
      destinationLocationId: dto.destinationLocationId,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async createRoute(dto: CreateRouteRequest) {
    const origin = await this.repo.findLocation(dto.originLocationId);
    const destination = await this.repo.findLocation(dto.destinationLocationId);
    if (!origin || !destination) {
      throw new DomainException('Invalid location ids', 400, 'ROUTE_LOCATION');
    }
    const path = await this.getOsmPath({
      routeNumber: dto.routeNumber,
      originLat: origin.latitude,
      originLng: origin.longitude,
      destinationLat: destination.latitude,
      destinationLng: destination.longitude,
    });
    return this.repo.createRoute({
      name: `${origin.name} → ${destination.name}`,
      routeNumber: dto.routeNumber,
      originLocationId: dto.originLocationId,
      destinationLocationId: dto.destinationLocationId,
      distanceKm: path.distanceKm,
      estimatedDurationMin: Math.round(path.durationMin),
      pathCoordinates: path.coordinates,
    });
  }

  async getOsmPath(dto: GetOsmPathRequest): Promise<OsmPathResponse> {
    const baseUrl =
      process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
    const waypoints = sriLankanRouteWaypoints(
      dto.routeNumber,
      {
        lat: dto.originLat,
        lng: dto.originLng,
      },
      {
        lat: dto.destinationLat,
        lng: dto.destinationLng,
      },
    );
    const coordinates = [
      { lat: dto.originLat, lng: dto.originLng },
      ...waypoints,
      { lat: dto.destinationLat, lng: dto.destinationLng },
    ]
      .map(({ lat, lng }) => `${lng},${lat}`)
      .join(';');
    const response = await fetch(
      `${baseUrl}/route/v1/driving/${coordinates}?overview=simplified&geometries=geojson`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!response.ok) {
      throw new DomainException(
        'Unable to calculate the road route',
        502,
        'ROUTE_PROVIDER',
      );
    }

    const result = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    const route = result.routes?.[0];
    if (result.code !== 'Ok' || !route) {
      throw new DomainException(
        'No drivable route was found between these locations',
        422,
        'ROUTE_NOT_FOUND',
      );
    }

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
        lat,
        lng,
      })),
    };
  }
}
