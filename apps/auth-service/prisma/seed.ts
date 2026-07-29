import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword, SEED_PASSWORD, users } from '../../../tools/seed/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for auth-service');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main(): Promise<void> {
  const passwordHash = hashPassword(SEED_PASSWORD);

  for (const user of users) {
    await prisma.userCredential.upsert({
      where: { id: user.id },
      update: { phone: user.phone, passwordHash, role: user.role },
      create: {
        id: user.id,
        phone: user.phone,
        passwordHash,
        role: user.role,
      },
    });
  }

  console.log(`auth-service: seeded ${users.length} credentials`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
