import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CalculateRefundRequestSchema,
  CancellationRequestSchema,
  GetCancellationPolicyRequestSchema,
  UpsertCancellationPolicyRequestSchema,
  UserRole,
  type CalculateRefundRequest,
  type CancellationRequest,
  type GetCancellationPolicyRequest,
  type UpsertCancellationPolicyRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  CANCELLATION_POLICY_GET,
  CANCELLATION_POLICY_UPSERT,
  CANCELLATION_REQUEST,
  REFUND_CALCULATE,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('cancellations')
export class CancellationsController {
  constructor(
    @Inject('MODIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  request(
    @Body(new ZodValidationPipe(CancellationRequestSchema))
    dto: CancellationRequest,
  ) {
    return firstValueFrom(this.client.send(CANCELLATION_REQUEST, dto));
  }

  @Post('refund/calculate')
  @UseGuards(JwtAuthGuard)
  calculateRefund(
    @Body(new ZodValidationPipe(CalculateRefundRequestSchema))
    dto: CalculateRefundRequest,
  ) {
    return firstValueFrom(this.client.send(REFUND_CALCULATE, dto));
  }

  /** Public — passengers need to read the policy without signing in. */
  @Post('policy/get')
  getPolicy(
    @Body(new ZodValidationPipe(GetCancellationPolicyRequestSchema))
    dto: GetCancellationPolicyRequest,
  ) {
    return firstValueFrom(this.client.send(CANCELLATION_POLICY_GET, dto));
  }

  @Post('policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_STAFF)
  upsertPolicy(
    @Body(new ZodValidationPipe(UpsertCancellationPolicyRequestSchema))
    dto: UpsertCancellationPolicyRequest,
  ) {
    return firstValueFrom(this.client.send(CANCELLATION_POLICY_UPSERT, dto));
  }
}
