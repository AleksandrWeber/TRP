/**
 * W3-O01-c — Analytical restart recovery foundation.
 *
 * Restores W3-O01-b owner snapshots after a normal process restart.
 * Uses existing owners and existing persistence only.
 *
 * Not Business Continuity, HA, Disaster Recovery, failover, or a new bounded context.
 * Not a background recovery scheduler. Not restart orchestration product (V3-O03).
 */

import {
  loadOwnerStoreSnapshot,
  type AnalyticalOwnerStoreSnapshotClient,
  type W3O01BDurableOwner,
  W3_O01_B_DURABLE_OWNERS,
} from './analytical-owner-store-snapshot';

/**
 * Deterministic recovery order.
 * Producers / SoT / isolation before consumers. No cycles.
 */
export const W3_O01_C_RECOVERY_ORDER = Object.freeze([
  'strategy-library',
  'exchange-scope',
  'knowledge-lake',
  'market-profile',
  'market-qualification',
  'market-state',
  'reporting',
  'notification-delivery',
  'trading-orchestrator',
  'runtime-enforcement',
] as const satisfies readonly W3O01BDurableOwner[]);

export type W3O01CRecoveryOwner = (typeof W3_O01_C_RECOVERY_ORDER)[number];

/** Declared consume-after relationships (edges from earlier → later). */
export const W3_O01_C_RECOVERY_DEPENDENCIES = Object.freeze({
  'strategy-library': Object.freeze([] as const),
  'exchange-scope': Object.freeze([] as const),
  'knowledge-lake': Object.freeze([] as const),
  'market-profile': Object.freeze([] as const),
  'market-qualification': Object.freeze(['exchange-scope', 'market-profile'] as const),
  'market-state': Object.freeze([
    'market-qualification',
    'market-profile',
    'exchange-scope',
  ] as const),
  reporting: Object.freeze(['knowledge-lake'] as const),
  'notification-delivery': Object.freeze([] as const),
  'trading-orchestrator': Object.freeze([
    'strategy-library',
    'exchange-scope',
    'market-state',
  ] as const),
  'runtime-enforcement': Object.freeze(['strategy-library'] as const),
} as const satisfies Record<W3O01CRecoveryOwner, readonly W3O01CRecoveryOwner[]>);

export class AnalyticalRestartRecoveryError extends Error {
  readonly owner: W3O01BDurableOwner;
  readonly code: 'CORRUPT_SNAPSHOT' | 'RECOVERY_ORDER' | 'UNKNOWN_OWNER';

  constructor(
    owner: W3O01BDurableOwner | string,
    code: AnalyticalRestartRecoveryError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'AnalyticalRestartRecoveryError';
    this.owner = owner as W3O01BDurableOwner;
    this.code = code;
  }
}

export type AnalyticalOwnerRestoreStep = Readonly<{
  owner: W3O01CRecoveryOwner;
  restore: () => Promise<void>;
}>;

export type AnalyticalRestartRecoveryResult = Readonly<{
  restoredOwners: readonly W3O01CRecoveryOwner[];
  skippedMissingSnapshots: readonly W3O01CRecoveryOwner[];
}>;

/**
 * Integrity gate: durable payload must be a plain object.
 * Missing (null/undefined) means nothing was persisted — caller leaves store empty (honest).
 * Arrays / primitives / fabricated defaults are rejected.
 */
export function assertRecoverableSnapshotPayload(
  owner: W3O01BDurableOwner,
  payload: unknown,
): asserts payload is Record<string, unknown> {
  if (payload === null || payload === undefined) {
    throw new AnalyticalRestartRecoveryError(
      owner,
      'CORRUPT_SNAPSHOT',
      `Analytical restart recovery refused empty replacement for owner "${owner}"`,
    );
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AnalyticalRestartRecoveryError(
      owner,
      'CORRUPT_SNAPSHOT',
      `Analytical restart recovery refused corrupt snapshot for owner "${owner}"`,
    );
  }
}

/**
 * Load W3-O01-b snapshot for recovery.
 * Returns null when no row exists (first boot / never persisted) — do not fabricate.
 * Throws when a row exists but payload fails integrity.
 */
export async function loadRecoverableOwnerSnapshot(
  prisma: AnalyticalOwnerStoreSnapshotClient,
  owner: W3O01BDurableOwner,
): Promise<Record<string, unknown> | null> {
  const payload = await loadOwnerStoreSnapshot(prisma, owner);
  if (payload === null || payload === undefined) {
    return null;
  }
  assertRecoverableSnapshotPayload(owner, payload);
  return payload;
}

export function assertRecoveryOrderComplete(): void {
  const ordered = new Set<string>(W3_O01_C_RECOVERY_ORDER);
  for (const owner of W3_O01_B_DURABLE_OWNERS) {
    if (!ordered.has(owner)) {
      throw new AnalyticalRestartRecoveryError(
        owner,
        'UNKNOWN_OWNER',
        `Durable owner "${owner}" missing from W3-O01-c recovery order`,
      );
    }
  }
  if (W3_O01_C_RECOVERY_ORDER.length !== W3_O01_B_DURABLE_OWNERS.length) {
    throw new AnalyticalRestartRecoveryError(
      'reporting',
      'RECOVERY_ORDER',
      'W3-O01-c recovery order length mismatch vs durable owners',
    );
  }
}

export function assertRecoveryDependenciesAcyclic(): void {
  const index = new Map<W3O01CRecoveryOwner, number>();
  W3_O01_C_RECOVERY_ORDER.forEach((owner, i) => index.set(owner, i));

  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    for (const dep of W3_O01_C_RECOVERY_DEPENDENCIES[owner]) {
      const ownerIdx = index.get(owner)!;
      const depIdx = index.get(dep);
      if (depIdx === undefined) {
        throw new AnalyticalRestartRecoveryError(
          owner,
          'RECOVERY_ORDER',
          `Unknown recovery dependency "${dep}" for "${owner}"`,
        );
      }
      if (depIdx >= ownerIdx) {
        throw new AnalyticalRestartRecoveryError(
          owner,
          'RECOVERY_ORDER',
          `Recovery dependency "${dep}" must precede "${owner}" (circular or out-of-order)`,
        );
      }
    }
  }
}

/**
 * Run owner restore steps in documented recovery order.
 * Each step is the existing owner's hydrate/restore — no parallel recovery domain.
 */
export async function runAnalyticalRestartRecovery(
  steps: readonly AnalyticalOwnerRestoreStep[],
): Promise<AnalyticalRestartRecoveryResult> {
  assertRecoveryOrderComplete();
  assertRecoveryDependenciesAcyclic();

  const byOwner = new Map(steps.map((step) => [step.owner, step] as const));
  const restoredOwners: W3O01CRecoveryOwner[] = [];
  const skippedMissingSnapshots: W3O01CRecoveryOwner[] = [];

  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    const step = byOwner.get(owner);
    if (!step) {
      throw new AnalyticalRestartRecoveryError(
        owner,
        'UNKNOWN_OWNER',
        `Missing restore step for recovery owner "${owner}"`,
      );
    }
    await step.restore();
    restoredOwners.push(owner);
  }

  return Object.freeze({
    restoredOwners: Object.freeze(restoredOwners),
    skippedMissingSnapshots: Object.freeze(skippedMissingSnapshots),
  });
}
