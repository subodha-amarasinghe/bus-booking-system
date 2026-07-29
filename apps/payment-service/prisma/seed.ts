import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { payments } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for payment-service');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  for (const payment of payments) {
    const record = {
      ...payment,
      providerRef: payment.providerRef ?? undefined,
      paidAt: payment.paidAt ?? undefined,
    };
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: record,
      create: record,
    });
  }

  console.log(`payment-service: seeded ${payments.length} payments`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
