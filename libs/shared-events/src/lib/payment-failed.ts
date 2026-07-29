import { z } from 'zod';

export const PAYMENT_FAILED = 'payment.failed' as const;

export const PaymentFailedSchema = z.object({
  event: z.literal(PAYMENT_FAILED),
  paymentId: z.string().uuid(),
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  reason: z.string().optional(),
  occurredAt: z.coerce.date(),
});
export type PaymentFailed = z.infer<typeof PaymentFailedSchema>;
