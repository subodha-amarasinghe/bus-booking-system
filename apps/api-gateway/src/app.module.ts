import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { BusesController } from './buses/buses.controller';
import { SeatsController } from './seats/seats.controller';
import { TripsController } from './trips/trips.controller';
import { RoutesController } from './routes/routes.controller';
import { BookingsController } from './bookings/bookings.controller';
import { PaymentsController } from './payments/payments.controller';
import { CancellationsController } from './cancellations/cancellations.controller';
import { HealthController } from './health/health.controller';

const rabbitUrl = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

function rmqClient(name: string, queue: string) {
  return {
    name,
    transport: Transport.RMQ as const,
    options: {
      urls: [rabbitUrl],
      queue,
      queueOptions: { durable: true },
    },
  };
}

@Module({
  imports: [
    TerminusModule,
    AuthModule,
    ClientsModule.register([
      rmqClient('AUTH_SERVICE', 'auth_queue'),
      rmqClient('USER_SERVICE', 'user_queue'),
      rmqClient('ROUTE_MAPS_SERVICE', 'route_maps_queue'),
      rmqClient('BUS_SEAT_SERVICE', 'bus_seat_queue'),
      rmqClient('BOOKING_SERVICE', 'booking_queue'),
      rmqClient('PAYMENT_SERVICE', 'payment_queue'),
      rmqClient('MODIFICATION_SERVICE', 'modification_queue'),
      rmqClient('NOTIFICATION_SERVICE', 'notification_queue'),
    ]),
  ],
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
