/**
 * RC-26 Epic 3 — MarketStateVersion (immutable version identity).
 *
 * Every Market State publication is a new version. No overwrite.
 */

import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  deepFreeze,
} from './market-state-domain-shared';

export type MarketStateVersion = Readonly<{
  marketStateId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  authorityClass: typeof MARKET_STATE_DOMAIN_AUTHORITY_CLASS;
  mutable: false;
}>;

export type CreateMarketStateVersionInput = Readonly<{
  marketStateId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
}>;

/**
 * Create an immutable version identity record.
 * Corrections require a new version — never mutate this object.
 */
export function createMarketStateVersion(input: CreateMarketStateVersionInput): MarketStateVersion {
  return deepFreeze({
    marketStateId: assertNonEmptyString(input.marketStateId, 'marketStateId'),
    version: assertPositiveVersion(input.version),
    publishedAt: assertIsoTimestamp(input.publishedAt, 'publishedAt'),
    publishedBy: assertNonEmptyString(input.publishedBy, 'publishedBy'),
    authorityClass: MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
    mutable: false as const,
  });
}

/**
 * Assert a candidate version does not overwrite an existing version number
 * in a history list (append-only versioning invariant).
 */
export function assertNoVersionOverwrite(
  history: readonly { readonly version: number }[],
  nextVersion: number,
): void {
  assertPositiveVersion(nextVersion);
  if (history.some((row) => row.version === nextVersion)) {
    throw new Error(
      `MarketState version overwrite forbidden: version ${nextVersion} already exists`,
    );
  }
}

/**
 * Assert next version is exactly max(history)+1 (or 1 when empty).
 */
export function assertNextVersionMonotonic(
  history: readonly { readonly version: number }[],
  nextVersion: number,
): void {
  assertNoVersionOverwrite(history, nextVersion);
  const max = history.reduce((acc, row) => Math.max(acc, row.version), 0);
  const expected = max + 1;
  if (nextVersion !== expected) {
    throw new Error(
      `MarketState version must be monotonic: expected ${expected}, received ${nextVersion}`,
    );
  }
}
