import { z } from 'zod';

export const BOOKING_CONFIRMED = 'booking.confirmed' as const;

export const BookingConfirmedSchema = z.object({
  event: z.literal(BOOKING_CONFIRMED),
  bookingId: z.string().uuid(),
  tripId: z.string().uuid(),
  userId: z.string().uuid(),
  seatNo: z.coerce.number().int().min(1).max(59),
  fareAmount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  passengerName: z.string(),
  passengerPhone: z.string(),
  occurredAt: z.coerce.date(),
});
export type BookingConfirmed = z.infer<typeof BookingConfirmedSchema>;
