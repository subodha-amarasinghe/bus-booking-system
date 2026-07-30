import {
  LocationSchema,
  RouteSchema,
  type Location,
  type Route,
} from '@bus-booking/shared-types';
import { API_GATEWAY_URL } from './route-proxy';

/**
 * Only the fields the passenger UI renders are kept, so a select option stays
 * serialisable across the server/client boundary (no Date instances).
 */
const LocationOptionSchema = LocationSchema.pick({
  id: true,
  name: true,
  code: true,
  city: true,
});

const RouteOptionSchema = RouteSchema.pick({
  id: true,
  name: true,
  routeNumber: true,
  originLocationId: true,
  destinationLocationId: true,
  estimatedDurationMin: true,
});

export type LocationOption = Pick<Location, 'id' | 'name' | 'code' | 'city'>;
export type RouteOption = Pick<
  Route,
  | 'id'
  | 'name'
  | 'routeNumber'
  | 'originLocationId'
  | 'destinationLocationId'
  | 'estimatedDurationMin'
>;

async function postPublic(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${API_GATEWAY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function unwrapList(body: unknown): unknown {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && 'items' in body) {
    return (body as { items: unknown }).items;
  }
  return [];
}

/** Locations power the origin/destination selects on the landing and search pages. */
export async function getLocations(): Promise<LocationOption[]> {
  try {
    const body = await postPublic('/routes/locations/list', { limit: 200 });
    const parsed = LocationOptionSchema.array().safeParse(unwrapList(body));
    if (!parsed.success) return [];
    return [...parsed.data].sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function getRoutes(): Promise<RouteOption[]> {
  try {
    const body = await postPublic('/routes/list', { limit: 200 });
    return RouteOptionSchema.array().safeParse(unwrapList(body)).data ?? [];
  } catch {
    return [];
  }
}

export interface RouteLabel {
  readonly name: string;
  readonly routeNumber?: string | null;
  readonly origin?: string;
  readonly destination?: string;
  readonly estimatedDurationMin?: number;
}

/**
 * Trips only carry a `routeId`, so search results resolve human-readable
 * endpoints by joining the public route and location lists.
 */
export async function getRouteLabels(): Promise<Record<string, RouteLabel>> {
  const [routes, locations] = await Promise.all([getRoutes(), getLocations()]);
  const names = new Map(locations.map((location) => [location.id, location.name]));

  return Object.fromEntries(
    routes.map((route) => [
      route.id,
      {
        name: route.name,
        routeNumber: route.routeNumber,
        origin: names.get(route.originLocationId),
        destination: names.get(route.destinationLocationId),
        estimatedDurationMin: route.estimatedDurationMin,
      },
    ]),
  );
}

/** Location codes seeded by `pnpm db:seed`; unknown codes are skipped. */
const POPULAR_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['CMB', 'KDY'],
  ['CMB', 'GAL'],
  ['CMB', 'JAF'],
  ['GAL', 'MAT'],
];

export interface PopularRoute {
  readonly label: string;
  readonly originLocationId: string;
  readonly destinationLocationId: string;
}

export function getPopularRoutes(locations: LocationOption[]): PopularRoute[] {
  const byCode = new Map(
    locations
      .filter((location): location is LocationOption & { code: string } =>
        Boolean(location.code),
      )
      .map((location) => [location.code, location]),
  );

  return POPULAR_PAIRS.flatMap(([originCode, destinationCode]) => {
    const origin = byCode.get(originCode);
    const destination = byCode.get(destinationCode);
    if (!origin || !destination) return [];
    return [
      {
        label: `${origin.city ?? origin.name} → ${destination.city ?? destination.name}`,
        originLocationId: origin.id,
        destinationLocationId: destination.id,
      },
    ];
  });
}
