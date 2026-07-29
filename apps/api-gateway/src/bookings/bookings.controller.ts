import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConfirmBookingRequestSchema,
  LockSeatRequestSchema,
  type ConfirmBookingRequest,
  type LockSeatRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import { BOOKING_CONFIRM, BOOKING_LOCK_SEAT } from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    @Inject('BOOKING_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post('lock-seat')
  lockSeat(
    @Body(new ZodValidationPipe(LockSeatRequestSchema)) dto: LockSeatRequest,
  ) {
    return firstValueFrom(this.client.send(BOOKING_LOCK_SEAT, dto));
  }

  @Post('confirm')
  confirm(
    @Body(new ZodValidationPipe(ConfirmBookingRequestSchema))
    dto: ConfirmBookingRequest,
  ) {
    return firstValueFrom(this.client.send(BOOKING_CONFIRM, dto));
  }
}
