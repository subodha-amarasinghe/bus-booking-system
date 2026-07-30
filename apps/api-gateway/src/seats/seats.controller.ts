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
  GetSeatLayoutByBusRequestSchema,
  SaveSeatLayoutRequestSchema,
  UserRole,
  type GetSeatLayoutByBusRequest,
  type SaveSeatLayoutRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  SEAT_GET_LAYOUT_BY_BUS,
  SEAT_SAVE_LAYOUT,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('seats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_STAFF)
export class SeatsController {
  constructor(
    @Inject('BUS_SEAT_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get('layout/:busId')
  getLayout(
    @Param(new ZodValidationPipe(GetSeatLayoutByBusRequestSchema))
    dto: GetSeatLayoutByBusRequest,
  ) {
    return firstValueFrom(this.client.send(SEAT_GET_LAYOUT_BY_BUS, dto));
  }

  @Post('layout')
  saveLayout(
    @Body(new ZodValidationPipe(SaveSeatLayoutRequestSchema))
    dto: SaveSeatLayoutRequest,
  ) {
    return firstValueFrom(this.client.send(SEAT_SAVE_LAYOUT, dto));
  }
}
