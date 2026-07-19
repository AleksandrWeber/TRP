import { Inject, Injectable } from '@nestjs/common';
import type { Candle } from '../market-data-domain/domain/candle';
import type { Strategy } from '../strategies';
import { createSignalResult, type SignalResult } from './domain/signal-result';
import type { Timeframe } from '../market-data-domain/domain/timeframe';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';

/** Optional strategy parameter naming the evaluator to run. */
export const EVALUATOR_PARAMETER_KEY = 'evaluator';

/**
 * Executes one evaluation (US009): resolves the evaluator for the strategy,
 * runs it against the candle window, and normalizes the decision into the
 * canonical SignalResult (identity + timestamp). Knows nothing about where
 * the candles come from — that is the engine's job.
 */
@Injectable()
export class StrategyRunner {
  constructor(
    // Explicit token — vitest (esbuild) emits no design:paramtypes metadata.
    @Inject(SignalEvaluatorRegistry) private readonly evaluators: SignalEvaluatorRegistry,
  ) {}

  async run(strategy: Strategy, candles: ReadonlyArray<Candle>): Promise<SignalResult> {
    const evaluator = this.evaluators.resolve(requestedEvaluatorId(strategy));
    const evaluation = await evaluator.evaluate({ strategy, candles });

    return createSignalResult({
      strategyId: strategy.id,
      symbol: strategy.tradingPair,
      // StrategyTimeframe and Timeframe share the same literal values
      // ('1m' … '1d'); createSignalResult re-validates the membership.
      timeframe: strategy.timeframe as Timeframe,
      signal: evaluation.signal,
      confidence: evaluation.confidence,
      timestamp: new Date().toISOString(),
      metadata: evaluation.metadata,
    });
  }
}

function requestedEvaluatorId(strategy: Strategy): string | undefined {
  const requested = strategy.parameters[EVALUATOR_PARAMETER_KEY];
  return typeof requested === 'string' && requested.trim() !== '' ? requested : undefined;
}
