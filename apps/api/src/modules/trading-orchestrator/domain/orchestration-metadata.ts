/**
 * RC-26 Epic 4 — OrchestrationMetadata (non-authoritative refs).
 *
 * Structure only — does not call Library / Gate / Session / Market State.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  deepFreeze,
} from './trading-orchestrator-domain-shared';

export type OrchestrationMetadata = Readonly<{
  asOf: string;
  marketStateRef?: string;
  qualificationRef?: string;
  profileRef?: string;
  inputSummary: string;
  notes?: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  ownsMarketState: false;
  ownsQualification: false;
  ownsProfile: false;
  ownsLibrary: false;
  ownsRuntimeEnforcement: false;
}>;

export type CreateOrchestrationMetadataInput = Readonly<{
  asOf: string;
  marketStateRef?: string;
  qualificationRef?: string;
  profileRef?: string;
  inputSummary: string;
  notes?: string;
}>;

/**
 * Create immutable orchestration metadata.
 * Refs are opaque — never ownership of Market State / Qualification / Profile / Library / Gate.
 */
export function createOrchestrationMetadata(
  input: CreateOrchestrationMetadataInput,
): OrchestrationMetadata {
  const asOf = assertIsoTimestamp(input.asOf, 'asOf');
  const inputSummary = input.inputSummary.trim();
  if (!inputSummary) {
    throw new Error('inputSummary must be a non-empty string');
  }

  const marketStateRef =
    input.marketStateRef !== undefined && input.marketStateRef.trim() !== ''
      ? input.marketStateRef.trim()
      : undefined;
  const qualificationRef =
    input.qualificationRef !== undefined && input.qualificationRef.trim() !== ''
      ? input.qualificationRef.trim()
      : undefined;
  const profileRef =
    input.profileRef !== undefined && input.profileRef.trim() !== ''
      ? input.profileRef.trim()
      : undefined;
  const notes =
    input.notes !== undefined && input.notes.trim() !== '' ? input.notes.trim() : undefined;

  return deepFreeze({
    asOf,
    ...(marketStateRef !== undefined ? { marketStateRef } : {}),
    ...(qualificationRef !== undefined ? { qualificationRef } : {}),
    ...(profileRef !== undefined ? { profileRef } : {}),
    inputSummary,
    ...(notes !== undefined ? { notes } : {}),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    ownsMarketState: false as const,
    ownsQualification: false as const,
    ownsProfile: false as const,
    ownsLibrary: false as const,
    ownsRuntimeEnforcement: false as const,
  });
}
