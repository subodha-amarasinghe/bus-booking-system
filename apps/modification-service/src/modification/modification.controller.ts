import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CalculateRefundRequestSchema,
  CancellationRequestSchema,
  GetCancellationPolicyRequestSchema,
  UpsertCancellationPolicyRequestSchema,
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
import { ModificationService } from './modification.service';

@Controller()
export class ModificationController {
  constructor(private readonly modificationService: ModificationService) {}

  @MessagePattern(CANCELLATION_REQUEST)
  request(
    @Payload(new ZodValidationPipe(CancellationRequestSchema))
    dto: CancellationRequest,
  ) {
    return this.modificationService.requestCancellation(dto);
  }

  @MessagePattern(REFUND_CALCULATE)
  calculateRefund(
    @Payload(new ZodValidationPipe(CalculateRefundRequestSchema))
    dto: CalculateRefundRequest,
  ) {
    return this.modificationService.calculateRefund(dto);
  }

  @MessagePattern(CANCELLATION_POLICY_GET)
  getPolicy(
    @Payload(new ZodValidationPipe(GetCancellationPolicyRequestSchema))
    _dto: GetCancellationPolicyRequest,
  ) {
    return this.modificationService.getActivePolicy();
  }

  @MessagePattern(CANCELLATION_POLICY_UPSERT)
  upsertPolicy(
    @Payload(new ZodValidationPipe(UpsertCancellationPolicyRequestSchema))
    dto: UpsertCancellationPolicyRequest,
  ) {
    return this.modificationService.upsertPolicy(dto);
  }
}
