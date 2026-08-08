import { z } from 'zod';

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export const RefundStatusSchema = z.nativeEnum(RefundStatus);

export const RefundSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  status: RefundStatusSchema,
  reason: z.string().optional(),
  processedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Refund = z.infer<typeof RefundSchema>;

export const CancellationRequestSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().optional(),
});
export type CancellationRequest = z.infer<typeof CancellationRequestSchema>;

export const CalculateRefundRequestSchema = z.object({
  bookingId: z.string().uuid(),
  cancellationAt: z.coerce.date().optional(),
  /** Hours remaining until departure; drives which policy tier applies. */
  hoursBeforeDeparture: z.number().nonnegative().optional(),
  /** Fare to base the refund on. Falls back to a stub amount when omitted. */
  fareAmount: z.number().nonnegative().optional(),
});
export type CalculateRefundRequest = z.infer<typeof CalculateRefundRequestSchema>;
