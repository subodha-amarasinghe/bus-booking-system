import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  SaveSeatLayoutRequestSchema,
  UserRole,
  type SaveSeatLayoutRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import { SEAT_SAVE_LAYOUT } from '@bus-booking/shared-events';
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

  @Post('layout')
  saveLayout(
    @Body(new ZodValidationPipe(SaveSeatLayoutRequestSchema))
    dto: SaveSeatLayoutRequest,
  ) {
    return firstValueFrom(this.client.send(SEAT_SAVE_LAYOUT, dto));
  }
}
