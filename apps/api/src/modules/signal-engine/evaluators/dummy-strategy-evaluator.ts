import type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from './strategy-evaluator';

export const DUMMY_STRATEGY_EVALUATOR_ID = 'dummy';

/**
 * Deterministic placeholder evaluator (US009).
 * Looks only at the latest cached candle: close > open → BUY, otherwise
 * SELL (a flat candle counts as SELL). No randomness, no clock reads —
 * identical candles always produce the identical evaluation. Real indicator
 * evaluators (MA / RSI / MACD / Bollinger / AI) replace it in later
 * milestones behind the same interface.
 */
export class DummyStrategyEvaluator implements StrategyEvaluator {
  readonly id = DUMMY_STRATEGY_EVALUATOR_ID;

  async evaluate(context: StrategyEvaluationContext): Promise<StrategyEvaluation> {
    const latest = context.candles[context.candles.length - 1];
    const signal = latest.close > latest.open ? 'BUY' : 'SELL';

    // Conviction = candle body as a fraction of the full range: a full-body
    // candle scores 1, a doji scores 0. Pure function of the candle.
    const range = latest.high - latest.low;
    const confidence = range === 0 ? 0 : round4(Math.abs(latest.close - latest.open) / range);

    return Object.freeze({
      signal,
      confidence,
      metadata: Object.freeze({
        evaluator: this.id,
        open: latest.open,
        close: latest.close,
        candleOpenTime: latest.openTime,
        candleCloseTime: latest.closeTime,
        candlesEvaluated: context.candles.length,
      }),
    });
  }
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
