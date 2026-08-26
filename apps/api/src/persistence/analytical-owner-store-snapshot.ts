/**
 * W3-O01-b — Owner-scoped durable analytical store snapshots.
 *
 * Physical storage for extending existing V2 analytical owners only.
 * Each Nest owner adapter reads/writes only its own `owner` row.
 * Not a new bounded context, Source of Truth, Lake, Outbox, or persistence product.
 * Not restart recovery / automatic restore orchestration (W3-O01-c+).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { W3O01AOwner } from '../platform-conformance/w3-o01-a-analytical-inventory';

/** Owners that receive durable store snapshots under W3-O01-b (SURVIVE inventory). */
export const W3_O01_B_DURABLE_OWNERS = Object.freeze([
  'reporting',
  'notification-delivery',
  'trading-orchestrator',
  'knowledge-lake',
  'market-profile',
  'market-qualification',
  'market-state',
  'exchange-scope',
  'strategy-library',
  'runtime-enforcement',
] as const satisfies readonly W3O01AOwner[]);

export type W3O01BDurableOwner = (typeof W3_O01_B_DURABLE_OWNERS)[number];

export type AnalyticalOwnerStoreSnapshotClient = Pick<PrismaClient, 'analyticalOwnerStoreSnapshot'>;

export async function loadOwnerStoreSnapshot(
  prisma: AnalyticalOwnerStoreSnapshotClient,
  owner: W3O01BDurableOwner,
): Promise<unknown | null> {
  const row = await prisma.analyticalOwnerStoreSnapshot.findUnique({ where: { owner } });
  return row?.payload ?? null;
}

export async function saveOwnerStoreSnapshot(
  prisma: AnalyticalOwnerStoreSnapshotClient,
  owner: W3O01BDurableOwner,
  payload: unknown,
): Promise<void> {
  const json = payload as Prisma.InputJsonValue;
  await prisma.analyticalOwnerStoreSnapshot.upsert({
    where: { owner },
    create: { owner, payload: json },
    update: { payload: json },
  });
}

export function persistOwnerStoreSnapshot(
  prisma: AnalyticalOwnerStoreSnapshotClient,
  owner: W3O01BDurableOwner,
  payload: unknown,
): void {
  void saveOwnerStoreSnapshot(prisma, owner, payload).catch(() => undefined);
}
