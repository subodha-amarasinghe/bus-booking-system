import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, TerminusModule, UserModule],
  controllers: [HealthController],
})
export class AppModule {}
