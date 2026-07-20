import { assertSymbol } from './candle';

/**
 * Canonical last-price ticker of the Market Data Domain (US006).
 */
export type Ticker = Readonly<{
  symbol: string;
  price: number;
  /** ISO-8601 */
  timestamp: string;
}>;

/**
 * Validating factory — providers must return a well-formed Ticker.
 */
export function createTicker(input: Ticker): Ticker {
  assertSymbol(input.symbol);
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error('Ticker price must be a finite positive number');
  }
  if (!Number.isFinite(Date.parse(input.timestamp))) {
    throw new Error('Ticker timestamp must be a valid ISO-8601 timestamp');
  }
  return Object.freeze({ ...input });
}
