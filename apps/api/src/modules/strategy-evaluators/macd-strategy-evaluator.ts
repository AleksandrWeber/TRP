import type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from '../signal-engine/evaluators/strategy-evaluator';
import type { SignalType } from '../signal-engine/domain/signal-result';
import {
  IndicatorRegistry,
  InsufficientIndicatorInputError,
  MACD_INDICATOR_ID,
  type MacdInput,
  type MacdResult,
} from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';
import { readPeriodParameter, round4 } from './evaluator-parameters';

export const MACD_STRATEGY_EVALUATOR_ID = 'macd';

export const DEFAULT_MACD_FAST_PERIOD = 12;
export const DEFAULT_MACD_SLOW_PERIOD = 26;
export const DEFAULT_MACD_SIGNAL_PERIOD = 9;

/**
 * MACD Strategy Evaluator (US014).
 * Delegates the mathematics to the 'macd' indicator (US013) and decides on
 * a completed-value crossover — the previous completed MACD/Signal pair
 * against the latest completed pair, never intrabar:
 *
 *   MACD crosses above Signal → BUY
 *   MACD crosses below Signal → SELL
 *   otherwise                 → HOLD
 *
 * Confidence reuses the US012 relative-distance mechanism: the gap between
 * the latest MACD and Signal lines relative to the latest close price,
 * clamped to [0, 1] and rounded to 4 decimals. HOLD scores 0.
 */
export class MacdStrategyEvaluator implements StrategyEvaluator {
  readonly id = MACD_STRATEGY_EVALUATOR_ID;

  constructor(private readonly indicators: IndicatorRegistry) {}

  async evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation> {
    const parameters = context.strategy.parameters;
    const fastPeriod = readPeriodParameter(parameters, 'fast', DEFAULT_MACD_FAST_PERIOD);
    const slowPeriod = readPeriodParameter(parameters, 'slow', DEFAULT_MACD_SLOW_PERIOD);
    const signalPeriod = readPeriodParameter(parameters, 'signal', DEFAULT_MACD_SIGNAL_PERIOD);
    if (fastPeriod >= slowPeriod) {
      throw new InvalidEvaluatorConfigError(
        `MACD fast period (${fastPeriod}) must be less than slow period (${slowPeriod})`,
      );
    }

    // The indicator itself needs slowPeriod + signalPeriod − 1 candles for a
    // single value; crossover detection needs one more completed value.
    const requiredCandles = slowPeriod + signalPeriod;
    if (context.candles.length < requiredCandles) {
      throw new InsufficientIndicatorInputError(requiredCandles, context.candles.length);
    }

    const indicator = this.indicators.resolve<MacdInput, MacdResult>(MACD_INDICATOR_ID);
    const result = indicator.calculate({
      series: context.candles,
      fastPeriod,
      slowPeriod,
      signalPeriod,
    });

    const last = result.macd.length - 1;
    const previousMacd = result.macd[last - 1];
    const previousSignalLine = result.signal[last - 1];
    const macd = result.macd[last];
    const signalLine = result.signal[last];
    const histogram = result.histogram[last];
    const close = context.candles[context.candles.length - 1].close;

    const crossedAbove = previousMacd <= previousSignalLine && macd > signalLine;
    const crossedBelow = previousMacd >= previousSignalLine && macd < signalLine;
    const signal: SignalType = crossedAbove ? 'BUY' : crossedBelow ? 'SELL' : 'HOLD';

    const confidence =
      signal === 'HOLD' || close === 0
        ? 0
        : round4(Math.min(1, Math.abs(macd - signalLine) / Math.abs(close)));

    return Object.freeze({
      signal,
      confidence,
      metadata: Object.freeze({
        evaluator: this.id,
        indicator: MACD_INDICATOR_ID,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        macd,
        signalLine,
        histogram,
        previousMacd,
        previousSignalLine,
        close,
        candlesEvaluated: context.candles.length,
        calculatedLength: result.metadata.calculatedLength,
      }),
    });
  }
}
