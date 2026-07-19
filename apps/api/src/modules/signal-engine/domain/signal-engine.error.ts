export const SIGNAL_ENGINE_ERROR_CODES = ['UNKNOWN_EVALUATOR', 'EMPTY_CANDLE_SERIES'] as const;
export type SignalEngineErrorCode = (typeof SIGNAL_ENGINE_ERROR_CODES)[number];

/**
 * Canonical error boundary of the Signal Engine (US009).
 * Mirrors the MarketDataDomainError policy (US007): engine internals convert
 * every evaluation failure into one of these errors so HTTP mapping stays in
 * one filter and evaluator details never leak to consumers.
 */
export abstract class SignalEngineError extends Error {
  abstract readonly code: SignalEngineErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The strategy requests an evaluator id that is not registered. */
export class UnknownStrategyEvaluatorError extends SignalEngineError {
  readonly code = 'UNKNOWN_EVALUATOR' as const;

  constructor(evaluatorId: string, registered: ReadonlyArray<string>) {
    super(
      `Unknown strategy evaluator '${evaluatorId}' — registered evaluators: ${registered.join(', ')}`,
    );
  }
}

/** The market data pipeline returned no candles, so nothing can be evaluated. */
export class EmptyCandleSeriesError extends SignalEngineError {
  readonly code = 'EMPTY_CANDLE_SERIES' as const;

  constructor(symbol: string, timeframe: string) {
    super(`No candles available to evaluate ${symbol} @ ${timeframe}`);
  }
}
