import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  BOOKING_CONFIRMED,
  CANCELLATION_COMPLETED,
  PAYMENT_SUCCEEDED,
  USER_CREATED,
} from '@bus-booking/shared-events';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(USER_CREATED)
  onUserCreated(@Payload() data: unknown) {
    return this.notificationService.handleEvent(USER_CREATED, data);
  }

  @EventPattern(BOOKING_CONFIRMED)
  onBookingConfirmed(@Payload() data: unknown) {
    return this.notificationService.handleEvent(BOOKING_CONFIRMED, data);
  }

  @EventPattern(PAYMENT_SUCCEEDED)
  onPaymentSucceeded(@Payload() data: unknown) {
    return this.notificationService.handleEvent(PAYMENT_SUCCEEDED, data);
  }

  @EventPattern(CANCELLATION_COMPLETED)
  onCancellationCompleted(@Payload() data: unknown) {
    return this.notificationService.handleEvent(CANCELLATION_COMPLETED, data);
  }
}
