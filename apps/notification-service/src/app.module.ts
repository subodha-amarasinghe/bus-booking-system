import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, NotificationModule],
  controllers: [HealthController],
})
export class AppModule {}
