import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CalculateRefundRequestSchema,
  CancellationRequestSchema,
  type CalculateRefundRequest,
  type CancellationRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  CANCELLATION_REQUEST,
  REFUND_CALCULATE,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cancellations')
@UseGuards(JwtAuthGuard)
export class CancellationsController {
  constructor(
    @Inject('MODIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post('request')
  request(
    @Body(new ZodValidationPipe(CancellationRequestSchema))
    dto: CancellationRequest,
  ) {
    return firstValueFrom(this.client.send(CANCELLATION_REQUEST, dto));
  }

  @Post('refund/calculate')
  calculateRefund(
    @Body(new ZodValidationPipe(CalculateRefundRequestSchema))
    dto: CalculateRefundRequest,
  ) {
    return firstValueFrom(this.client.send(REFUND_CALCULATE, dto));
  }
}
