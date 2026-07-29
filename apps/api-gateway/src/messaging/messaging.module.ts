import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

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

/**
 * Registering the clients once here and re-exporting keeps a single connection
 * per queue: importing ClientsModule.register directly in several modules would
 * create a separate client instance in each of them.
 */
@Module({
  imports: [
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
  exports: [ClientsModule],
})
export class MessagingModule {}
