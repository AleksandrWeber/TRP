/**
 * RC-26 Epic 3 — MarketStateLifecycle (immutable lifecycle record).
 *
 * Supports Created / Active / Superseded / Archived.
 * No automatic transitions — callers create new immutable records.
 */

import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertMarketStateLifecycleTransition,
  assertNonEmptyString,
  canTransitionMarketStateLifecycle,
  deepFreeze,
  isMarketStateLifecycleStatus,
  type MarketStateLifecycleStatus,
} from './market-state-domain-shared';

export type MarketStateLifecycle = Readonly<{
  status: MarketStateLifecycleStatus;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  authorityClass: typeof MARKET_STATE_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  authorizesRuntime: false;
}>;

export type CreateMarketStateLifecycleInput = Readonly<{
  status: string;
  updatedAt: string;
  updatedBy: string;
  reason: string;
}>;

/**
 * Create an immutable lifecycle record.
 * Does not generate Market State or select strategies.
 */
export function createMarketStateLifecycle(
  input: CreateMarketStateLifecycleInput,
): MarketStateLifecycle {
  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!isMarketStateLifecycleStatus(statusRaw)) {
    throw new Error(`status must be a known MarketStateLifecycleStatus`);
  }

  return deepFreeze({
    status: statusRaw,
    updatedAt: assertIsoTimestamp(input.updatedAt, 'updatedAt'),
    updatedBy: assertNonEmptyString(input.updatedBy, 'updatedBy'),
    reason: assertNonEmptyString(input.reason, 'reason'),
    authorityClass: MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    authorizesRuntime: false as const,
  });
}

/**
 * Produce a new immutable lifecycle record after a validated transition.
 * Does not mutate `current`. Does not classify markets.
 */
export function transitionMarketStateLifecycle(
  current: MarketStateLifecycle,
  to: MarketStateLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): MarketStateLifecycle {
  assertMarketStateLifecycleTransition(current.status, to);
  return createMarketStateLifecycle({
    status: to,
    updatedAt,
    updatedBy,
    reason,
  });
}

export { canTransitionMarketStateLifecycle, assertMarketStateLifecycleTransition };
