import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './auth/auth.module';
import { MessagingModule } from './messaging/messaging.module';
import { UsersController } from './users/users.controller';
import { BusesController } from './buses/buses.controller';
import { SeatsController } from './seats/seats.controller';
import { TripsController } from './trips/trips.controller';
import { RoutesController } from './routes/routes.controller';
import { BookingsController } from './bookings/bookings.controller';
import { PaymentsController } from './payments/payments.controller';
import { CancellationsController } from './cancellations/cancellations.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [TerminusModule, MessagingModule, AuthModule],
  controllers: [
    UsersController,
    BusesController,
    SeatsController,
    TripsController,
    RoutesController,
    BookingsController,
    PaymentsController,
    CancellationsController,
    HealthController,
  ],
})
export class AppModule {}
