import type { Location, Route } from '@bus-booking/shared-types';
import { useQuery } from '@tanstack/react-query';
import { gatewayRequest } from './gateway';

/** Both list endpoints are public, so they work before the passenger signs in. */
export function useLocations() {
  return useQuery({
    queryKey: ['catalog', 'locations'],
    queryFn: () =>
      gatewayRequest<Location[]>('/routes/locations/list', {
        body: { limit: 200 },
        auth: false,
      }),
    staleTime: 5 * 60_000,
  });
}

export function useRoutes() {
  return useQuery({
    queryKey: ['catalog', 'routes'],
    queryFn: () =>
      gatewayRequest<Route[]>('/routes/list', {
        body: { limit: 200 },
        auth: false,
      }),
    staleTime: 5 * 60_000,
  });
}

export function locationName(
  locations: Location[] | undefined,
  id: string | undefined,
): string {
  if (!id) return '—';
  return locations?.find((location) => location.id === id)?.name ?? '—';
}

/**
 * Trips only carry a `routeId`, so the route list is what turns a trip into a
 * human-readable "Origin → Destination" label.
 */
export function routeLabel(
  routes: Route[] | undefined,
  locations: Location[] | undefined,
  routeId: string,
): string {
  const route = routes?.find((candidate) => candidate.id === routeId);
  if (!route) return 'Route';
  if (route.name) {
    return route.routeNumber
      ? `${route.name} [${route.routeNumber}]`
      : route.name;
  }
  return `${locationName(locations, route.originLocationId)} → ${locationName(
    locations,
    route.destinationLocationId,
  )}`;
}
