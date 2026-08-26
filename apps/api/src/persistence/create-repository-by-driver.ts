import { PrismaClient } from '@prisma/client';
import {
  recordAnalyticalOwnerBootOutcome,
  type AnalyticalOwnerBootOutcome,
} from './analytical-owner-continuity-status';
import type { W3O01BDurableOwner } from './analytical-owner-store-snapshot';
import { resolvePersistenceDriver } from './persistence-driver';

/**
 * Nest factory helper: pick InMemory or Prisma repository by PERSISTENCE_DRIVER (US104).
 * No Nest PrismaService injection required (keeps isolated module DI tests green).
 * When driver=prisma, hydrate is W3-O01-c owner restart recovery.
 * When `owner` is set (W3-O01-d), hydrate failure isolates that owner: empty memory store + Unavailable
 * (no fabricated durable data; other owners keep booting).
 */
export async function createRepositoryByDriver<
  TMemory,
  TPrisma extends { hydrate(): Promise<void> },
>(options: {
  createMemory: () => TMemory;
  createPrisma: (prisma: PrismaClient) => TPrisma;
  /** W3-O01 durable analytical owner — enables continuity boot recording. */
  owner?: W3O01BDurableOwner;
}): Promise<TMemory | TPrisma> {
  const record = (outcome: AnalyticalOwnerBootOutcome, reason?: string) => {
    if (options.owner) {
      recordAnalyticalOwnerBootOutcome(options.owner, outcome, reason);
    }
  };

  if (resolvePersistenceDriver() !== 'prisma') {
    record('ready', 'memory-driver');
    return options.createMemory();
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  const repo = options.createPrisma(prisma);
  try {
    await repo.hydrate();
    record('ready', 'hydrate-ok');
    return repo;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'hydrate-failed';
    record('unavailable', reason);
    await prisma.$disconnect().catch(() => undefined);
    // Honest empty store — never fabricate recovered analytical state.
    return options.createMemory();
  }
}
