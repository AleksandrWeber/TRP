import type { ProviderTickerObservation } from './market-ticker';

/**
 * Ticker retrieval adapter contract (W2-S03-c).
 *
 * Transport is an implementation detail of each adapter. The Market Data
 * domain never names REST, streaming sockets, cache, or storage on this interface.
 */
export type MarketTickerRetrievalAdapterKind =
  'retrieved' | 'provider_unavailable' | 'not_implemented' | 'malformed' | 'failed';

export type MarketTickerRetrievalAdapterRequest = Readonly<{
  exchangeSymbol: string;
  nowMs: number;
  signal: AbortSignal;
}>;

export type MarketTickerRetrievalAdapterResult = Readonly<{
  kind: MarketTickerRetrievalAdapterKind;
  observation?: ProviderTickerObservation;
}>;

export interface MarketTickerRetrievalAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  retrieve(
    request: MarketTickerRetrievalAdapterRequest,
  ): Promise<MarketTickerRetrievalAdapterResult>;
}

export const MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS = Symbol(
  'MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS',
);
