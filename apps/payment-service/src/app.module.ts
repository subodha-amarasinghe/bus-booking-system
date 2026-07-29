import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentModule } from './payment/payment.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, PaymentModule],
  controllers: [HealthController],
})
export class AppModule {}
