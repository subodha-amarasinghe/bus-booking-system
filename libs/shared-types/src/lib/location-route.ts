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

export const RouteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  originLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  distanceKm: z.number().nonnegative().optional(),
  estimatedDurationMin: z.number().int().nonnegative().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Route = z.infer<typeof RouteSchema>;

export const CreateRouteRequestSchema = z.object({
  name: z.string().min(1),
  originLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  distanceKm: z.number().nonnegative().optional(),
  estimatedDurationMin: z.number().int().nonnegative().optional(),
});
export type CreateRouteRequest = z.infer<typeof CreateRouteRequestSchema>;

export const GetOsmPathRequestSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
});
export type GetOsmPathRequest = z.infer<typeof GetOsmPathRequestSchema>;

export const OsmPathResponseSchema = z.object({
  distanceKm: z.number().nonnegative(),
  durationMin: z.number().nonnegative(),
  coordinates: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  ),
});
export type OsmPathResponse = z.infer<typeof OsmPathResponseSchema>;
