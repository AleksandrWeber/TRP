import { PrismaClient } from '@prisma/client';
import {
  recordAnalyticalOwnerBootOutcome,
  type AnalyticalOwnerBootOutcome,
} from './analytical-owner-continuity-status';
import type { W3O01BDurableOwner } from './analytical-owner-store-snapshot';
import { resolvePersistenceDriverForGroup, type PersistenceGroup } from './persistence-driver';
import type { RepositoryPrismaClients } from './repository-prisma-lifecycle';

/**
 * Hydration failed for a research repository that must not fall back to an empty store.
 * `cause` is the original Prisma or hydration error.
 */
export class RepositoryHydrationError extends Error {
  readonly repositoryName: string;

  constructor(repositoryName: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : 'hydrate-failed';
    super(`Research repository "${repositoryName}" failed to hydrate: ${detail}`);
    this.name = 'RepositoryHydrationError';
    this.repositoryName = repositoryName;
    this.cause = cause;
  }
}

/**
 * Nest factory helper: pick InMemory or Prisma for an explicit persistence group.
 * `research` reads RESEARCH_PERSISTENCE_DRIVER. `w3` reads W3_PERSISTENCE_DRIVER.
 * Each falls back to PERSISTENCE_DRIVER, then memory. There is no global-only path.
 * Factory clients are owned by RepositoryPrismaLifecycle, not by PrismaService.
 * When the selected driver is prisma, hydrate is W3-O01-c owner restart recovery.
 * When `owner` is set (W3-O01-d), hydrate failure isolates that owner: empty memory store + Unavailable
 * (no fabricated durable data; other owners keep booting).
 * Research repositories pass `onHydrationFailure: 'fail'` so a failed hydrate rejects initialization
 * instead of returning that empty store.
 */
export async function createRepositoryByDriver<
  TMemory,
  TPrisma extends { hydrate(): Promise<void> },
>(options: {
  /** Research repositories or W3 analytical owners. Required. */
  group: PersistenceGroup;
  createMemory: () => TMemory;
  createPrisma: (prisma: PrismaClient) => TPrisma;
  /** W3-O01 durable analytical owner — enables continuity boot recording. */
  owner?: W3O01BDurableOwner;
  /**
   * `memory` keeps the W3 empty-store fallback. `fail` rejects initialization.
   * Defaults to `memory`.
   */
  onHydrationFailure?: 'memory' | 'fail';
  /** Required when `onHydrationFailure` is `fail`. Included in the surfaced error. */
  repositoryName?: string;
  /** Owns every PrismaClient this factory connects. Unused for the memory driver. */
  clients: RepositoryPrismaClients;
}): Promise<TMemory | TPrisma> {
  const group = options.group as string;
  if (group !== 'research' && group !== 'w3') {
    throw new Error(
      'createRepositoryByDriver requires an explicit persistence group ("research" or "w3")',
    );
  }

  const record = (outcome: AnalyticalOwnerBootOutcome, reason?: string) => {
    if (options.owner) {
      recordAnalyticalOwnerBootOutcome(options.owner, outcome, reason);
    }
  };

  if (resolvePersistenceDriverForGroup(group) !== 'prisma') {
    record('ready', 'memory-driver');
    return options.createMemory();
  }

  const failClosed = options.onHydrationFailure === 'fail';
  const repositoryName = options.repositoryName?.trim() ?? '';
  if (failClosed && repositoryName.length === 0) {
    throw new Error('repositoryName is required when onHydrationFailure is fail');
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined);
    throw error;
  }
  options.clients.register(prisma);
  const repo = options.createPrisma(prisma);
  try {
    await repo.hydrate();
    record('ready', 'hydrate-ok');
    return repo;
  } catch (error) {
    await options.clients.release(prisma);
    if (failClosed) {
      throw new RepositoryHydrationError(repositoryName, error);
    }
    const reason = error instanceof Error ? error.message : 'hydrate-failed';
    record('unavailable', reason);
    // Honest empty store — never fabricate recovered analytical state.
    return options.createMemory();
  }
}
