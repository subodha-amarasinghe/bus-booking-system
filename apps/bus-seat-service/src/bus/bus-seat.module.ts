import { Module } from '@nestjs/common';
import { BusSeatController } from './bus-seat.controller';
import { BusSeatService } from './bus-seat.service';
import { BusSeatRepository } from './bus-seat.repository';

@Module({
  controllers: [BusSeatController],
  providers: [BusSeatService, BusSeatRepository],
})
export class BusSeatModule {}
