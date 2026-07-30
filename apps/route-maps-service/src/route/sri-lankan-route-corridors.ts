import type { RouteCoordinate } from '@bus-booking/shared-types';

/**
 * Major control points for route-number-specific Sri Lankan bus corridors.
 * OSRM snaps these points to real roads and returns the detailed road geometry.
 */
const CORRIDORS: Readonly<Record<string, readonly RouteCoordinate[]>> = {
  // Colombo ↔ Kandy via the A1.
  '1': [
    { lat: 7.142, lng: 80.096 },
    { lat: 7.2269, lng: 80.195 },
    { lat: 7.2513, lng: 80.3464 },
    { lat: 7.2519, lng: 80.4464 },
    { lat: 7.2545, lng: 80.5272 },
    { lat: 7.2662, lng: 80.5966 },
  ],
  // Colombo ↔ Jaffna via Kurunegala, Dambulla and Vavuniya.
  '15': [
    { lat: 7.142, lng: 80.096 },
    { lat: 7.2269, lng: 80.195 },
    { lat: 7.4863, lng: 80.3647 },
    { lat: 7.8742, lng: 80.6511 },
    { lat: 8.0375, lng: 80.598 },
    { lat: 8.5395, lng: 80.4951 },
    { lat: 8.7514, lng: 80.4971 },
    { lat: 9.133, lng: 80.445 },
    { lat: 9.3803, lng: 80.377 },
  ],
  // Colombo ↔ Jaffna via Negombo, Puttalam and Anuradhapura.
  '87': [
    { lat: 7.2083, lng: 79.8358 },
    { lat: 7.5758, lng: 79.7953 },
    { lat: 8.0362, lng: 79.8283 },
    { lat: 8.2684, lng: 80.2151 },
    { lat: 8.3114, lng: 80.4037 },
    { lat: 8.5395, lng: 80.4951 },
    { lat: 8.7514, lng: 80.4971 },
    { lat: 9.133, lng: 80.445 },
    { lat: 9.3803, lng: 80.377 },
  ],
};

function distanceSquared(a: RouteCoordinate, b: RouteCoordinate): number {
  return (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;
}

export function sriLankanRouteWaypoints(
  routeNumber: string | undefined,
  origin: RouteCoordinate,
  destination: RouteCoordinate,
): RouteCoordinate[] {
  if (!routeNumber) return [];
  const normalized = routeNumber.trim().split(/[/-]/)[0];
  const corridor = CORRIDORS[normalized];
  if (!corridor?.length) return [];

  const points = [...corridor];
  const forward =
    distanceSquared(origin, points[0]) < 0.25 &&
    distanceSquared(destination, points[points.length - 1]) < 0.25;
  const reverse =
    distanceSquared(origin, points[points.length - 1]) < 0.25 &&
    distanceSquared(destination, points[0]) < 0.25;

  if (!forward && !reverse) return [];
  return forward ? points : points.reverse();
}
