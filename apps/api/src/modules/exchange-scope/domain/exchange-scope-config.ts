/**
 * RC-27 Epic 2 — ExchangeScopeConfig (immutable configuration payload).
 *
 * Task alias: ExchangeConfiguration.
 * Capacity / allowlists / mode — isolation inputs only.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertNonNegativeInteger,
  deepFreeze,
  isExchangeScopeModeContext,
  type ExchangeScopeModeContext,
} from './exchange-scope-domain-shared';

export type ExchangeScopeConfig = Readonly<{
  exchangeScopeId: string;
  maxActiveSessions: number;
  symbolAllowlist: readonly string[];
  strategyAllowlist: readonly string[];
  modeContext: ExchangeScopeModeContext;
  updatedAt: string;
  updatedBy: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  authorizesRuntime: false;
  forcesTrade: false;
  mutable: false;
}>;

export type CreateExchangeScopeConfigInput = Readonly<{
  exchangeScopeId: string;
  maxActiveSessions: number;
  symbolAllowlist?: readonly string[];
  strategyAllowlist?: readonly string[];
  modeContext: string;
  updatedAt: string;
  updatedBy: string;
}>;

/**
 * Create an immutable configuration payload.
 * Does not authorize Runtime or force trades.
 */
export function createExchangeScopeConfig(
  input: CreateExchangeScopeConfigInput,
): ExchangeScopeConfig {
  const modeRaw = assertNonEmptyString(input.modeContext, 'modeContext');
  if (!isExchangeScopeModeContext(modeRaw)) {
    throw new Error(`modeContext must be a known ExchangeScopeModeContext`);
  }

  const symbols = Object.freeze(
    (input.symbolAllowlist ?? []).map((s, i) => assertNonEmptyString(s, `symbolAllowlist[${i}]`)),
  );
  const strategies = Object.freeze(
    (input.strategyAllowlist ?? []).map((s, i) =>
      assertNonEmptyString(s, `strategyAllowlist[${i}]`),
    ),
  );

  return deepFreeze({
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    maxActiveSessions: assertNonNegativeInteger(input.maxActiveSessions, 'maxActiveSessions'),
    symbolAllowlist: symbols,
    strategyAllowlist: strategies,
    modeContext: modeRaw,
    updatedAt: assertIsoTimestamp(input.updatedAt, 'updatedAt'),
    updatedBy: assertNonEmptyString(input.updatedBy, 'updatedBy'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    authorizesRuntime: false as const,
    forcesTrade: false as const,
    mutable: false as const,
  });
}

/** Product / task alias for ExchangeScopeConfig. */
export type ExchangeConfiguration = ExchangeScopeConfig;
export const createExchangeConfiguration = createExchangeScopeConfig;
