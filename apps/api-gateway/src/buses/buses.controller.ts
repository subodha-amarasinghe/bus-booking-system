import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateBusRequestSchema,
  ListBusesRequestSchema,
  UserRole,
  type CreateBusRequest,
  type ListBusesRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import { BUS_CREATE, BUS_LIST } from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('buses')
export class BusesController {
  constructor(
    @Inject('BUS_SEAT_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  create(
    @Body(new ZodValidationPipe(CreateBusRequestSchema)) dto: CreateBusRequest,
  ) {
    return firstValueFrom(this.client.send(BUS_CREATE, dto));
  }

  @Post('list')
  list(
    @Body(new ZodValidationPipe(ListBusesRequestSchema)) dto: ListBusesRequest,
  ) {
    return firstValueFrom(this.client.send(BUS_LIST, dto));
  }
}
