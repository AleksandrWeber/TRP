import { assertSymbol } from '../../market-data-domain/domain/candle';
import { isTimeframe, type Timeframe } from '../../market-data-domain/domain/timeframe';

export const SIGNAL_TYPES = ['BUY', 'SELL', 'HOLD'] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export function isSignalType(value: string): value is SignalType {
  return (SIGNAL_TYPES as readonly string[]).includes(value);
}

export type SignalMetadata = Readonly<Record<string, unknown>>;

/**
 * Canonical output of the Signal Engine (US009).
 * Evaluator-agnostic — every StrategyEvaluator decision is normalized into
 * this shape before it leaves the engine. Not persisted in this milestone.
 */
export type SignalResult = Readonly<{
  strategyId: string;
  symbol: string;
  timeframe: Timeframe;
  signal: SignalType;
  /** Deterministic evaluator conviction in [0, 1]. */
  confidence: number;
  /** ISO-8601 moment the evaluation was produced. */
  timestamp: string;
  /** Evaluator-specific diagnostic payload (inputs, evaluator id, …). */
  metadata: SignalMetadata;
}>;

/**
 * Validating factory — rejects malformed results so a misbehaving evaluator
 * can never hand an invalid SignalResult to API consumers.
 */
export function createSignalResult(input: SignalResult): SignalResult {
  if (input.strategyId.trim() === '') {
    throw new Error('SignalResult strategyId must not be empty');
  }
  assertSymbol(input.symbol);
  if (!isTimeframe(input.timeframe)) {
    throw new Error(`SignalResult timeframe is not supported: ${input.timeframe}`);
  }
  if (!isSignalType(input.signal)) {
    throw new Error(`SignalResult signal is not supported: ${input.signal}`);
  }
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new Error('SignalResult confidence must be a finite number in [0, 1]');
  }
  if (!Number.isFinite(Date.parse(input.timestamp))) {
    throw new Error('SignalResult timestamp must be a valid ISO-8601 timestamp');
  }
  if (
    input.metadata === null ||
    typeof input.metadata !== 'object' ||
    Array.isArray(input.metadata)
  ) {
    throw new Error('SignalResult metadata must be a plain object');
  }

  return Object.freeze({ ...input, metadata: Object.freeze({ ...input.metadata }) });
}
