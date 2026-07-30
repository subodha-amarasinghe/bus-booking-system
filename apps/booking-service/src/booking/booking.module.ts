import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { SeatGateway } from '../seats/seat.gateway';
import { RedisLockExpiryService } from '../redis/redis-lock-expiry.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: { durable: true },
        },
      },
      {
        name: 'BUS_SEAT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'bus_seat_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    SeatGateway,
    RedisLockExpiryService,
  ],
})
export class BookingModule {}
