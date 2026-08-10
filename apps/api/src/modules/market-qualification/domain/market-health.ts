/**
 * RC-25 Epic 3 — MarketHealth (research health indicators).
 *
 * Domain Model Contract §8.
 * Structure only — does not halt Sessions or move balances.
 */

import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isMarketHealthIndicatorKey,
  isMarketHealthStatus,
  type MarketHealthIndicatorKey,
  type MarketHealthStatus,
} from './market-qualification-domain-shared';

export type MarketHealthIndicator = Readonly<{
  key: MarketHealthIndicatorKey;
  value: string;
  note?: string;
}>;

export type MarketHealth = Readonly<{
  targetId: string;
  workspaceId: string;
  status: MarketHealthStatus;
  indicators: readonly MarketHealthIndicator[];
  sourceRunId: string;
  asOf: string;
  authorityClass: typeof MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS;
}>;

export type CreateMarketHealthInput = Readonly<{
  targetId: string;
  workspaceId: string;
  status: string;
  indicators: readonly Readonly<{
    key: string;
    value: string;
    note?: string;
  }>[];
  sourceRunId: string;
  asOf: string;
}>;

/**
 * Create an immutable MarketHealth artifact.
 * Does not act as Kill Switch. Does not mutate Session lifecycle.
 */
export function createMarketHealth(input: CreateMarketHealthInput): MarketHealth {
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const sourceRunId = assertNonEmptyString(input.sourceRunId, 'sourceRunId');
  const asOf = assertIsoTimestamp(input.asOf, 'asOf');

  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!isMarketHealthStatus(statusRaw)) {
    throw new Error(`status must be one of: healthy | watch | unhealthy | unknown`);
  }

  if (!input.indicators || input.indicators.length === 0) {
    throw new Error('indicators must be non-empty');
  }

  const indicators = input.indicators.map((indicator) => {
    const keyRaw = assertNonEmptyString(indicator.key, 'indicators.key');
    if (!isMarketHealthIndicatorKey(keyRaw)) {
      throw new Error(`unknown health indicator key: ${indicator.key}`);
    }
    const value = assertNonEmptyString(indicator.value, 'indicators.value');
    const note =
      indicator.note !== undefined && indicator.note.trim() !== ''
        ? indicator.note.trim()
        : undefined;
    return Object.freeze({
      key: keyRaw,
      value,
      ...(note !== undefined ? { note } : {}),
    });
  });

  return deepFreeze({
    targetId,
    workspaceId,
    status: statusRaw,
    indicators: Object.freeze(indicators),
    sourceRunId,
    asOf,
    authorityClass: MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  });
}
