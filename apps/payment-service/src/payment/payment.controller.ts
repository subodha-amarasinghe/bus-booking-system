import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ProcessOnlinePaymentRequestSchema,
  RecordOfflinePaymentRequestSchema,
  type ProcessOnlinePaymentRequest,
  type RecordOfflinePaymentRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  PAYMENT_PROCESS_ONLINE,
  PAYMENT_RECORD_OFFLINE,
} from '@bus-booking/shared-events';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(PAYMENT_PROCESS_ONLINE)
  processOnline(
    @Payload(new ZodValidationPipe(ProcessOnlinePaymentRequestSchema))
    dto: ProcessOnlinePaymentRequest,
  ) {
    return this.paymentService.processOnline(dto);
  }

  @MessagePattern(PAYMENT_RECORD_OFFLINE)
  recordOffline(
    @Payload(new ZodValidationPipe(RecordOfflinePaymentRequestSchema))
    dto: RecordOfflinePaymentRequest,
  ) {
    return this.paymentService.recordOffline(dto);
  }
}
