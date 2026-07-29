import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ProcessOnlinePaymentRequestSchema,
  RecordOfflinePaymentRequestSchema,
  UserRole,
  type ProcessOnlinePaymentRequest,
  type RecordOfflinePaymentRequest,
} from '@bus-booking/shared-types';
import { ZodValidationPipe } from '@bus-booking/shared-types/nest';
import {
  PAYMENT_PROCESS_ONLINE,
  PAYMENT_RECORD_OFFLINE,
} from '@bus-booking/shared-events';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Post('online')
  processOnline(
    @Body(new ZodValidationPipe(ProcessOnlinePaymentRequestSchema))
    dto: ProcessOnlinePaymentRequest,
  ) {
    return firstValueFrom(this.client.send(PAYMENT_PROCESS_ONLINE, dto));
  }

  @Post('offline')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN_STAFF, UserRole.CUSTOMER_STAFF)
  recordOffline(
    @Body(new ZodValidationPipe(RecordOfflinePaymentRequestSchema))
    dto: RecordOfflinePaymentRequest,
  ) {
    return firstValueFrom(this.client.send(PAYMENT_RECORD_OFFLINE, dto));
  }
}
