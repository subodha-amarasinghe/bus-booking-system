import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'booking_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();

  const healthPort = Number(process.env.HEALTH_PORT ?? 3015);
  await app.listen(healthPort);

  const wsPort = process.env.WS_PORT ?? 3020;
  Logger.log(
    `Booking service health on :${healthPort}, WS namespace /seats (WS_PORT=${wsPort}), RMQ booking_queue`,
  );
}

bootstrap();
