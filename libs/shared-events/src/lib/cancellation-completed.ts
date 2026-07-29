import { z } from 'zod';

export const CANCELLATION_COMPLETED = 'cancellation.completed' as const;

export const CancellationCompletedSchema = z.object({
  event: z.literal(CANCELLATION_COMPLETED),
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  refundId: z.string().uuid().optional(),
  refundAmount: z.number().nonnegative().optional(),
  currency: z.string().default('LKR'),
  reason: z.string().optional(),
  occurredAt: z.coerce.date(),
});
export type CancellationCompleted = z.infer<typeof CancellationCompletedSchema>;
