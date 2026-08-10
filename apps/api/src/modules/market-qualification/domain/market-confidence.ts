/**
 * RC-25 Epic 3 — MarketConfidence (research confidence input).
 *
 * Domain Model Contract §7.
 * Structure only — does not calculate scores or force trades.
 */

import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isMarketConfidenceLevel,
  type MarketConfidenceLevel,
} from './market-qualification-domain-shared';

export type MarketConfidence = Readonly<{
  targetId: string;
  workspaceId: string;
  level: MarketConfidenceLevel;
  score?: number;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
  forcesTrade: false;
  authorityClass: typeof MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS;
}>;

export type CreateMarketConfidenceInput = Readonly<{
  targetId: string;
  workspaceId: string;
  level: string;
  score?: number;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
}>;

/**
 * Create an immutable MarketConfidence artifact.
 * Does not compute level/score. forcesTrade is always false.
 */
export function createMarketConfidence(input: CreateMarketConfidenceInput): MarketConfidence {
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const rationaleSummary = assertNonEmptyString(input.rationaleSummary, 'rationaleSummary');
  const sourceRunId = assertNonEmptyString(input.sourceRunId, 'sourceRunId');
  const asOf = assertIsoTimestamp(input.asOf, 'asOf');

  const levelRaw = assertNonEmptyString(input.level, 'level');
  if (!isMarketConfidenceLevel(levelRaw)) {
    throw new Error(`level must be one of: low | medium | high | unknown`);
  }

  if (input.score !== undefined) {
    if (!(input.score >= 0 && input.score <= 1)) {
      throw new Error('score must be in closed range [0, 1] when provided');
    }
  }

  return deepFreeze({
    targetId,
    workspaceId,
    level: levelRaw,
    ...(input.score !== undefined ? { score: input.score } : {}),
    rationaleSummary,
    sourceRunId,
    asOf,
    forcesTrade: false as const,
    authorityClass: MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  });
}
