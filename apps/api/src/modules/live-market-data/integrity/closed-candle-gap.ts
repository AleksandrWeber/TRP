import type { Timeframe } from '../../market-data/timeframe';
import { timeframeDurationMs } from './timeframe-duration';

/**
 * Deterministic closed-candle gap model (US139).
 * Identifies missing open-time intervals between last accepted and next observed candle.
 */
export type ClosedCandleGap = Readonly<{
  streamId: string;
  timeframe: Timeframe;
  /** Inclusive ISO open-time of first missing candle. */
  fromOpenTime: string;
  /** Inclusive ISO open-time of last missing candle. */
  toOpenTime: string;
  missingIntervalCount: number;
  /** When set, recovery could not close the gap. */
  unresolved: boolean;
  reason: string | null;
}>;

export type DetectClosedCandleGapInput = {
  streamId: string;
  timeframe: Timeframe;
  /** Last accepted candle open time (ISO). Null when stream has no progress. */
  lastAcceptedOpenTime: string | null;
  /** Next observed candle open time that exposed the gap (ISO). */
  nextObservedOpenTime: string;
};

/**
 * Detect missing closed-candle open-time intervals.
 * Returns null when contiguous or when next is not after last.
 */
export function detectClosedCandleGap(input: DetectClosedCandleGapInput): ClosedCandleGap | null {
  if (input.lastAcceptedOpenTime === null) {
    return null;
  }

  const durationMs = timeframeDurationMs(input.timeframe);
  const lastMs = Date.parse(input.lastAcceptedOpenTime);
  const nextMs = Date.parse(input.nextObservedOpenTime);
  if (!Number.isFinite(lastMs) || !Number.isFinite(nextMs)) {
    throw new Error('gap detection requires valid ISO-8601 open times');
  }
  if (nextMs <= lastMs) {
    return null;
  }

  const expectedNextMs = lastMs + durationMs;
  if (nextMs <= expectedNextMs) {
    return null;
  }

  const fromOpenTime = new Date(expectedNextMs).toISOString();
  const toOpenTime = new Date(nextMs - durationMs).toISOString();
  const missingIntervalCount = Math.round((nextMs - expectedNextMs) / durationMs);

  if (missingIntervalCount < 1) {
    return null;
  }

  return Object.freeze({
    streamId: input.streamId,
    timeframe: input.timeframe,
    fromOpenTime,
    toOpenTime,
    missingIntervalCount,
    unresolved: false,
    reason: null,
  });
}

/**
 * Enumerate expected open times inside a gap (inclusive).
 */
export function enumerateGapOpenTimes(gap: ClosedCandleGap): string[] {
  const durationMs = timeframeDurationMs(gap.timeframe);
  const fromMs = Date.parse(gap.fromOpenTime);
  const toMs = Date.parse(gap.toOpenTime);
  const times: string[] = [];
  for (let t = fromMs; t <= toMs; t += durationMs) {
    times.push(new Date(t).toISOString());
  }
  return times;
}

export function markGapUnresolved(gap: ClosedCandleGap, reason: string): ClosedCandleGap {
  return Object.freeze({
    ...gap,
    unresolved: true,
    reason,
  });
}
