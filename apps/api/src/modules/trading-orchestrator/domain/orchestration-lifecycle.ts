/**
 * RC-26 Epic 4 — OrchestrationLifecycle (immutable lifecycle record).
 *
 * Supports Created / Planned / Ready / Cancelled / Archived.
 * No automatic orchestration — callers create new immutable records.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertOrchestrationLifecycleTransition,
  canTransitionOrchestrationLifecycle,
  deepFreeze,
  isOrchestrationLifecycleStatus,
  type OrchestrationLifecycleStatus,
} from './trading-orchestrator-domain-shared';

export type OrchestrationLifecycle = Readonly<{
  status: OrchestrationLifecycleStatus;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  executesActions: false;
  authorizesRuntime: false;
}>;

export type CreateOrchestrationLifecycleInput = Readonly<{
  status: string;
  updatedAt: string;
  updatedBy: string;
  reason: string;
}>;

/**
 * Create an immutable lifecycle record.
 * Does not start workflows or Session handoffs.
 */
export function createOrchestrationLifecycle(
  input: CreateOrchestrationLifecycleInput,
): OrchestrationLifecycle {
  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!isOrchestrationLifecycleStatus(statusRaw)) {
    throw new Error(`status must be a known OrchestrationLifecycleStatus`);
  }

  return deepFreeze({
    status: statusRaw,
    updatedAt: assertIsoTimestamp(input.updatedAt, 'updatedAt'),
    updatedBy: assertNonEmptyString(input.updatedBy, 'updatedBy'),
    reason: assertNonEmptyString(input.reason, 'reason'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    executesActions: false as const,
    authorizesRuntime: false as const,
  });
}

/**
 * Produce a new immutable lifecycle record after a validated transition.
 * Does not mutate `current`. Does not run orchestration workflows.
 */
export function transitionOrchestrationLifecycle(
  current: OrchestrationLifecycle,
  to: OrchestrationLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): OrchestrationLifecycle {
  assertOrchestrationLifecycleTransition(current.status, to);
  return createOrchestrationLifecycle({
    status: to,
    updatedAt,
    updatedBy,
    reason,
  });
}

export { canTransitionOrchestrationLifecycle, assertOrchestrationLifecycleTransition };
