import { z } from 'zod';

export const SEAT_SOCKET_JOIN_TRIP = 'joinTrip' as const;
export const SEAT_SOCKET_LOCKED = 'seat.locked' as const;
export const SEAT_SOCKET_RELEASED = 'seat.released' as const;
export const SEAT_SOCKET_BOOKED = 'seat.booked' as const;

export const SeatSocketJoinTripSchema = z.object({
  tripId: z.string().uuid(),
});
export type SeatSocketJoinTrip = z.infer<typeof SeatSocketJoinTripSchema>;

export const SeatSocketLockedSchema = z.object({
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
  lockToken: z.string().min(1),
});
export type SeatSocketLocked = z.infer<typeof SeatSocketLockedSchema>;

export const SeatSocketReleasedSchema = z.object({
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
});
export type SeatSocketReleased = z.infer<typeof SeatSocketReleasedSchema>;

export const SeatSocketBookedSchema = z.object({
  tripId: z.string().uuid(),
  seatNo: z.string().min(1),
  bookingId: z.string().uuid(),
});
export type SeatSocketBooked = z.infer<typeof SeatSocketBookedSchema>;
