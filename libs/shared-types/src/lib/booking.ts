import { z } from 'zod';

export enum BookingStatus {
  LOCKED = 'LOCKED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export const BookingStatusSchema = z.nativeEnum(BookingStatus);
export type BookingStatusType = z.infer<typeof BookingStatusSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  userId: z.string().uuid(),
  seatNo: z.string().min(1),
  status: BookingStatusSchema,
  passengerName: z.string().min(1),
  passengerPhone: z.string().min(1),
  fareAmount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  lockToken: z.string().optional(),
  lockExpiresAt: z.coerce.date().optional(),
  idempotencyKey: z.string().optional(),
  confirmedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Booking = z.infer<typeof BookingSchema>;

export const LockSeatRequestSchema = z.object({
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
  userId: z.string().uuid(),
});
export type LockSeatRequest = z.infer<typeof LockSeatRequestSchema>;

export const LockSeatResponseSchema = z.object({
  lockToken: z.string().min(1),
  expiresAt: z.coerce.date(),
});
export type LockSeatResponse = z.infer<typeof LockSeatResponseSchema>;

export const ConfirmBookingRequestSchema = z.object({
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
  userId: z.string().uuid(),
  lockToken: z.string().min(1),
  idempotencyKey: z.string().min(1),
  passengerName: z.string().min(1),
  passengerPhone: z.string().min(1),
});
export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingRequestSchema>;

export const ConfirmBookingResponseSchema = z.object({
  bookingId: z.string().uuid(),
  status: BookingStatusSchema,
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
  passengerName: z.string().min(1),
  passengerPhone: z.string().min(1),
  fareAmount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  confirmedAt: z.coerce.date(),
});
export type ConfirmBookingResponse = z.infer<typeof ConfirmBookingResponseSchema>;

export const SeatAvailabilitySchema = z.enum([
  'AVAILABLE',
  'LOCKED',
  'BOOKED',
  'UNAVAILABLE',
]);
export type SeatAvailability = z.infer<typeof SeatAvailabilitySchema>;

export const SeatMapSeatSchema = z.object({
  seatNo: z.string().min(1),
  row: z.number().int().nonnegative(),
  column: z.number().int().nonnegative(),
  type: z
    .enum(['STANDARD', 'WINDOW', 'AISLE', 'DISABLED'])
    .default('STANDARD'),
  status: SeatAvailabilitySchema,
  lockExpiresAt: z.coerce.date().optional(),
});
export type SeatMapSeat = z.infer<typeof SeatMapSeatSchema>;

export const SeatMapResponseSchema = z.object({
  tripId: z.string().uuid(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  seats: z.array(SeatMapSeatSchema),
  updatedAt: z.coerce.date(),
});
export type SeatMapResponse = z.infer<typeof SeatMapResponseSchema>;

export const LockSeatsRequestSchema = z.object({
  tripId: z.string().uuid(),
  seatNos: z.array(z.string().min(1)).min(1),
  userId: z.string().uuid(),
});
export type LockSeatsRequest = z.infer<typeof LockSeatsRequestSchema>;

export const SeatLockSchema = z.object({
  seatNo: z.string().min(1),
  lockToken: z.string().min(1),
  expiresAt: z.coerce.date(),
});
export type SeatLock = z.infer<typeof SeatLockSchema>;

export const LockSeatsResponseSchema = z.object({
  tripId: z.string().uuid(),
  locks: z.array(SeatLockSchema).min(1),
});
export type LockSeatsResponse = z.infer<typeof LockSeatsResponseSchema>;

export const ReleaseSeatsRequestSchema = z.object({
  tripId: z.string().uuid(),
  locks: z
    .array(
      z.object({
        seatNo: z.string().min(1),
        lockToken: z.string().min(1),
      }),
    )
    .min(1),
});
export type ReleaseSeatsRequest = z.infer<typeof ReleaseSeatsRequestSchema>;

export const ReleaseSeatsResponseSchema = z.object({
  tripId: z.string().uuid(),
  releasedSeatNos: z.array(z.string().min(1)),
});
export type ReleaseSeatsResponse = z.infer<
  typeof ReleaseSeatsResponseSchema
>;

export const MyBookingsRequestSchema = z.object({
  userId: z.string().uuid(),
});
export type MyBookingsRequest = z.infer<typeof MyBookingsRequestSchema>;

export const MyBookingsResponseSchema = z.array(BookingSchema);
export type MyBookingsResponse = z.infer<typeof MyBookingsResponseSchema>;

export const GetSeatMapRequestSchema = z.object({
  tripId: z.string().uuid(),
});
export type GetSeatMapRequest = z.infer<typeof GetSeatMapRequestSchema>;
