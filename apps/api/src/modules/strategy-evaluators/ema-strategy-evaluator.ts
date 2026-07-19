import { EMA_INDICATOR_ID } from '../technical-indicators';
import { IndicatorStrategyEvaluator } from './indicator-strategy-evaluator';

export const EMA_STRATEGY_EVALUATOR_ID = 'ema';

/**
 * EMA Strategy Evaluator (US012).
 * Delegates the mathematics to the 'ema' indicator (US011) and decides:
 * latest close > latest EMA(period) → BUY, otherwise SELL. Period comes from
 * strategy.parameters.period (default 20).
 */
export class EmaStrategyEvaluator extends IndicatorStrategyEvaluator {
  readonly id = EMA_STRATEGY_EVALUATOR_ID;
  protected readonly defaultIndicatorId = EMA_INDICATOR_ID;
}
