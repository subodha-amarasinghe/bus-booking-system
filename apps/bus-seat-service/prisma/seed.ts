import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { buses, seatLayouts, trips } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for bus-seat-service');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  for (const bus of buses) {
    const record = {
      id: bus.id,
      plateNumber: bus.plateNumber,
      name: bus.name,
      capacity: bus.capacity,
      operatorId: bus.operatorId,
    };
    await prisma.bus.upsert({
      where: { id: bus.id },
      update: record,
      create: record,
    });
  }

  for (const layout of seatLayouts) {
    await prisma.seatLayout.upsert({
      where: { busId: layout.busId },
      update: { rows: layout.rows, columns: layout.columns, seats: layout.seats },
      create: {
        id: layout.id,
        busId: layout.busId,
        rows: layout.rows,
        columns: layout.columns,
        seats: layout.seats,
      },
    });
  }

  for (const trip of trips) {
    await prisma.trip.upsert({
      where: { id: trip.id },
      update: trip,
      create: trip,
    });
  }

  console.log(
    `bus-seat-service: seeded ${buses.length} buses, ${seatLayouts.length} layouts, ${trips.length} trips`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
