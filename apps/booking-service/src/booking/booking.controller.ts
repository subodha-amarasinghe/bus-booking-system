import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ConfirmBookingRequestSchema,
  LockSeatRequestSchema,
  type ConfirmBookingRequest,
  type LockSeatRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import { BOOKING_CONFIRM, BOOKING_LOCK_SEAT } from '@bus-booking/shared-events';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern(BOOKING_LOCK_SEAT)
  lockSeat(
    @Payload(new ZodValidationPipe(LockSeatRequestSchema))
    dto: LockSeatRequest,
  ) {
    return this.bookingService.lockSeat(dto);
  }

  @MessagePattern(BOOKING_CONFIRM)
  confirm(
    @Payload(new ZodValidationPipe(ConfirmBookingRequestSchema))
    dto: ConfirmBookingRequest,
  ) {
    return this.bookingService.confirm(dto);
  }
}
