import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './backtest/engine';
import { STRATEGY_ID } from './strategies/ema-crossover';
import { resolveStrategy } from './strategies/registry';
import type { ExperimentConfig, ExperimentReport, OhlcvBar } from './types';
import { validateBacktest } from './validation/validator';

export function defaultExperimentConfig(strategyId = STRATEGY_ID): ExperimentConfig {
  const strategy = resolveStrategy(strategyId);
  return {
    strategyId: strategy.id,
    strategyVersion: strategy.version,
    params: strategy.normalizeParams(strategy.defaultParams),
    backtest: DEFAULT_BACKTEST_CONFIG,
  };
}

export function runExperiment(
  bars: OhlcvBar[],
  config: ExperimentConfig = defaultExperimentConfig(),
): ExperimentReport {
  const strategy = resolveStrategy(config.strategyId);
  const params = strategy.normalizeParams(config.params);
  const backtest = runBacktest(bars, strategy, params, config.backtest);
  const validation = validateBacktest(backtest.metrics);

  return {
    strategyId: strategy.id,
    strategyVersion: strategy.version,
    params,
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
export * from './strategies/donchian-breakout';
export * from './strategies/ema-crossover';
export * from './strategies/registry';
export * from './backtest/engine';
export * from './validation/validator';

export * from './dataset-slice';
