import { Injectable } from '@nestjs/common';
import type {
  CreateBusRequest,
  CreateTripRequest,
  ListBusesRequest,
  SaveSeatLayoutRequest,
  SearchTripsRequest,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { BusSeatRepository } from './bus-seat.repository';

@Injectable()
export class BusSeatService {
  constructor(private readonly repo: BusSeatRepository) {}

  createBus(dto: CreateBusRequest) {
    return this.repo.createBus(dto);
  }

  listBuses(dto: ListBusesRequest) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    return this.repo.listBuses({
      operatorId: dto.operatorId,
      isActive: dto.isActive,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async saveLayout(dto: SaveSeatLayoutRequest) {
    const bus = await this.repo.findBus(dto.busId);
    if (!bus) {
      throw new DomainException('Bus not found', 404, 'BUS_NOT_FOUND');
    }
    return this.repo.saveLayout({
      busId: dto.busId,
      rows: dto.rows,
      columns: dto.columns,
      seats: dto.seats,
    });
  }

  async createTrip(dto: CreateTripRequest) {
    const bus = await this.repo.findBus(dto.busId);
    if (!bus) {
      throw new DomainException('Bus not found', 404, 'BUS_NOT_FOUND');
    }
    return this.repo.createTrip({
      ...dto,
      availableSeats: bus.capacity,
    });
  }

  searchTrips(dto: SearchTripsRequest) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    return this.repo.searchTrips({
      routeId: dto.routeId,
      departureDate: dto.departureDate,
      minFare: dto.minFare,
      maxFare: dto.maxFare,
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
