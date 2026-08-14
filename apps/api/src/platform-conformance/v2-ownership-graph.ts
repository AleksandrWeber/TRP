/**
 * RC-28 Epic 1 — sole-owner map for Version 2 integration surfaces.
 *
 * Ownership is unchanged from RC-19…RC-27. This file records it; it does
 * not transfer it.
 */

import type { V2PlatformModuleId } from './v2-platform-modules';

export type V2OwnedConcernRecord = Readonly<{
  concern: string;
  owner: V2PlatformModuleId;
}>;

export const V2_SOLE_OWNERS: readonly V2OwnedConcernRecord[] = Object.freeze([
  { concern: 'ops-workspace-projections', owner: 'command-center' },
  { concern: 'ops-command-entry', owner: 'command-center' },
  { concern: 'analytical-warehouse', owner: 'knowledge-lake' },
  { concern: 'certified-strategy-lifecycle', owner: 'strategy-library' },
  { concern: 'tactical-envelope-binding', owner: 'strategy-library' },
  { concern: 'enforcement-pass-fail', owner: 'runtime-enforcement' },
  { concern: 'report-generation', owner: 'reporting' },
  { concern: 'analytical-narrative', owner: 'ai-analytics' },
  { concern: 'notification-delivery', owner: 'notification-delivery' },
  { concern: 'qualification-run', owner: 'market-qualification' },
  { concern: 'market-profile-versions', owner: 'market-profile' },
  { concern: 'current-state-snapshot', owner: 'market-state' },
  { concern: 'orchestration-run', owner: 'trading-orchestrator' },
  { concern: 'session-handoff-intent', owner: 'trading-orchestrator' },
  { concern: 'exchange-scope-identity', owner: 'exchange-scope' },
  { concern: 'exchange-risk-policy-inputs', owner: 'exchange-scope' },
]);

/** External Freeze owners — not among the twelve, still sole. */
export const V2_EXTERNAL_SOLE_OWNERS = Object.freeze({
  'trading-session-lifecycle': 'trading-session',
  'risk-decisions': 'risk-engine',
  orders: 'orders',
  execution: 'execution-engine',
  ledger: 'accounting',
} as const);

export function ownerOf(concern: string): V2PlatformModuleId | undefined {
  return V2_SOLE_OWNERS.find((row) => row.concern === concern)?.owner;
}

export function duplicateOwnerConcerns(
  rows: readonly V2OwnedConcernRecord[] = V2_SOLE_OWNERS,
): string[] {
  const seen = new Map<string, V2PlatformModuleId>();
  const duplicates: string[] = [];
  for (const row of rows) {
    const existing = seen.get(row.concern);
    if (existing && existing !== row.owner) duplicates.push(row.concern);
    else seen.set(row.concern, row.owner);
  }
  return duplicates;
}
