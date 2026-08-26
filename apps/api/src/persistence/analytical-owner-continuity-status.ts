/**
 * W3-O01-d — Process-local analytical owner boot outcomes.
 *
 * Records hydrate success/failure during Nest factory construction so Operational
 * Continuity can project readiness without a new persistence owner or recovery engine.
 * Not Business Continuity / HA / monitoring.
 */

import type { W3O01BDurableOwner } from './analytical-owner-store-snapshot';

export type AnalyticalOwnerBootOutcome = 'ready' | 'unavailable';

export type AnalyticalOwnerBootRecord = Readonly<{
  owner: W3O01BDurableOwner;
  outcome: AnalyticalOwnerBootOutcome;
  reason?: string;
  recordedAt: string;
}>;

const bootOutcomes = new Map<W3O01BDurableOwner, AnalyticalOwnerBootRecord>();

/**
 * Record hydrate / boot outcome for a durable analytical owner.
 * Unavailable always wins (partial multi-adapter owners stay Unavailable).
 */
export function recordAnalyticalOwnerBootOutcome(
  owner: W3O01BDurableOwner,
  outcome: AnalyticalOwnerBootOutcome,
  reason?: string,
): void {
  const existing = bootOutcomes.get(owner);
  if (existing?.outcome === 'unavailable') {
    return;
  }
  if (outcome === 'unavailable' || !existing) {
    bootOutcomes.set(
      owner,
      Object.freeze({
        owner,
        outcome,
        reason,
        recordedAt: new Date().toISOString(),
      }),
    );
  }
}

export function getAnalyticalOwnerBootOutcome(
  owner: W3O01BDurableOwner,
): AnalyticalOwnerBootRecord | undefined {
  return bootOutcomes.get(owner);
}

export function listAnalyticalOwnerBootOutcomes(): readonly AnalyticalOwnerBootRecord[] {
  return Object.freeze([...bootOutcomes.values()]);
}

/** Test / process isolation helper. */
export function resetAnalyticalOwnerBootOutcomes(): void {
  bootOutcomes.clear();
}
