/**
 * RC-26 Epic 3 — MarketStateSnapshot (normalized descriptive payload).
 *
 * Caller supplies labels — this factory never computes regimes or scores.
 */

import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
  isMarketStateRegimeLabel,
} from './market-state-domain-shared';

export type MarketStateSnapshot = Readonly<{
  regime: string;
  volatilityClass?: string;
  liquidityClass?: string;
  narrativeSummary: string;
  authorityClass: typeof MARKET_STATE_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
  /** Explicit: snapshot is descriptive structure, not a trading decision. */
  decidesTrade: false;
}>;

export type CreateMarketStateSnapshotInput = Readonly<{
  regime: string;
  volatilityClass?: string;
  liquidityClass?: string;
  narrativeSummary: string;
}>;

/**
 * Create an immutable descriptive snapshot.
 * Does not classify markets — validates structure only.
 */
export function createMarketStateSnapshot(
  input: CreateMarketStateSnapshotInput,
): MarketStateSnapshot {
  const regime = assertNonEmptyString(input.regime, 'regime');
  if (!isMarketStateRegimeLabel(regime)) {
    throw new Error(`regime must be a known MarketStateRegimeLabel`);
  }
  const narrativeSummary = assertNonEmptyString(input.narrativeSummary, 'narrativeSummary');

  const volatilityClass =
    input.volatilityClass !== undefined && input.volatilityClass.trim() !== ''
      ? input.volatilityClass.trim()
      : undefined;
  const liquidityClass =
    input.liquidityClass !== undefined && input.liquidityClass.trim() !== ''
      ? input.liquidityClass.trim()
      : undefined;

  return deepFreeze({
    regime,
    ...(volatilityClass !== undefined ? { volatilityClass } : {}),
    ...(liquidityClass !== undefined ? { liquidityClass } : {}),
    narrativeSummary,
    authorityClass: MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    isQualification: false as const,
    isProfile: false as const,
    decidesTrade: false as const,
  });
}
