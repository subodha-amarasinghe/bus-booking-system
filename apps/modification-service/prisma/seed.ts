import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { cancellations, refunds } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for modification-service');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  for (const cancellation of cancellations) {
    await prisma.cancellation.upsert({
      where: { id: cancellation.id },
      update: cancellation,
      create: cancellation,
    });
  }

  // Refunds hang off a cancellation, so they are inserted afterwards.
  for (const refund of refunds) {
    await prisma.refund.upsert({
      where: { id: refund.id },
      update: refund,
      create: refund,
    });
  }

  console.log(
    `modification-service: seeded ${cancellations.length} cancellations, ${refunds.length} refunds`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
