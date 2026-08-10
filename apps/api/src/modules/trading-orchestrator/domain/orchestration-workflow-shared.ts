/**
 * RC-26 Epic 5 — Orchestration workflow shared catalogs.
 *
 * Coordination lifecycle for OrchestrationRun only.
 * No execution / Session ownership / Risk approval.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './trading-orchestrator-domain-shared';

export {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  deepFreeze,
  assertNonEmptyString,
  assertIsoTimestamp,
};

/** OrchestrationRun workflow statuses (API Contract §6). */
export const ORCHESTRATION_RUN_STATUSES = Object.freeze([
  'requested',
  'confirmed',
  'selecting',
  'selected',
  'handing_off',
  'handed_off',
  'failed',
  'cancelled',
  'rejected',
] as const);

export type OrchestrationRunStatus = (typeof ORCHESTRATION_RUN_STATUSES)[number];

export const ORCHESTRATION_RUN_TRANSITIONS: Readonly<
  Record<OrchestrationRunStatus, readonly OrchestrationRunStatus[]>
> = Object.freeze({
  requested: Object.freeze(['confirmed', 'cancelled', 'rejected', 'failed'] as const),
  confirmed: Object.freeze(['selecting', 'selected', 'cancelled', 'rejected', 'failed'] as const),
  selecting: Object.freeze(['selected', 'cancelled', 'rejected', 'failed'] as const),
  selected: Object.freeze(['handing_off', 'cancelled', 'rejected', 'failed'] as const),
  handing_off: Object.freeze(['handed_off', 'cancelled', 'rejected', 'failed'] as const),
  handed_off: Object.freeze(['cancelled'] as const),
  failed: Object.freeze([] as const),
  cancelled: Object.freeze([] as const),
  rejected: Object.freeze([] as const),
});

export function isOrchestrationRunStatus(value: string): value is OrchestrationRunStatus {
  return (ORCHESTRATION_RUN_STATUSES as readonly string[]).includes(value);
}

export function canTransitionOrchestrationRun(
  from: OrchestrationRunStatus,
  to: OrchestrationRunStatus,
): boolean {
  return ORCHESTRATION_RUN_TRANSITIONS[from].includes(to);
}

export function assertOrchestrationRunTransition(
  from: OrchestrationRunStatus,
  to: OrchestrationRunStatus,
): void {
  if (!canTransitionOrchestrationRun(from, to)) {
    throw new Error(`forbidden OrchestrationRun transition: ${from} → ${to}`);
  }
}

export const SESSION_HANDOFF_INTENT_STATUSES = Object.freeze([
  'proposed',
  'accepted_by_session',
  'rejected_by_session',
  'cancelled',
] as const);

export type SessionHandoffIntentStatus = (typeof SESSION_HANDOFF_INTENT_STATUSES)[number];

export function isSessionHandoffIntentStatus(value: string): value is SessionHandoffIntentStatus {
  return (SESSION_HANDOFF_INTENT_STATUSES as readonly string[]).includes(value);
}
