import type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from '../signal-engine/evaluators/strategy-evaluator';
import type { StrategyParameters } from '../strategies';
import {
  assertPeriod,
  IndicatorRegistry,
  InvalidIndicatorPeriodError,
} from '../technical-indicators';

/** Strategy parameter naming the indicator period. */
export const PERIOD_PARAMETER_KEY = 'period';
/** Optional strategy parameter overriding the evaluator's default indicator. */
export const INDICATOR_PARAMETER_KEY = 'indicator';
/** Period used when the strategy does not configure one. */
export const DEFAULT_INDICATOR_PERIOD = 20;

/**
 * Shared core of indicator-backed strategy evaluators (US012).
 * Bridges the Signal Engine (US009) and the Technical Indicators Engine
 * (US011): the indicator computes values, the evaluator makes the trading
 * decision. Subclasses only pin their evaluator id and default indicator.
 *
 * Decision: latest close > latest indicator value → BUY, otherwise SELL.
 *
 * Confidence: min(1, |close − indicator| / close), rounded to 4 decimals —
 * the relative distance between price and its moving average. Deterministic;
 * 0 when price sits exactly on the indicator, growing toward 1 as the
 * distance approaches 100% of the close price.
 */
export abstract class IndicatorStrategyEvaluator implements StrategyEvaluator {
  abstract readonly id: string;
  /** IndicatorRegistry id computed when the strategy does not override it. */
  protected abstract readonly defaultIndicatorId: string;

  constructor(private readonly indicators: IndicatorRegistry) {}

  async evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation> {
    const period = readPeriod(context.strategy.parameters);
    const indicatorId = this.readIndicatorId(context.strategy.parameters);

    // Unknown ids raise UNKNOWN_INDICATOR; the calculation itself fails fast
    // on insufficient candles and non-finite values (US011 validation).
    const indicator = this.indicators.resolve(indicatorId);
    const result = indicator.calculate({ series: context.candles, period });

    const indicatorValue = result.values[result.values.length - 1];
    const close = context.candles[context.candles.length - 1].close;

    const signal = close > indicatorValue ? 'BUY' : 'SELL';
    const confidence = round4(Math.min(1, Math.abs(close - indicatorValue) / close));

    return Object.freeze({
      signal,
      confidence,
      metadata: Object.freeze({
        evaluator: this.id,
        indicator: indicatorId,
        period,
        indicatorValue,
        close,
        candlesEvaluated: context.candles.length,
        calculatedLength: result.metadata.calculatedLength,
      }),
    });
  }

  private readIndicatorId(parameters: StrategyParameters): string {
    const requested = parameters[INDICATOR_PARAMETER_KEY];
    if (requested === undefined) return this.defaultIndicatorId;
    // Non-string values can never match a registered id — stringify so the
    // registry reports them as UNKNOWN_INDICATOR with the inventory.
    return typeof requested === 'string' ? requested : String(requested);
  }
}

function readPeriod(parameters: StrategyParameters): number {
  const requested = parameters[PERIOD_PARAMETER_KEY];
  if (requested === undefined) return DEFAULT_INDICATOR_PERIOD;
  if (typeof requested !== 'number') {
    throw new InvalidIndicatorPeriodError(Number(requested));
  }
  assertPeriod(requested);
  return requested;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
