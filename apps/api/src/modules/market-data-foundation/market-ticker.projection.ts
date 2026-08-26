import type { MarketTickerFreshness, NormalizedMarketTicker } from './market-ticker';

/**
 * Public Market Data ticker projection.
 * No candles, order book, trades, balances, positions, or exchange-private fields.
 */
export type MarketTickerFieldsView = Readonly<{
  normalizedSymbol: string;
  lastPrice: string;
  bid: string;
  ask: string;
  changePercent24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketTickerFreshness;
}>;

export type MarketTickerRetrievalView = Readonly<{
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  ticker: MarketTickerFieldsView | null;
  freshness: MarketTickerFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
}>;

export function projectMarketTicker(ticker: NormalizedMarketTicker): MarketTickerFieldsView {
  return Object.freeze({
    normalizedSymbol: ticker.normalizedSymbol,
    lastPrice: ticker.lastPrice,
    bid: ticker.bid,
    ask: ticker.ask,
    changePercent24h: ticker.changePercent24h,
    high24h: ticker.high24h,
    low24h: ticker.low24h,
    volume24h: ticker.volume24h,
    exchangeTimestamp: ticker.exchangeTimestamp,
    retrievalTimestamp: ticker.retrievalTimestamp,
    providerId: ticker.providerId,
    freshness: ticker.freshness,
  });
}

export function projectTickerRetrieval(input: {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  ticker: NormalizedMarketTicker | null;
  freshness: MarketTickerFreshness;
  outcome: MarketTickerRetrievalView['outcome'];
  failureReason: string | null;
}): MarketTickerRetrievalView {
  return Object.freeze({
    connectionId: input.connectionId,
    providerId: input.providerId,
    exchangeSymbol: input.exchangeSymbol,
    ticker: input.ticker ? projectMarketTicker(input.ticker) : null,
    freshness: input.freshness,
    outcome: input.outcome,
    failureReason: input.failureReason,
  });
}
