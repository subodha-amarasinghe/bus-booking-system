import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { sriLankanRouteWaypoints } from '../src/route/sri-lankan-route-corridors';
import { locations, routes } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for route-maps-service');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function roadPath(
  routeNumber: string,
  originId: string,
  destinationId: string,
) {
  const origin = locations.find((location) => location.id === originId);
  const destination = locations.find(
    (location) => location.id === destinationId,
  );
  if (!origin || !destination) return undefined;

  try {
    const baseUrl =
      process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
    const waypoints = sriLankanRouteWaypoints(
      routeNumber,
      {
        lat: origin.latitude,
        lng: origin.longitude,
      },
      {
        lat: destination.latitude,
        lng: destination.longitude,
      },
    );
    const points = [
      { lat: origin.latitude, lng: origin.longitude },
      ...waypoints,
      { lat: destination.latitude, lng: destination.longitude },
    ]
      .map(({ lat, lng }) => `${lng},${lat}`)
      .join(';');
    const response = await fetch(
      `${baseUrl}/route/v1/driving/${points}?overview=simplified&geometries=geojson`,
    );
    if (!response.ok) return undefined;
    const body = (await response.json()) as {
      routes?: Array<{ geometry: { coordinates: [number, number][] } }>;
    };
    return body.routes?.[0]?.geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  for (const location of locations) {
    await prisma.location.upsert({
      where: { id: location.id },
      update: location,
      create: location,
    });
  }

  // Routes reference locations, so they must be inserted afterwards.
  for (const route of routes) {
    const pathCoordinates = await roadPath(
      route.routeNumber,
      route.originLocationId,
      route.destinationLocationId,
    );
    const data = { ...route, pathCoordinates };
    await prisma.route.upsert({
      where: { id: route.id },
      update: data,
      create: data,
    });
  }

  console.log(
    `route-maps-service: seeded ${locations.length} locations, ${routes.length} routes`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
