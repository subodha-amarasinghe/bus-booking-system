import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { BusSeatModule } from './bus/bus-seat.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, BusSeatModule],
  controllers: [HealthController],
})
export class AppModule {}
