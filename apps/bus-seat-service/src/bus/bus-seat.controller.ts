import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateBusRequestSchema,
  CreateTripRequestSchema,
  GetSeatLayoutByBusRequestSchema,
  GetTripRequestSchema,
  ListBusesRequestSchema,
  SaveSeatLayoutRequestSchema,
  SearchTripsRequestSchema,
  type CreateBusRequest,
  type CreateTripRequest,
  type GetSeatLayoutByBusRequest,
  type GetTripRequest,
  type ListBusesRequest,
  type SaveSeatLayoutRequest,
  type SearchTripsRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  BUS_CREATE,
  BUS_LIST,
  SEAT_GET_LAYOUT_BY_BUS,
  SEAT_SAVE_LAYOUT,
  TRIP_CREATE,
  TRIP_GET,
  TRIP_SEARCH,
} from '@bus-booking/shared-events';
import { BusSeatService } from './bus-seat.service';

@Controller()
export class BusSeatController {
  constructor(private readonly busSeatService: BusSeatService) {}

  @MessagePattern(BUS_CREATE)
  createBus(
    @Payload(new ZodValidationPipe(CreateBusRequestSchema))
    dto: CreateBusRequest,
  ) {
    return this.busSeatService.createBus(dto);
  }

  @MessagePattern(BUS_LIST)
  listBuses(
    @Payload(new ZodValidationPipe(ListBusesRequestSchema))
    dto: ListBusesRequest,
  ) {
    return this.busSeatService.listBuses(dto);
  }

  @MessagePattern(SEAT_SAVE_LAYOUT)
  saveLayout(
    @Payload(new ZodValidationPipe(SaveSeatLayoutRequestSchema))
    dto: SaveSeatLayoutRequest,
  ) {
    return this.busSeatService.saveLayout(dto);
  }

  @MessagePattern(SEAT_GET_LAYOUT_BY_BUS)
  getLayoutByBus(
    @Payload(new ZodValidationPipe(GetSeatLayoutByBusRequestSchema))
    dto: GetSeatLayoutByBusRequest,
  ) {
    return this.busSeatService.getLayoutByBus(dto);
  }

  @MessagePattern(TRIP_CREATE)
  createTrip(
    @Payload(new ZodValidationPipe(CreateTripRequestSchema))
    dto: CreateTripRequest,
  ) {
    return this.busSeatService.createTrip(dto);
  }

  @MessagePattern(TRIP_GET)
  getTrip(
    @Payload(new ZodValidationPipe(GetTripRequestSchema)) dto: GetTripRequest,
  ) {
    return this.busSeatService.getTrip(dto);
  }

  @MessagePattern(TRIP_SEARCH)
  searchTrips(
    @Payload(new ZodValidationPipe(SearchTripsRequestSchema))
    dto: SearchTripsRequest,
  ) {
    return this.busSeatService.searchTrips(dto);
  }
}
