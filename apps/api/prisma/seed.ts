import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const logger = new Logger('Seed');

  const email = process.env.SEED_USER_EMAIL ?? 'admin@trp.local';
  const password = process.env.SEED_USER_PASSWORD ?? 'trp-admin-change-me';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMINISTRATOR },
    create: {
      email,
      passwordHash,
      role: Role.ADMINISTRATOR,
    },
  });

  logger.log(`Seeded user ${user.email} (${user.role})`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
