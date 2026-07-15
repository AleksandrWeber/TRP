import { describe, expect, it } from 'vitest';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './backtest/engine';
import { calculateEma } from './indicators/ema';
import { hashBars } from './hash';
import { runExperiment } from './index';
import { DEFAULT_EMA_CROSSOVER_PARAMS } from './strategies/ema-crossover';
import type { OhlcvBar } from './types';

function makeTrendBars(count: number): OhlcvBar[] {
  const bars: OhlcvBar[] = [];
  for (let i = 0; i < count; i++) {
    const close = 100 + i * 0.5 + (i % 5 === 0 ? -2 : 0);
    bars.push({
      timestamp: 1_700_000_000_000 + i * 3_600_000,
      open: close - 0.2,
      high: close + 0.5,
      low: close - 0.5,
      close,
      volume: 1000,
    });
  }
  return bars;
}

describe('research package', () => {
  it('calculates EMA deterministically', () => {
    const ema = calculateEma([1, 2, 3, 4, 5], 3);
    expect(ema).toHaveLength(5);
    expect(ema[0]).toBe(1);
  });

  it('hashes bars consistently', () => {
    const bars = makeTrendBars(10);
    expect(hashBars(bars)).toBe(hashBars(bars));
  });

  it('runs backtest on synthetic data', () => {
    const bars = makeTrendBars(120);
    const result = runBacktest(bars, DEFAULT_EMA_CROSSOVER_PARAMS, DEFAULT_BACKTEST_CONFIG);
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.metrics.finalEquity).toBeGreaterThan(0);
  });

  it('runs full experiment pipeline', () => {
    const report = runExperiment(makeTrendBars(200));
    expect(['pass', 'fail', 'needs_review']).toContain(report.validation.verdict);
    expect(report.datasetBarCount).toBe(200);
  });
});
