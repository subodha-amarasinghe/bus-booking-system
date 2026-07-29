import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateTripRequestSchema,
  SearchTripsRequestSchema,
  UserRole,
  type CreateTripRequest,
  type SearchTripsRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import { TRIP_CREATE, TRIP_SEARCH } from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('trips')
export class TripsController {
  constructor(
    @Inject('BUS_SEAT_SERVICE') private readonly client: ClientProxy,
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

  @Post('search')
  search(
    @Body(new ZodValidationPipe(SearchTripsRequestSchema))
    dto: SearchTripsRequest,
  ) {
    return firstValueFrom(this.client.send(TRIP_SEARCH, dto));
  }
}
