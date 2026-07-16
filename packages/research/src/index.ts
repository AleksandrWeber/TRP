import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './backtest/engine';
import { resolveSlice } from './dataset-slice/slice-resolver';
import type { SliceRef } from './dataset-slice/slice.types';
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

/**
 * Run an experiment on full `bars`, or on a Dataset Slice of those bars.
 * Research Engine receives only a plain bar array — it never sees SliceRef.
 */
export function runExperiment(
  bars: OhlcvBar[],
  config: ExperimentConfig = defaultExperimentConfig(),
  sliceRef?: SliceRef,
): ExperimentReport {
  let engineBars = bars;
  let sliceIdentity: string | undefined;

  if (sliceRef) {
    const resolved = resolveSlice({
      datasetId: sliceRef.datasetId,
      startIndex: sliceRef.startIndex,
      endIndex: sliceRef.endIndex,
      role: sliceRef.role,
      bars,
    });
    engineBars = resolved.bars;
    sliceIdentity = resolved.sliceIdentity;
  }

  const strategy = resolveStrategy(config.strategyId);
  const params = strategy.normalizeParams(config.params);
  const backtest = runBacktest(engineBars, strategy, params, config.backtest);
  const validation = validateBacktest(backtest.metrics);

  const report: ExperimentReport = {
    strategyId: strategy.id,
    strategyVersion: strategy.version,
    params,
    backtest: config.backtest,
    metrics: backtest.metrics,
    validation,
    tradeCount: backtest.trades.length,
    datasetBarCount: engineBars.length,
    generatedAt: new Date().toISOString(),
  };

  if (sliceIdentity !== undefined) {
    report.sliceIdentity = sliceIdentity;
  }

  return report;
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
