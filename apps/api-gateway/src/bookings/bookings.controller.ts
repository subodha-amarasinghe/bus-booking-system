import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConfirmBookingRequestSchema,
  LockSeatRequestSchema,
  ReleaseSeatsRequestSchema,
  type ConfirmBookingRequest,
  type LockSeatRequest,
  type MyBookingsResponse,
  type ReleaseSeatsRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  BOOKING_CONFIRM,
  BOOKING_LOCK_SEAT,
  BOOKING_MY_BOOKINGS,
  BOOKING_RELEASE_SEATS,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
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

  @Post('release-seat')
  releaseSeat(
    @Body(new ZodValidationPipe(ReleaseSeatsRequestSchema))
    dto: ReleaseSeatsRequest,
  ) {
    return firstValueFrom(this.client.send(BOOKING_RELEASE_SEATS, dto));
  }

  @Post('confirm')
  confirm(
    @Body(new ZodValidationPipe(ConfirmBookingRequestSchema))
    dto: ConfirmBookingRequest,
  ) {
    return firstValueFrom(this.client.send(BOOKING_CONFIRM, dto));
  }

  @Get('me')
  myBookings(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.client.send<MyBookingsResponse>(BOOKING_MY_BOOKINGS, {
        userId: req.user.userId,
      }),
    );
  }
}
