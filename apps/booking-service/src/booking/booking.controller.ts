import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ConfirmBookingRequestSchema,
  GetSeatMapRequestSchema,
  LockSeatRequestSchema,
  MyBookingsRequestSchema,
  ReleaseSeatsRequestSchema,
  type ConfirmBookingRequest,
  type GetSeatMapRequest,
  type LockSeatRequest,
  type MyBookingsRequest,
  type ReleaseSeatsRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  BOOKING_CONFIRM,
  BOOKING_GET_SEAT_MAP,
  BOOKING_LOCK_SEAT,
  BOOKING_MY_BOOKINGS,
  BOOKING_RELEASE_SEATS,
} from '@bus-booking/shared-events';
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

  @MessagePattern(BOOKING_RELEASE_SEATS)
  releaseSeats(
    @Payload(new ZodValidationPipe(ReleaseSeatsRequestSchema))
    dto: ReleaseSeatsRequest,
  ) {
    return this.bookingService.releaseSeats(dto);
  }

  @MessagePattern(BOOKING_CONFIRM)
  confirm(
    @Payload(new ZodValidationPipe(ConfirmBookingRequestSchema))
    dto: ConfirmBookingRequest,
  ) {
    return this.bookingService.confirm(dto);
  }

  @MessagePattern(BOOKING_MY_BOOKINGS)
  myBookings(
    @Payload(new ZodValidationPipe(MyBookingsRequestSchema))
    dto: MyBookingsRequest,
  ) {
    return this.bookingService.myBookings(dto.userId);
  }

  @MessagePattern(BOOKING_GET_SEAT_MAP)
  getSeatMap(
    @Payload(new ZodValidationPipe(GetSeatMapRequestSchema))
    dto: GetSeatMapRequest,
  ) {
    return this.bookingService.getSeatMap(dto.tripId);
  }
}
