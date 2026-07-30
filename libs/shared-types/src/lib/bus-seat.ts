import { z } from 'zod';

export const BusSchema = z.object({
  id: z.string().uuid(),
  plateNumber: z.string().min(1),
  name: z.string().optional(),
  capacity: z.number().int().positive(),
  operatorId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Bus = z.infer<typeof BusSchema>;

export const CreateBusRequestSchema = z.object({
  plateNumber: z.string().min(1),
  name: z.string().optional(),
  capacity: z.number().int().positive(),
  operatorId: z.string().uuid().optional(),
});
export type CreateBusRequest = z.infer<typeof CreateBusRequestSchema>;

export const ListBusesRequestSchema = z.object({
  operatorId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type ListBusesRequest = z.infer<typeof ListBusesRequestSchema>;

export const SeatLayoutSchema = z.object({
  id: z.string().uuid(),
  busId: z.string().uuid(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  seats: z.array(
    z.object({
      seatNo: z.string().min(1),
      row: z.number().int().nonnegative(),
      column: z.number().int().nonnegative(),
      type: z.enum(['STANDARD', 'WINDOW', 'AISLE', 'DISABLED']).default('STANDARD'),
      isAvailable: z.boolean().default(true),
    }),
  ),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type SeatLayout = z.infer<typeof SeatLayoutSchema>;

export const SaveSeatLayoutRequestSchema = z.object({
  busId: z.string().uuid(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
  seats: z.array(
    z.object({
      seatNo: z.string().min(1),
      row: z.number().int().nonnegative(),
      column: z.number().int().nonnegative(),
      type: z.enum(['STANDARD', 'WINDOW', 'AISLE', 'DISABLED']).default('STANDARD'),
      isAvailable: z.boolean().default(true),
    }),
  ),
});
export type SaveSeatLayoutRequest = z.infer<typeof SaveSeatLayoutRequestSchema>;

export const GetSeatLayoutByBusRequestSchema = z.object({
  busId: z.string().uuid(),
});
export type GetSeatLayoutByBusRequest = z.infer<
  typeof GetSeatLayoutByBusRequestSchema
>;

export const TripSchema = z.object({
  id: z.string().uuid(),
  busId: z.string().uuid(),
  routeId: z.string().uuid(),
  departureAt: z.coerce.date(),
  arrivalAt: z.coerce.date().optional(),
  fareAmount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
  availableSeats: z.number().int().nonnegative().optional(),
  status: z.enum(['SCHEDULED', 'BOARDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Trip = z.infer<typeof TripSchema>;

export const CreateTripRequestSchema = z.object({
  busId: z.string().uuid(),
  routeId: z.string().uuid(),
  departureAt: z.coerce.date(),
  arrivalAt: z.coerce.date().optional(),
  fareAmount: z.number().nonnegative(),
  currency: z.string().default('LKR'),
});
export type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>;

export const GetTripRequestSchema = z.object({
  tripId: z.string().uuid(),
});
export type GetTripRequest = z.infer<typeof GetTripRequestSchema>;

export const SearchTripsRequestSchema = z.object({
  originLocationId: z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  /**
   * Routes live in route-maps-service, so bus-seat-service cannot join on
   * origin/destination itself. The gateway resolves those into route ids and
   * passes them here.
   */
  routeIds: z.array(z.string().uuid()).optional(),
  departureDate: z.coerce.date().optional(),
  minFare: z.number().nonnegative().optional(),
  maxFare: z.number().nonnegative().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type SearchTripsRequest = z.infer<typeof SearchTripsRequestSchema>;
