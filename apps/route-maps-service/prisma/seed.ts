import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { locations, routes } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for route-maps-service');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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
    await prisma.route.upsert({
      where: { id: route.id },
      update: route,
      create: route,
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
