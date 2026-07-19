import type { Timeframe } from './timeframe';

/**
 * Canonical OHLCV candle of the Market Data Domain (US006).
 * Provider-agnostic — every provider must map its payload into this shape.
 */
export type Candle = Readonly<{
  symbol: string;
  timeframe: Timeframe;
  /** ISO-8601 inclusive bucket start. */
  openTime: string;
  /** ISO-8601 exclusive bucket end (openTime + timeframe). */
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>;

/**
 * Validating factory — rejects candles that violate OHLCV invariants so a
 * misbehaving provider can never hydrate an invalid domain object.
 */
export function createCandle(input: Candle): Candle {
  assertSymbol(input.symbol);

  const openTimeMs = Date.parse(input.openTime);
  const closeTimeMs = Date.parse(input.closeTime);
  if (!Number.isFinite(openTimeMs) || !Number.isFinite(closeTimeMs)) {
    throw new Error('Candle openTime and closeTime must be valid ISO-8601 timestamps');
  }
  if (openTimeMs >= closeTimeMs) {
    throw new Error('Candle openTime must be before closeTime');
  }

  for (const [field, value] of Object.entries({
    open: input.open,
    high: input.high,
    low: input.low,
    close: input.close,
  })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Candle ${field} must be a finite positive number`);
    }
  }
  if (!Number.isFinite(input.volume) || input.volume < 0) {
    throw new Error('Candle volume must be a finite non-negative number');
  }
  if (input.high < Math.max(input.open, input.close)) {
    throw new Error('Candle high must be >= max(open, close)');
  }
  if (input.low > Math.min(input.open, input.close)) {
    throw new Error('Candle low must be <= min(open, close)');
  }

  return Object.freeze({ ...input });
}

export function assertSymbol(symbol: string): void {
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    throw new Error('symbol must contain only uppercase letters and numbers');
  }
}
