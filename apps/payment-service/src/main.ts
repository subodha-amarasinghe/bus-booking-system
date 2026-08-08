import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  // rawBody is required for Stripe webhook signature verification.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalFilters(new DomainExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'payment_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  // Docker sets PORT; local Nx health checks historically used HEALTH_PORT.
  const port = Number(process.env.PORT ?? process.env.HEALTH_PORT ?? 3006);
  await app.listen(port);
  Logger.log(
    `Payment service HTTP on :${port} (health + Stripe webhooks), RMQ queue payment_queue`,
  );
}

bootstrap();
