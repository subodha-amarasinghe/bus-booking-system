import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { DomainException } from '../common/exceptions/domain.exception';

/** Currencies Stripe treats as zero-decimal (amount is already the major unit). */
const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

@Injectable()
export class StripeGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string | undefined;

  constructor() {
    const secretKey =
      process.env.STRIPE_SECRET_KEY?.trim() ||
      process.env.PAYMENT_PROVIDER_KEY?.trim();
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (secretKey && secretKey.startsWith('sk_')) {
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe Checkout enabled (secret key loaded)');
    } else {
      this.stripe = null;
      this.logger.warn(
        'Stripe secret key missing — online payments will use the local stub',
      );
    }
  }

  get enabled(): boolean {
    return this.stripe !== null;
  }

  toStripeAmount(amount: number, currency: string): number {
    const code = currency.toLowerCase();
    if (ZERO_DECIMAL.has(code)) {
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }

  async createCheckoutSession(input: {
    paymentId: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    if (!this.stripe) {
      throw new DomainException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY to a sk_test_… key.',
        503,
        'STRIPE_NOT_CONFIGURED',
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: input.paymentId,
      customer_email: undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: this.toStripeAmount(input.amount, input.currency),
            product_data: {
              name: 'Bus booking',
              description: `Booking ${input.bookingId}`,
            },
          },
        },
      ],
      metadata: {
        paymentId: input.paymentId,
        bookingId: input.bookingId,
        userId: input.userId,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new DomainException(
        'Stripe did not return a Checkout URL',
        502,
        'STRIPE_SESSION_FAILED',
      );
    }

    return { sessionId: session.id, checkoutUrl: session.url };
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new DomainException(
        'Stripe is not configured',
        503,
        'STRIPE_NOT_CONFIGURED',
      );
    }
    if (!this.webhookSecret) {
      throw new DomainException(
        'STRIPE_WEBHOOK_SECRET is not set',
        503,
        'STRIPE_WEBHOOK_NOT_CONFIGURED',
      );
    }
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}
