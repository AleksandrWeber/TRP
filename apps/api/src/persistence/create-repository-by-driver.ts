import { PrismaClient } from '@prisma/client';
import { resolvePersistenceDriver } from './persistence-driver';

/**
 * Nest factory helper: pick InMemory or Prisma repository by PERSISTENCE_DRIVER (US104).
 * No Nest PrismaService injection required (keeps isolated module DI tests green).
 * When driver=prisma, hydrate is W3-O01-c owner restart recovery.
 */
export async function createRepositoryByDriver<
  TMemory,
  TPrisma extends { hydrate(): Promise<void> },
>(options: {
  createMemory: () => TMemory;
  createPrisma: (prisma: PrismaClient) => TPrisma;
}): Promise<TMemory | TPrisma> {
  if (resolvePersistenceDriver() !== 'prisma') {
    return options.createMemory();
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  const repo = options.createPrisma(prisma);
  await repo.hydrate();
  return repo;
}
