import type { Candle } from '../../market-data-domain/domain/candle';
import type { Strategy } from '../../strategies';
import type { SignalMetadata, SignalType } from '../domain/signal-result';

/**
 * Everything an evaluator may look at: the strategy configuration (pair,
 * timeframe, parameters, …) and the cached candle window, oldest first.
 * The engine guarantees at least one candle.
 */
export type StrategyEvaluationContext = Readonly<{
  strategy: Strategy;
  candles: ReadonlyArray<Candle>;
}>;

/**
 * Raw evaluator decision. The StrategyRunner enriches it with the strategy
 * identity and timestamp to build the canonical SignalResult — evaluators
 * only decide, they never assemble API payloads.
 */
export type StrategyEvaluation = Readonly<{
  signal: SignalType;
  /** Deterministic conviction in [0, 1]. */
  confidence: number;
  metadata: SignalMetadata;
}>;

/**
 * Strategy evaluator port (US009).
 * One implementation per indicator/technique — Dummy today; Moving Average,
 * RSI, MACD, Bollinger, and AI evaluators plug in behind this interface
 * without touching the engine. Async so future evaluators may do I/O (AI).
 */
export interface StrategyEvaluator {
  /** Stable registry identifier, e.g. 'dummy', 'rsi'. */
  readonly id: string;

  evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation>;
}
