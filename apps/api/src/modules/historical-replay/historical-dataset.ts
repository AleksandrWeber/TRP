import { isTimeframe, type Timeframe } from '../market-data/timeframe';
import { createHistoricalCandle, type HistoricalCandle } from './historical-candle';

/**
 * Immutable in-memory historical dataset for US193 Historical Replay.
 *
 * Candles are frozen. Providers never mutate the dataset.
 */

export type HistoricalDataset = Readonly<{
  datasetId: string;
  symbol: string;
  timeframe: Timeframe;
  candles: readonly HistoricalCandle[];
}>;

export type CreateHistoricalDatasetInput = Readonly<{
  datasetId: string;
  symbol: string;
  timeframe: string;
  candles: readonly HistoricalCandle[];
}>;

export function createHistoricalDataset(input: CreateHistoricalDatasetInput): HistoricalDataset {
  const datasetId = required(input.datasetId, 'datasetId');
  const symbol = required(input.symbol, 'symbol');

  if (!isTimeframe(input.timeframe)) {
    throw new Error(`invalid timeframe: ${String(input.timeframe)}`);
  }

  if (input.candles === null || input.candles === undefined) {
    throw new Error('candles are required');
  }
  if (input.candles.length === 0) {
    throw new Error('dataset must not be empty');
  }

  const candles = Object.freeze(input.candles.map((candle) => createHistoricalCandle(candle)));
  assertStrictlyIncreasingTimestamps(candles);

  return Object.freeze({
    datasetId,
    symbol,
    timeframe: input.timeframe,
    candles,
  });
}

function assertStrictlyIncreasingTimestamps(candles: readonly HistoricalCandle[]): void {
  const seen = new Set<string>();
  let previousMs = Number.NEGATIVE_INFINITY;

  for (const candle of candles) {
    if (seen.has(candle.timestamp)) {
      throw new Error(`duplicate candle timestamp: ${candle.timestamp}`);
    }
    seen.add(candle.timestamp);

    const currentMs = Date.parse(candle.timestamp);
    if (currentMs <= previousMs) {
      throw new Error(`invalid candle order at timestamp: ${candle.timestamp}`);
    }
    previousMs = currentMs;
  }
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
