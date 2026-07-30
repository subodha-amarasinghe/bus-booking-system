import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  district: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Location = z.infer<typeof LocationSchema>;

export const CreateLocationRequestSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  district: z.string().optional(),
});
export type CreateLocationRequest = z.infer<typeof CreateLocationRequestSchema>;

export const RouteCoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type RouteCoordinate = z.infer<typeof RouteCoordinateSchema>;

/**
 * Sri Lankan route identifiers are usually numeric, but variants such as
 * "138/1" and "1-1" are also used.
 */
export const SriLankanBusRouteNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^\d+(?:[/-]\d+)?[A-Za-z]?$/);

export const ListLocationsRequestSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type ListLocationsRequest = z.infer<typeof ListLocationsRequestSchema>;

export const RouteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  routeNumber: z.string().nullable().optional(),
  originLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  distanceKm: z
    .number()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? undefined),
  estimatedDurationMin: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? undefined),
  pathCoordinates: z
    .array(RouteCoordinateSchema)
    .nullish()
    .transform((value) => value ?? undefined),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Route = z.infer<typeof RouteSchema>;

export const CreateRouteRequestSchema = z
  .object({
    routeNumber: SriLankanBusRouteNumberSchema,
    originLocationId: z.string().uuid(),
    destinationLocationId: z.string().uuid(),
  })
  .refine((route) => route.originLocationId !== route.destinationLocationId, {
    message: 'Origin and destination must be different',
    path: ['destinationLocationId'],
  });
export type CreateRouteRequest = z.infer<typeof CreateRouteRequestSchema>;

export const ListRoutesRequestSchema = z.object({
  originLocationId: z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});
export type ListRoutesRequest = z.infer<typeof ListRoutesRequestSchema>;

export const GetOsmPathRequestSchema = z.object({
  routeNumber: SriLankanBusRouteNumberSchema.optional(),
  originLat: z.number(),
  originLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
});
export type GetOsmPathRequest = z.infer<typeof GetOsmPathRequestSchema>;

export const OsmPathResponseSchema = z.object({
  distanceKm: z.number().nonnegative(),
  durationMin: z.number().nonnegative(),
  coordinates: z.array(RouteCoordinateSchema),
});
export type OsmPathResponse = z.infer<typeof OsmPathResponseSchema>;
