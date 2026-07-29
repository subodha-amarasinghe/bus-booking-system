import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { BookingModule } from './booking/booking.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, RedisModule, TerminusModule, BookingModule],
  controllers: [HealthController],
})
export class AppModule {}
