import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { ModificationModule } from './modification/modification.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, ModificationModule],
  controllers: [HealthController],
})
export class AppModule {}
