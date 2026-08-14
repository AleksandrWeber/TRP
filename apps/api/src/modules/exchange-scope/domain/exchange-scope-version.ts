/**
 * RC-27 Epic 2 — ExchangeScopeVersion (immutable config version identity).
 *
 * Every configuration publication is a new version. No overwrite.
 * Task alias: ExchangeScopeVersion.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  deepFreeze,
} from './exchange-scope-domain-shared';

export type ExchangeScopeVersion = Readonly<{
  exchangeScopeId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  mutable: false;
}>;

export type CreateExchangeScopeVersionInput = Readonly<{
  exchangeScopeId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
}>;

/**
 * Create an immutable version identity record.
 * Corrections require a new version — never mutate this object.
 */
export function createExchangeScopeVersion(
  input: CreateExchangeScopeVersionInput,
): ExchangeScopeVersion {
  return deepFreeze({
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    version: assertPositiveVersion(input.version),
    publishedAt: assertIsoTimestamp(input.publishedAt, 'publishedAt'),
    publishedBy: assertNonEmptyString(input.publishedBy, 'publishedBy'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
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
      `ExchangeScope version overwrite forbidden: version ${nextVersion} already exists`,
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
      `ExchangeScope version must be monotonic: expected ${expected}, received ${nextVersion}`,
    );
  }
}
