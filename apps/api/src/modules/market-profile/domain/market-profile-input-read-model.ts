/**
 * RC-25 Epic 2 — Immutable Profile input read models.
 *
 * Observational inputs for later volatility / liquidity / trend / structure
 * profile calculation. Epic 2 does NOT compute profiles or scores.
 *
 * Consumed via Market Qualification's Live Market Data / Research read ports
 * (dependency: LMD → Qualification → Profile).
 */

import type {
  HistoricalCharacteristicSlice,
  MarketObservationSlice,
  ResearchOutputRef,
} from '../../market-qualification/domain/market-qualification-observational-read-model';

export const MARKET_PROFILE_INPUT_AUTHORITY_CLASS = 'observation' as const;

export type ProfileDimensionKind = 'volatility' | 'liquidity' | 'trend' | 'structure' | 'history';

/**
 * Raw observational input for a future profile dimension.
 * Contains no computed regime labels or scores.
 */
export type ProfileDimensionInputSlice = Readonly<{
  authorityClass: typeof MARKET_PROFILE_INPUT_AUTHORITY_CLASS;
  dimension: ProfileDimensionKind;
  workspaceId: string;
  exchangeScopeId?: string;
  instrument: string;
  streamId: string;
  windowSummary: string;
  latestClose?: number;
  latestMarkPrice?: string;
  freshnessAt: string | null;
  /** Never a computed profile score in Epic 2. */
  scored: false;
}>;

export type MarketProfileInputReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  instrument?: string;
  streamId?: string;
}>;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

function toDimensionInput(
  observation: MarketObservationSlice,
  dimension: ProfileDimensionKind,
): ProfileDimensionInputSlice {
  return deepFreeze({
    authorityClass: MARKET_PROFILE_INPUT_AUTHORITY_CLASS,
    dimension,
    workspaceId: observation.workspaceId,
    exchangeScopeId: observation.exchangeScopeId,
    instrument: observation.instrument,
    streamId: observation.streamId,
    windowSummary: observation.freshnessAt
      ? `latest_as_of:${observation.freshnessAt}`
      : 'latest_snapshot',
    latestClose: observation.latestClose,
    latestMarkPrice: observation.latestMarkPrice,
    freshnessAt: observation.freshnessAt,
    scored: false as const,
  });
}

export function toHistoryInputs(
  characteristics: readonly HistoricalCharacteristicSlice[],
): readonly ProfileDimensionInputSlice[] {
  return Object.freeze(
    characteristics.map((slice) =>
      deepFreeze({
        authorityClass: MARKET_PROFILE_INPUT_AUTHORITY_CLASS,
        dimension: 'history' as const,
        workspaceId: slice.workspaceId,
        exchangeScopeId: slice.exchangeScopeId,
        instrument: slice.instrument,
        streamId: slice.streamId,
        windowSummary: slice.windowSummary,
        latestClose: slice.close,
        latestMarkPrice: slice.markPrice,
        freshnessAt: null,
        scored: false as const,
      }),
    ),
  );
}

export function toVolatilityInputs(
  observations: readonly MarketObservationSlice[],
): readonly ProfileDimensionInputSlice[] {
  return Object.freeze(observations.map((obs) => toDimensionInput(obs, 'volatility')));
}

export function toLiquidityInputs(
  observations: readonly MarketObservationSlice[],
): readonly ProfileDimensionInputSlice[] {
  return Object.freeze(observations.map((obs) => toDimensionInput(obs, 'liquidity')));
}

export function toTrendInputs(
  observations: readonly MarketObservationSlice[],
): readonly ProfileDimensionInputSlice[] {
  return Object.freeze(observations.map((obs) => toDimensionInput(obs, 'trend')));
}

export function toStructureInputs(
  observations: readonly MarketObservationSlice[],
): readonly ProfileDimensionInputSlice[] {
  return Object.freeze(observations.map((obs) => toDimensionInput(obs, 'structure')));
}

export type { ResearchOutputRef };
