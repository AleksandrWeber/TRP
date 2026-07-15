import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './backtest/engine';
import {
  DEFAULT_EMA_CROSSOVER_PARAMS,
  STRATEGY_ID,
  STRATEGY_VERSION,
} from './strategies/ema-crossover';
import type { ExperimentConfig, ExperimentReport, OhlcvBar } from './types';
import { validateBacktest } from './validation/validator';

export function runExperiment(
  bars: OhlcvBar[],
  config: ExperimentConfig = {
    strategyId: STRATEGY_ID,
    strategyVersion: STRATEGY_VERSION,
    params: DEFAULT_EMA_CROSSOVER_PARAMS,
    backtest: DEFAULT_BACKTEST_CONFIG,
  },
): ExperimentReport {
  const backtest = runBacktest(bars, config.params, config.backtest);
  const validation = validateBacktest(backtest.metrics);

  return {
    strategyId: config.strategyId,
    strategyVersion: config.strategyVersion,
    params: config.params,
    backtest: config.backtest,
    metrics: backtest.metrics,
    validation,
    tradeCount: backtest.trades.length,
    datasetBarCount: bars.length,
    generatedAt: new Date().toISOString(),
  };
}

export * from './types';
export * from './hash';
export * from './indicators/ema';
export * from './strategies/ema-crossover';
export * from './backtest/engine';
export * from './validation/validator';
