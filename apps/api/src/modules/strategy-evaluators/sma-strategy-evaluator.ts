import { SMA_INDICATOR_ID } from '../technical-indicators';
import { IndicatorStrategyEvaluator } from './indicator-strategy-evaluator';

export const SMA_STRATEGY_EVALUATOR_ID = 'sma';

/**
 * SMA Strategy Evaluator (US012).
 * Delegates the mathematics to the 'sma' indicator (US011) and decides:
 * latest close > latest SMA(period) → BUY, otherwise SELL. Period comes from
 * strategy.parameters.period (default 20).
 */
export class SmaStrategyEvaluator extends IndicatorStrategyEvaluator {
  readonly id = SMA_STRATEGY_EVALUATOR_ID;
  protected readonly defaultIndicatorId = SMA_INDICATOR_ID;
}
