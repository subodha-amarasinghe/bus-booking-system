import { z } from 'zod';

/** Passenger-facing seat labels are sequential integers, never row letters. */
export const SeatNoSchema = z.coerce.number().int().min(1).max(59);
export type SeatNo = z.infer<typeof SeatNoSchema>;
