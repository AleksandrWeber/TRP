import type { MarketOrderBookDepth, ProviderOrderBookSnapshot } from './market-order-book';

/**
 * Order book retrieval adapter contract (W2-S03-e).
 *
 * Transport is an implementation detail of each adapter. The Market Data
 * domain never names REST, streaming sockets, cache, or storage on this interface.
 */
export type MarketOrderBookRetrievalAdapterKind =
  'retrieved' | 'provider_unavailable' | 'not_implemented' | 'malformed' | 'failed';

export type MarketOrderBookRetrievalAdapterRequest = Readonly<{
  exchangeSymbol: string;
  depthLimit: MarketOrderBookDepth;
  nowMs: number;
  signal: AbortSignal;
}>;

export type MarketOrderBookRetrievalAdapterResult = Readonly<{
  kind: MarketOrderBookRetrievalAdapterKind;
  snapshot?: ProviderOrderBookSnapshot;
}>;

export interface MarketOrderBookRetrievalAdapter {
  readonly providerId: string;
  readonly implemented: boolean;
  retrieve(
    request: MarketOrderBookRetrievalAdapterRequest,
  ): Promise<MarketOrderBookRetrievalAdapterResult>;
}

export const MARKET_DATA_ORDER_BOOK_RETRIEVAL_ADAPTERS = Symbol(
  'MARKET_DATA_ORDER_BOOK_RETRIEVAL_ADAPTERS',
);
