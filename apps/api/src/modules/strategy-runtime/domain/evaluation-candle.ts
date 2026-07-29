import { isStrategyTimeframe, type StrategyTimeframe } from '../../strategies/strategy';
import {
  CLOSED_CANDLE_TICK_EVENT_TYPE,
  createClosedCandleTickEvent,
  type ClosedCandleTickEvent,
  type ClosedCandleTickEventInput,
} from './closed-candle-tick';

/**
 * Closed-candle payload for Runtime evaluation (US219).
 * Extends admission tick identity with OHLC/V semantic inputs.
 */
export type EvaluationCandle = ClosedCandleTickEvent &
  Readonly<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;

export type EvaluationCandleInput = ClosedCandleTickEventInput &
  Readonly<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;

export function createEvaluationCandle(input: EvaluationCandleInput): EvaluationCandle {
  const tick = createClosedCandleTickEvent(input);
  const open = finiteNumber(input.open, 'open');
  const high = finiteNumber(input.high, 'high');
  const low = finiteNumber(input.low, 'low');
  const close = finiteNumber(input.close, 'close');
  const volume = finiteNumber(input.volume, 'volume');
  if (volume < 0) throw new Error('volume must not be negative');
  if (high < low) throw new Error('high must be greater than or equal to low');
  if (high < open || high < close) {
    throw new Error('high must be greater than or equal to open and close');
  }
  if (low > open || low > close) {
    throw new Error('low must be less than or equal to open and close');
  }

  return Object.freeze({
    ...tick,
    open,
    high,
    low,
    close,
    volume,
  });
}

export function candleMatchesDeployment(
  candle: EvaluationCandle,
  deployment: Readonly<{ instrument: string; timeframe: StrategyTimeframe }>,
): void {
  if (candle.instrument !== deployment.instrument) {
    throw new Error('evaluation candle instrument must match deployment');
  }
  if (candle.timeframe !== deployment.timeframe) {
    throw new Error('evaluation candle timeframe must match deployment');
  }
  if (!isStrategyTimeframe(candle.timeframe)) {
    throw new Error(`unsupported evaluation timeframe: ${candle.timeframe}`);
  }
  if (candle.eventType !== CLOSED_CANDLE_TICK_EVENT_TYPE) {
    throw new Error('evaluation requires a closed-candle tick');
  }
}

function finiteNumber(value: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
