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
      queue: 'modification_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  const port = Number(process.env.HEALTH_PORT ?? 3017);
  await app.listen(port);
  Logger.log(
    `Modification service health on :${port}, RMQ queue modification_queue`,
  );
}

bootstrap();
