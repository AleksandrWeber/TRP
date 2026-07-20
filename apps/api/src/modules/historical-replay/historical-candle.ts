/**
 * Immutable OHLCV candle for US193 Historical Replay.
 *
 * No indicators and no derived values.
 */

export type HistoricalCandle = Readonly<{
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>;

export function createHistoricalCandle(properties: HistoricalCandle): HistoricalCandle {
  return Object.freeze({
    timestamp: canonicalIso(properties.timestamp, 'timestamp'),
    open: finiteNumber(properties.open, 'open'),
    high: finiteNumber(properties.high, 'high'),
    low: finiteNumber(properties.low, 'low'),
    close: finiteNumber(properties.close, 'close'),
    volume: finiteNumber(properties.volume, 'volume'),
  });
}

function canonicalIso(value: string, field: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function finiteNumber(value: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}
