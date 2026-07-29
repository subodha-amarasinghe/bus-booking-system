import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { RouteModule } from './route/route.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, RouteModule],
  controllers: [HealthController],
})
export class AppModule {}
