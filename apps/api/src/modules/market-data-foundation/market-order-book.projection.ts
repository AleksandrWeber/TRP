import type {
  MarketOrderBookDepth,
  MarketOrderBookFreshness,
  NormalizedMarketOrderBook,
  NormalizedOrderBookLevel,
} from './market-order-book';

/**
 * Public Market Data order book projection.
 * No trades, streaming state, balances, positions, or exchange-private fields.
 */
export type MarketOrderBookLevelView = Readonly<{
  price: string;
  quantity: string;
}>;

export type MarketOrderBookFieldsView = Readonly<{
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
  bids: readonly MarketOrderBookLevelView[];
  asks: readonly MarketOrderBookLevelView[];
  exchangeTimestamp: string | null;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketOrderBookFreshness;
}>;

export type MarketOrderBookRetrievalView = Readonly<{
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  depthLimit: MarketOrderBookDepth | number;
  orderBook: MarketOrderBookFieldsView | null;
  freshness: MarketOrderBookFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
}>;

export function projectOrderBookLevel(level: NormalizedOrderBookLevel): MarketOrderBookLevelView {
  return Object.freeze({
    price: level.price,
    quantity: level.quantity,
  });
}

export function projectMarketOrderBook(
  orderBook: NormalizedMarketOrderBook,
): MarketOrderBookFieldsView {
  return Object.freeze({
    normalizedSymbol: orderBook.normalizedSymbol,
    depthLimit: orderBook.depthLimit,
    bids: Object.freeze(orderBook.bids.map(projectOrderBookLevel)),
    asks: Object.freeze(orderBook.asks.map(projectOrderBookLevel)),
    exchangeTimestamp: orderBook.exchangeTimestamp,
    retrievalTimestamp: orderBook.retrievalTimestamp,
    providerId: orderBook.providerId,
    freshness: orderBook.freshness,
  });
}

export function projectOrderBookRetrieval(input: {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  depthLimit: MarketOrderBookDepth | number;
  orderBook: NormalizedMarketOrderBook | null;
  freshness: MarketOrderBookFreshness;
  outcome: MarketOrderBookRetrievalView['outcome'];
  failureReason: string | null;
}): MarketOrderBookRetrievalView {
  return Object.freeze({
    connectionId: input.connectionId,
    providerId: input.providerId,
    exchangeSymbol: input.exchangeSymbol,
    depthLimit: input.depthLimit,
    orderBook: input.orderBook ? projectMarketOrderBook(input.orderBook) : null,
    freshness: input.freshness,
    outcome: input.outcome,
    failureReason: input.failureReason,
  });
}
