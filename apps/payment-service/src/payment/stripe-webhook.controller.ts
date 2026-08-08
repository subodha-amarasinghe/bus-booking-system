import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { DomainException } from '../common/exceptions/domain.exception';
import { PaymentService } from './payment.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe')
  @HttpCode(200)
  handleStripe(
    @Req() req: RawBodyRequest<{ rawBody?: Buffer }>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) {
      throw new DomainException(
        'Missing Stripe-Signature header',
        400,
        'STRIPE_SIGNATURE_MISSING',
      );
    }
    if (!req.rawBody) {
      throw new DomainException(
        'Raw body unavailable — enable NestFactory rawBody',
        500,
        'STRIPE_RAW_BODY_MISSING',
      );
    }
    return this.paymentService.handleStripeWebhook(req.rawBody, signature);
  }
}
