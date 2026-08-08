import { z } from 'zod';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export const PaymentStatusSchema = z.nativeEnum(PaymentStatus);

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  CASH = 'CASH',
  CARD = 'CARD',
}

export const PaymentMethodSchema = z.nativeEnum(PaymentMethod);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  status: PaymentStatusSchema,
  method: PaymentMethodSchema,
  providerRef: z.string().optional(),
  failureReason: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const ProcessOnlinePaymentRequestSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('LKR'),
  provider: z.string().min(1).optional(),
  /** Where Stripe should send the passenger after Checkout (success/cancel base). */
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
export type ProcessOnlinePaymentRequest = z.infer<
  typeof ProcessOnlinePaymentRequestSchema
>;

/** Online pay may return a hosted Checkout URL while the payment stays PENDING. */
export const ProcessOnlinePaymentResponseSchema = PaymentSchema.extend({
  checkoutUrl: z.string().url().optional(),
});
export type ProcessOnlinePaymentResponse = z.infer<
  typeof ProcessOnlinePaymentResponseSchema
>;

export const RecordOfflinePaymentRequestSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('LKR'),
  method: z.enum(['OFFLINE', 'CASH', 'CARD']).default('CASH'),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
});
export type RecordOfflinePaymentRequest = z.infer<
  typeof RecordOfflinePaymentRequestSchema
>;
