import type { MarketCandleInterval, ProviderCandleObservation } from './market-candle';

/**
 * Candlestick retrieval adapter contract (W2-S03-d).
 *
 * Transport is an implementation detail of each adapter. The Market Data
 * domain never names REST, streaming sockets, cache, or storage on this interface.
 */
export type MarketCandleRetrievalAdapterKind =
  'retrieved' | 'provider_unavailable' | 'not_implemented' | 'malformed' | 'failed';

export type MarketCandleRetrievalAdapterRequest = Readonly<{
  exchangeSymbol: string;
  interval: MarketCandleInterval;
  rangeStartMs: number;
  rangeEndMs: number;
  nowMs: number;
  signal: AbortSignal;
}>;

export type MarketCandleRetrievalAdapterResult = Readonly<{
  kind: MarketCandleRetrievalAdapterKind;
  observations?: readonly ProviderCandleObservation[];
}>;

export interface MarketCandleRetrievalAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  retrieve(
    request: MarketCandleRetrievalAdapterRequest,
  ): Promise<MarketCandleRetrievalAdapterResult>;
}

export const MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS = Symbol(
  'MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS',
);
