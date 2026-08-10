/**
 * RC-26 Epic 3 — MarketStateMetadata (non-authoritative input refs).
 *
 * Structure only — does not pull live data or classify.
 */

import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  deepFreeze,
} from './market-state-domain-shared';

export type MarketStateMetadata = Readonly<{
  observationAsOf: string;
  confidenceRef?: string;
  profileRef?: string;
  inputSummary: string;
  notes?: string;
  authorityClass: typeof MARKET_STATE_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
}>;

export type CreateMarketStateMetadataInput = Readonly<{
  observationAsOf: string;
  confidenceRef?: string;
  profileRef?: string;
  inputSummary: string;
  notes?: string;
}>;

/**
 * Create immutable metadata for a Market State version.
 * Refs are opaque strings — never ownership of Qualification / Profile.
 */
export function createMarketStateMetadata(
  input: CreateMarketStateMetadataInput,
): MarketStateMetadata {
  const observationAsOf = assertIsoTimestamp(input.observationAsOf, 'observationAsOf');
  const inputSummary = input.inputSummary.trim();
  if (!inputSummary) {
    throw new Error('inputSummary must be a non-empty string');
  }

  const confidenceRef =
    input.confidenceRef !== undefined && input.confidenceRef.trim() !== ''
      ? input.confidenceRef.trim()
      : undefined;
  const profileRef =
    input.profileRef !== undefined && input.profileRef.trim() !== ''
      ? input.profileRef.trim()
      : undefined;
  const notes =
    input.notes !== undefined && input.notes.trim() !== '' ? input.notes.trim() : undefined;

  return deepFreeze({
    observationAsOf,
    ...(confidenceRef !== undefined ? { confidenceRef } : {}),
    ...(profileRef !== undefined ? { profileRef } : {}),
    inputSummary,
    ...(notes !== undefined ? { notes } : {}),
    authorityClass: MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    isQualification: false as const,
    isProfile: false as const,
  });
}
