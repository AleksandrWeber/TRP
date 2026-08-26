import { Injectable } from '@nestjs/common';
import type {
  MarketCandleFreshness,
  MarketCandleInterval,
  NormalizedMarketCandle,
} from './market-candle';

export type MarketCandleCacheEntry = Readonly<{
  providerId: string;
  exchangeSymbol: string;
  interval: MarketCandleInterval;
  rangeStart: string;
  rangeEnd: string;
  retrievedAt: string;
  freshness: MarketCandleFreshness;
  candles: readonly NormalizedMarketCandle[];
}>;

/**
 * Session-safe candlestick cache (W2-S03-d).
 *
 * Caches only normalized OHLCV objects. No order book, trades, or streaming.
 * Entries are scoped to one workspace connection symbol/interval/range and
 * are not persisted. Cache behavior is transport-independent.
 */
@Injectable()
export class MarketCandleCache {
  private readonly entries = new Map<string, MarketCandleCacheEntry>();

  get(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    interval: MarketCandleInterval,
    rangeStart: string,
    rangeEnd: string,
  ): MarketCandleCacheEntry | null {
    return (
      this.entries.get(
        cacheKey(workspaceId, connectionId, exchangeSymbol, interval, rangeStart, rangeEnd),
      ) ?? null
    );
  }

  set(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    interval: MarketCandleInterval,
    rangeStart: string,
    rangeEnd: string,
    entry: MarketCandleCacheEntry,
  ): void {
    this.entries.set(
      cacheKey(workspaceId, connectionId, exchangeSymbol, interval, rangeStart, rangeEnd),
      Object.freeze({
        providerId: entry.providerId,
        exchangeSymbol: entry.exchangeSymbol,
        interval: entry.interval,
        rangeStart: entry.rangeStart,
        rangeEnd: entry.rangeEnd,
        retrievedAt: entry.retrievedAt,
        freshness: entry.freshness,
        candles: Object.freeze(entry.candles.map((candle) => Object.freeze({ ...candle }))),
      }),
    );
  }

  clear(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    interval: MarketCandleInterval,
    rangeStart: string,
    rangeEnd: string,
  ): void {
    this.entries.delete(
      cacheKey(workspaceId, connectionId, exchangeSymbol, interval, rangeStart, rangeEnd),
    );
  }
}

function cacheKey(
  workspaceId: string,
  connectionId: string,
  exchangeSymbol: string,
  interval: string,
  rangeStart: string,
  rangeEnd: string,
): string {
  return `${workspaceId}:${connectionId}:${exchangeSymbol.toUpperCase()}:${interval}:${rangeStart}:${rangeEnd}`;
}
