import { createCandle, type Candle } from '../domain/candle';
import { createTicker, type Ticker } from '../domain/ticker';
import { timeframeToMillis, type Timeframe } from '../domain/timeframe';
import type { MarketDataProvider, MarketDataProviderHealth } from '../ports/market-data-provider';

export const MOCK_MARKET_DATA_PROVIDER_ID = 'mock';

/**
 * Fixed series anchor — the mock market "now". Everything is derived from
 * this constant so identical requests always return identical data.
 */
export const MOCK_SERIES_ANCHOR_ISO = '2026-01-01T00:00:00.000Z';
const ANCHOR_MS = Date.parse(MOCK_SERIES_ANCHOR_ISO);

/**
 * Deterministic in-process market data provider (US006).
 * No I/O, no randomness, no clock reads — values are pure functions of the
 * request (symbol / timeframe / bucket). Placeholder until the Binance
 * provider lands in the next milestone.
 */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = MOCK_MARKET_DATA_PROVIDER_ID;

  async getTicker(symbol: string): Promise<Ticker> {
    return createTicker({
      symbol,
      price: round2(basePrice(symbol) * (1 + 0.05 * signal(`${symbol}:ticker`))),
      timestamp: MOCK_SERIES_ANCHOR_ISO,
    });
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('limit must be a positive integer');
    }

    const bucketMs = timeframeToMillis(timeframe);
    const candles: Candle[] = [];
    for (let i = limit - 1; i >= 0; i -= 1) {
      const openTimeMs = ANCHOR_MS - (i + 1) * bucketMs;
      candles.push(buildCandle(symbol, timeframe, openTimeMs, bucketMs));
    }
    return candles;
  }

  async health(): Promise<MarketDataProviderHealth> {
    return Object.freeze({
      providerId: this.id,
      status: 'ok' as const,
      detail: 'deterministic mock provider — no upstream dependency',
    });
  }
}

function buildCandle(
  symbol: string,
  timeframe: Timeframe,
  openTimeMs: number,
  bucketMs: number,
): Candle {
  const seedPrefix = `${symbol}:${timeframe}:${openTimeMs}`;
  const base = basePrice(symbol);

  const open = base * (1 + 0.04 * signal(`${seedPrefix}:open`));
  const close = base * (1 + 0.04 * signal(`${seedPrefix}:close`));
  const wick = 0.01 * (1 + unit(`${seedPrefix}:wick`));
  const high = Math.max(open, close) * (1 + wick);
  const low = Math.min(open, close) * (1 - wick);
  const volume = 100 + Math.floor(unit(`${seedPrefix}:volume`) * 9900);

  return createCandle({
    symbol,
    timeframe,
    openTime: new Date(openTimeMs).toISOString(),
    closeTime: new Date(openTimeMs + bucketMs).toISOString(),
    open: round2(open),
    high: round2(high),
    low: round2(low),
    close: round2(close),
    volume,
  });
}

/** Deterministic per-symbol base price in the [100, 90100) range. */
function basePrice(symbol: string): number {
  return 100 + (fnv1a(symbol) % 90_000);
}

/** Deterministic value in [0, 1). */
function unit(seed: string): number {
  return fnv1a(seed) / 0x1_0000_0000;
}

/** Deterministic value in [-1, 1). */
function signal(seed: string): number {
  return unit(seed) * 2 - 1;
}

/** FNV-1a 32-bit — stable, dependency-free string hash. */
function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
