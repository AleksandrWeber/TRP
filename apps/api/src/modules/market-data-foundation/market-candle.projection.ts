import type {
  MarketCandleFreshness,
  MarketCandleInterval,
  NormalizedMarketCandle,
} from './market-candle';

/**
 * Public Market Data candlestick projection.
 * No order book, trades, balances, positions, or exchange-private fields.
 */
export type MarketCandleFieldsView = Readonly<{
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  openTime: string;
  closeTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeCount: number | null;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
}>;

export type MarketCandleRetrievalView = Readonly<{
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  interval: MarketCandleInterval | string;
  rangeStart: string;
  rangeEnd: string;
  candles: readonly MarketCandleFieldsView[];
  freshness: MarketCandleFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
}>;

export function projectMarketCandle(candle: NormalizedMarketCandle): MarketCandleFieldsView {
  return Object.freeze({
    normalizedSymbol: candle.normalizedSymbol,
    interval: candle.interval,
    openTime: candle.openTime,
    closeTime: candle.closeTime,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    tradeCount: candle.tradeCount,
    exchangeTimestamp: candle.exchangeTimestamp,
    retrievalTimestamp: candle.retrievalTimestamp,
    providerId: candle.providerId,
  });
}

export function projectCandleRetrieval(input: {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  interval: MarketCandleInterval | string;
  rangeStart: string;
  rangeEnd: string;
  candles: readonly NormalizedMarketCandle[];
  freshness: MarketCandleFreshness;
  outcome: MarketCandleRetrievalView['outcome'];
  failureReason: string | null;
}): MarketCandleRetrievalView {
  return Object.freeze({
    connectionId: input.connectionId,
    providerId: input.providerId,
    exchangeSymbol: input.exchangeSymbol,
    interval: input.interval,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
    candles: Object.freeze(input.candles.map(projectMarketCandle)),
    freshness: input.freshness,
    outcome: input.outcome,
    failureReason: input.failureReason,
  });
}
