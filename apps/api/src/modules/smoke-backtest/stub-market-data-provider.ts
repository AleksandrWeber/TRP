import type { MarketDataProvider } from '../paper-trading-runner';

/**
 * Deterministic in-memory candle feed for the US191 Smoke Backtest.
 *
 * No CSV, database, API, or live market connection.
 */

export type SmokeCandle = Readonly<{
  index: number;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>;

const DEFAULT_CANDLES: readonly SmokeCandle[] = Object.freeze([
  Object.freeze({
    index: 1,
    openTime: '2026-07-19T20:00:00.000Z',
    closeTime: '2026-07-19T20:05:00.000Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1_000,
  }),
  Object.freeze({
    index: 2,
    openTime: '2026-07-19T20:05:00.000Z',
    closeTime: '2026-07-19T20:10:00.000Z',
    open: 105,
    high: 115,
    low: 100,
    close: 112,
    volume: 1_100,
  }),
  Object.freeze({
    index: 3,
    openTime: '2026-07-19T20:10:00.000Z',
    closeTime: '2026-07-19T20:15:00.000Z',
    open: 112,
    high: 120,
    low: 108,
    close: 118,
    volume: 1_200,
  }),
]);

export class StubMarketDataProvider implements MarketDataProvider<SmokeCandle> {
  private readonly candles: readonly SmokeCandle[];
  private cursor: number;
  private currentCandle: SmokeCandle | null;

  private constructor(candles: readonly SmokeCandle[]) {
    this.candles = Object.freeze(candles.map((candle) => Object.freeze({ ...candle })));
    this.cursor = 0;
    this.currentCandle = null;
  }

  static create(candles: readonly SmokeCandle[] = DEFAULT_CANDLES): StubMarketDataProvider {
    if (candles === null || candles === undefined) {
      throw new Error('candles are required');
    }
    return new StubMarketDataProvider(candles);
  }

  static defaultCandles(): readonly SmokeCandle[] {
    return DEFAULT_CANDLES;
  }

  next(): SmokeCandle | null {
    if (this.cursor >= this.candles.length) {
      this.currentCandle = null;
      return null;
    }
    const candle = this.candles[this.cursor] as SmokeCandle;
    this.cursor += 1;
    this.currentCandle = candle;
    return candle;
  }

  current(): SmokeCandle | null {
    return this.currentCandle;
  }

  reset(): void {
    this.cursor = 0;
    this.currentCandle = null;
  }

  remaining(): number {
    return Math.max(0, this.candles.length - this.cursor);
  }

  size(): number {
    return this.candles.length;
  }
}
