/**
 * RC-27 Epic 2 — ExchangeScopeLifecycle (immutable lifecycle record).
 *
 * Supports Created / Active / Suspended / Archived.
 * No automatic transitions — callers create new immutable records.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertExchangeScopeLifecycleTransition,
  assertIsoTimestamp,
  assertNonEmptyString,
  canTransitionExchangeScopeLifecycle,
  deepFreeze,
  exchangeScopeBlocksNewSessionCapacity,
  isExchangeScopeLifecycleStatus,
  type ExchangeScopeLifecycleStatus,
} from './exchange-scope-domain-shared';

export type ExchangeScopeLifecycle = Readonly<{
  status: ExchangeScopeLifecycleStatus;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  authorizesRuntime: false;
  executesActions: false;
  blocksNewSessionCapacity: boolean;
}>;

export type CreateExchangeScopeLifecycleInput = Readonly<{
  status: string;
  updatedAt: string;
  updatedBy: string;
  reason: string;
}>;

/**
 * Create an immutable lifecycle record.
 * Does not start Sessions, approve risk, or submit orders.
 */
export function createExchangeScopeLifecycle(
  input: CreateExchangeScopeLifecycleInput,
): ExchangeScopeLifecycle {
  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!isExchangeScopeLifecycleStatus(statusRaw)) {
    throw new Error(`status must be a known ExchangeScopeLifecycleStatus`);
  }

  return deepFreeze({
    status: statusRaw,
    updatedAt: assertIsoTimestamp(input.updatedAt, 'updatedAt'),
    updatedBy: assertNonEmptyString(input.updatedBy, 'updatedBy'),
    reason: assertNonEmptyString(input.reason, 'reason'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    authorizesRuntime: false as const,
    executesActions: false as const,
    blocksNewSessionCapacity: exchangeScopeBlocksNewSessionCapacity(statusRaw),
  });
}

/**
 * Produce a new immutable lifecycle record after a validated transition.
 * Does not mutate `current`. Does not trade.
 */
export function transitionExchangeScopeLifecycle(
  current: ExchangeScopeLifecycle,
  to: ExchangeScopeLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): ExchangeScopeLifecycle {
  assertExchangeScopeLifecycleTransition(current.status, to);
  return createExchangeScopeLifecycle({
    status: to,
    updatedAt,
    updatedBy,
    reason,
  });
}

export {
  canTransitionExchangeScopeLifecycle,
  assertExchangeScopeLifecycleTransition,
  exchangeScopeBlocksNewSessionCapacity,
};
