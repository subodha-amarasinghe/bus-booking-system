import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3100', 'http://localhost:3005', 'http://localhost:3200', 'http://localhost:*'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DomainExceptionFilter());
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API Gateway listening on http://localhost:${port}/api`);
}

bootstrap();
