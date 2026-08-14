/**
 * RC-27 Epic 2 — ExchangeScopeMetadata (immutable non-authoritative metadata).
 *
 * Task alias: ExchangeMetadata.
 * Opaque refs only — never ownership transfer of peers.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './exchange-scope-domain-shared';

export type ExchangeScopeMetadata = Readonly<{
  asOf: string;
  adapterContextRef: string | null;
  policyRef: string | null;
  inputSummary: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  ownsStrategyLibrary: false;
  ownsRuntimeEnforcement: false;
  ownsTradingSession: false;
  ownsRiskDecisions: false;
  ownsOrders: false;
  ownsExecution: false;
  ownsAccounting: false;
  mutable: false;
}>;

export type CreateExchangeScopeMetadataInput = Readonly<{
  asOf: string;
  adapterContextRef?: string | null;
  policyRef?: string | null;
  inputSummary: string;
}>;

/**
 * Create immutable metadata. Peer refs are opaque — never ownership.
 */
export function createExchangeScopeMetadata(
  input: CreateExchangeScopeMetadataInput,
): ExchangeScopeMetadata {
  return deepFreeze({
    asOf: assertIsoTimestamp(input.asOf, 'asOf'),
    adapterContextRef:
      input.adapterContextRef === undefined || input.adapterContextRef === null
        ? null
        : assertNonEmptyString(input.adapterContextRef, 'adapterContextRef'),
    policyRef:
      input.policyRef === undefined || input.policyRef === null
        ? null
        : assertNonEmptyString(input.policyRef, 'policyRef'),
    inputSummary: assertNonEmptyString(input.inputSummary, 'inputSummary'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    ownsStrategyLibrary: false as const,
    ownsRuntimeEnforcement: false as const,
    ownsTradingSession: false as const,
    ownsRiskDecisions: false as const,
    ownsOrders: false as const,
    ownsExecution: false as const,
    ownsAccounting: false as const,
    mutable: false as const,
  });
}

/** Product / task alias for ExchangeScopeMetadata. */
export type ExchangeMetadata = ExchangeScopeMetadata;
export const createExchangeMetadata = createExchangeScopeMetadata;
