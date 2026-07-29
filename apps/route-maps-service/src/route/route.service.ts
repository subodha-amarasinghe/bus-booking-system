import { Injectable } from '@nestjs/common';
import type {
  CreateLocationRequest,
  CreateRouteRequest,
  GetOsmPathRequest,
  OsmPathResponse,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { RouteRepository } from './route.repository';

@Injectable()
export class RouteService {
  constructor(private readonly repo: RouteRepository) {}

  createLocation(dto: CreateLocationRequest) {
    return this.repo.createLocation(dto);
  }

  async createRoute(dto: CreateRouteRequest) {
    const origin = await this.repo.findLocation(dto.originLocationId);
    const destination = await this.repo.findLocation(dto.destinationLocationId);
    if (!origin || !destination) {
      throw new DomainException('Invalid location ids', 400, 'ROUTE_LOCATION');
    }
    return this.repo.createRoute(dto);
  }

  /**
   * Placeholder polyline — OSRM/Nominatim will be wired later.
   */
  getOsmPath(dto: GetOsmPathRequest): OsmPathResponse {
    const midLat = (dto.originLat + dto.destinationLat) / 2;
    const midLng = (dto.originLng + dto.destinationLng) / 2;
    return {
      distanceKm: 42,
      durationMin: 60,
      coordinates: [
        { lat: dto.originLat, lng: dto.originLng },
        { lat: midLat, lng: midLng },
        { lat: dto.destinationLat, lng: dto.destinationLng },
      ],
    };
  }
}
