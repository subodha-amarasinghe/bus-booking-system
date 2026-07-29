import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ModificationController } from './modification.controller';
import { ModificationService } from './modification.service';
import { ModificationRepository } from './modification.repository';

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
    ]),
  ],
  controllers: [ModificationController],
  providers: [ModificationService, ModificationRepository],
})
export class ModificationModule {}
