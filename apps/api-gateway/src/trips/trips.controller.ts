import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateTripRequestSchema,
  GetSeatMapRequestSchema,
  SearchTripsRequestSchema,
  UserRole,
  type CreateTripRequest,
  type GetSeatMapRequest,
  type Route,
  type SearchTripsRequest,
  type SeatMapResponse,
  type Trip,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  BOOKING_GET_SEAT_MAP,
  ROUTE_LIST_ROUTES,
  TRIP_CREATE,
  TRIP_SEARCH,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('trips')
export class TripsController {
  constructor(
    @Inject('BUS_SEAT_SERVICE') private readonly client: ClientProxy,
    @Inject('ROUTE_MAPS_SERVICE') private readonly routeClient: ClientProxy,
    @Inject('BOOKING_SERVICE') private readonly bookingClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  create(
    @Body(new ZodValidationPipe(CreateTripRequestSchema))
    dto: CreateTripRequest,
  ) {
    return firstValueFrom(this.client.send(TRIP_CREATE, dto));
  }

  /**
   * Trips and routes live in separate databases, so an origin/destination
   * search is resolved to route ids here before hitting bus-seat-service.
   */
  @Post('search')
  async search(
    @Body(new ZodValidationPipe(SearchTripsRequestSchema))
    dto: SearchTripsRequest,
  ): Promise<Trip[]> {
    const needsRouteLookup =
      !dto.routeId &&
      !dto.routeIds &&
      Boolean(dto.originLocationId ?? dto.destinationLocationId);

    if (!needsRouteLookup) {
      return firstValueFrom(this.client.send<Trip[]>(TRIP_SEARCH, dto));
    }

    const routes = await firstValueFrom(
      this.routeClient.send<Route[]>(ROUTE_LIST_ROUTES, {
        originLocationId: dto.originLocationId,
        destinationLocationId: dto.destinationLocationId,
      }),
    );
    if (routes.length === 0) {
      return [];
    }

    return firstValueFrom(
      this.client.send<Trip[]>(TRIP_SEARCH, {
        ...dto,
        routeIds: routes.map((route) => route.id),
      }),
    );
  }

  @Get(':tripId/seats')
  @UseGuards(JwtAuthGuard)
  getSeatMap(
    @Param(new ZodValidationPipe(GetSeatMapRequestSchema))
    params: GetSeatMapRequest,
  ) {
    return firstValueFrom(
      this.bookingClient.send<SeatMapResponse>(BOOKING_GET_SEAT_MAP, params),
    );
  }
}
