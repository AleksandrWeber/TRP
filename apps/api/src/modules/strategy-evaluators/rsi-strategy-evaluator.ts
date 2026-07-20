import type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from '../signal-engine/evaluators/strategy-evaluator';
import type { SignalType } from '../signal-engine/domain/signal-result';
import { IndicatorRegistry, RSI_INDICATOR_ID } from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';
import { readNumberParameter, readPeriodParameter, round4 } from './evaluator-parameters';

export const RSI_STRATEGY_EVALUATOR_ID = 'rsi';

export const DEFAULT_RSI_PERIOD = 14;
export const DEFAULT_RSI_OVERBOUGHT = 70;
export const DEFAULT_RSI_OVERSOLD = 30;

/**
 * RSI Strategy Evaluator (US014).
 * Delegates the mathematics to the 'rsi' indicator (US013) and decides on
 * the latest completed RSI value:
 *
 *   RSI <= oversold   → BUY
 *   RSI >= overbought → SELL
 *   otherwise         → HOLD
 *
 * Confidence reuses the US012 relative-distance mechanism: how far the RSI
 * penetrated beyond the triggered threshold, relative to the room left on
 * the RSI scale (oversold − rsi) / oversold for BUY, (rsi − overbought) /
 * (100 − overbought) for SELL, clamped to [0, 1] and rounded to 4 decimals.
 * HOLD and an RSI sitting exactly on a threshold score 0.
 */
export class RsiStrategyEvaluator implements StrategyEvaluator {
  readonly id = RSI_STRATEGY_EVALUATOR_ID;

  constructor(private readonly indicators: IndicatorRegistry) {}

  async evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation> {
    const parameters = context.strategy.parameters;
    const period = readPeriodParameter(parameters, 'period', DEFAULT_RSI_PERIOD);
    const overbought = readNumberParameter(parameters, 'overbought', DEFAULT_RSI_OVERBOUGHT);
    const oversold = readNumberParameter(parameters, 'oversold', DEFAULT_RSI_OVERSOLD);
    assertThresholds(oversold, overbought);

    // The indicator fails fast on insufficient candles (needs period + 1)
    // and on non-finite closes (US011/US013 validation).
    const indicator = this.indicators.resolve(RSI_INDICATOR_ID);
    const result = indicator.calculate({ series: context.candles, period });
    const rsi = result.values[result.values.length - 1];

    let signal: SignalType = 'HOLD';
    let confidence = 0;
    if (rsi <= oversold) {
      signal = 'BUY';
      // Thresholds at the scale edge leave no penetration room — score 0.
      confidence = oversold === 0 ? 0 : round4(Math.min(1, (oversold - rsi) / oversold));
    } else if (rsi >= overbought) {
      signal = 'SELL';
      confidence =
        overbought === 100 ? 0 : round4(Math.min(1, (rsi - overbought) / (100 - overbought)));
    }

    return Object.freeze({
      signal,
      confidence,
      metadata: Object.freeze({
        evaluator: this.id,
        indicator: RSI_INDICATOR_ID,
        period,
        rsi,
        overbought,
        oversold,
        candlesEvaluated: context.candles.length,
        calculatedLength: result.metadata.calculatedLength,
      }),
    });
  }
}

function assertThresholds(oversold: number, overbought: number): void {
  if (oversold < 0 || overbought > 100) {
    throw new InvalidEvaluatorConfigError(
      `RSI thresholds must lie within [0, 100], received oversold=${oversold}, overbought=${overbought}`,
    );
  }
  if (oversold >= overbought) {
    throw new InvalidEvaluatorConfigError(
      `RSI oversold (${oversold}) must be less than overbought (${overbought})`,
    );
  }
}
