import { z } from 'zod';

export const PAYMENT_SUCCEEDED = 'payment.succeeded' as const;

export const PaymentSucceededSchema = z.object({
  event: z.literal(PAYMENT_SUCCEEDED),
  paymentId: z.string().uuid(),
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  method: z.string(),
  providerRef: z.string().optional(),
  occurredAt: z.coerce.date(),
});
export type PaymentSucceeded = z.infer<typeof PaymentSucceededSchema>;
