import type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from '../signal-engine/evaluators/strategy-evaluator';
import type { SignalType } from '../signal-engine/domain/signal-result';
import {
  BOLLINGER_BANDS_INDICATOR_ID,
  IndicatorRegistry,
  type BollingerBandsInput,
  type BollingerBandsResult,
} from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';
import { readNumberParameter, readPeriodParameter, round4 } from './evaluator-parameters';

export const BOLLINGER_STRATEGY_EVALUATOR_ID = 'bollinger';

export const DEFAULT_BOLLINGER_PERIOD = 20;
export const DEFAULT_BOLLINGER_MULTIPLIER = 2;

/**
 * Bollinger Bands Strategy Evaluator (US014).
 * Delegates the mathematics to the 'bollinger' indicator (US013) and decides
 * on the latest completed bands against the latest close:
 *
 *   Close <= Lower Band → BUY
 *   Close >= Upper Band → SELL
 *   otherwise           → HOLD
 *
 * On a zero-width band (flat window) the BUY branch wins deterministically.
 * Confidence reuses the US012 relative-distance mechanism: how far the close
 * penetrated beyond the touched band, relative to the close price, clamped
 * to [0, 1] and rounded to 4 decimals. HOLD and a close sitting exactly on a
 * band score 0.
 */
export class BollingerStrategyEvaluator implements StrategyEvaluator {
  readonly id = BOLLINGER_STRATEGY_EVALUATOR_ID;

  constructor(private readonly indicators: IndicatorRegistry) {}

  async evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation> {
    const parameters = context.strategy.parameters;
    const period = readPeriodParameter(parameters, 'period', DEFAULT_BOLLINGER_PERIOD);
    const multiplier = readNumberParameter(parameters, 'multiplier', DEFAULT_BOLLINGER_MULTIPLIER);
    if (multiplier <= 0) {
      throw new InvalidEvaluatorConfigError(
        `Bollinger multiplier must be a positive number, received: ${multiplier}`,
      );
    }

    // The indicator fails fast on insufficient candles (needs period) and on
    // non-finite closes (US011/US013 validation).
    const indicator = this.indicators.resolve<BollingerBandsInput, BollingerBandsResult>(
      BOLLINGER_BANDS_INDICATOR_ID,
    );
    const result = indicator.calculate({ series: context.candles, period, multiplier });

    const last = result.middle.length - 1;
    const upperBand = result.upper[last];
    const middleBand = result.middle[last];
    const lowerBand = result.lower[last];
    const close = context.candles[context.candles.length - 1].close;

    let signal: SignalType = 'HOLD';
    let confidence = 0;
    if (close <= lowerBand) {
      signal = 'BUY';
      confidence = close === 0 ? 0 : round4(Math.min(1, (lowerBand - close) / Math.abs(close)));
    } else if (close >= upperBand) {
      signal = 'SELL';
      confidence = close === 0 ? 0 : round4(Math.min(1, (close - upperBand) / Math.abs(close)));
    }

    return Object.freeze({
      signal,
      confidence,
      metadata: Object.freeze({
        evaluator: this.id,
        indicator: BOLLINGER_BANDS_INDICATOR_ID,
        period,
        multiplier,
        upperBand,
        middleBand,
        lowerBand,
        close,
        candlesEvaluated: context.candles.length,
        calculatedLength: result.metadata.calculatedLength,
      }),
    });
  }
}
