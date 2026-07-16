import { describe, expect, it } from 'vitest';
import { runBacktest, DEFAULT_BACKTEST_CONFIG } from './backtest/engine';
import { calculateEma } from './indicators/ema';
import { hashBars } from './hash';
import { resolveStrategy, runExperiment } from './index';
import { DONCHIAN_STRATEGY, DONCHIAN_STRATEGY_ID } from './strategies/donchian-breakout';
import {
  DEFAULT_EMA_CROSSOVER_PARAMS,
  latestEmaCrossoverSignal,
  STRATEGY_ID,
} from './strategies/ema-crossover';
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
    const result = runBacktest(
      bars,
      resolveStrategy(STRATEGY_ID),
      DEFAULT_EMA_CROSSOVER_PARAMS,
      DEFAULT_BACKTEST_CONFIG,
    );
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.metrics.finalEquity).toBeGreaterThan(0);
  });

  it('preserves EMA backtest results through registry dispatch', () => {
    const result = runBacktest(
      makeTrendBars(120),
      resolveStrategy(STRATEGY_ID),
      DEFAULT_EMA_CROSSOVER_PARAMS,
      DEFAULT_BACKTEST_CONFIG,
    );

    expect(result.metrics).toMatchObject({
      tradeCount: 1,
      totalReturn: 5823.09033744322,
      totalReturnPercent: 58.230903374432195,
      profitFactor: 999,
      maxDrawdownPercent: 0.9404388714733604,
      expectancy: 5823.09033744322,
      finalEquity: 15823.09033744322,
    });
    expect(result.metrics.expectancy).toBe(result.metrics.totalReturn);
  });

  it('resolves EMA and Donchian through the registry', () => {
    expect(resolveStrategy(STRATEGY_ID).id).toBe(STRATEGY_ID);
    expect(resolveStrategy(DONCHIAN_STRATEGY_ID).id).toBe(DONCHIAN_STRATEGY_ID);
    expect(() => resolveStrategy('unknown-strategy')).toThrow('Unsupported strategy');
  });

  it('generates Donchian breakout and breakdown signals', () => {
    const bars: OhlcvBar[] = [
      { timestamp: 1, open: 9, high: 10, low: 8, close: 9, volume: 1 },
      { timestamp: 2, open: 10, high: 11, low: 9, close: 10, volume: 1 },
      { timestamp: 3, open: 11, high: 12, low: 10, close: 11, volume: 1 },
      { timestamp: 4, open: 13, high: 14, low: 11, close: 13, volume: 1 },
      { timestamp: 5, open: 8, high: 9, low: 7, close: 8, volume: 1 },
    ];

    const signals = DONCHIAN_STRATEGY.signals(bars, { channelPeriod: 3 });

    expect(signals).toEqual([
      { timestamp: 4, signal: 'buy' },
      { timestamp: 5, signal: 'sell' },
    ]);
  });

  it('normalizes and validates Donchian parameters', () => {
    expect(DONCHIAN_STRATEGY.normalizeParams({ channelPeriod: 30 })).toEqual({
      channelPeriod: 30,
    });
    expect(() => DONCHIAN_STRATEGY.normalizeParams({ channelPeriod: 1 })).toThrow(
      'channelPeriod must be an integer greater than or equal to 2',
    );
  });

  it('runs full experiment pipeline', () => {
    const report = runExperiment(makeTrendBars(200));
    expect(['pass', 'fail', 'needs_review']).toContain(report.validation.verdict);
    expect(report.datasetBarCount).toBe(200);
  });

  it('evaluates latest EMA signal', () => {
    const latest = latestEmaCrossoverSignal(makeTrendBars(120), DEFAULT_EMA_CROSSOVER_PARAMS);
    expect(['buy', 'sell', 'hold']).toContain(latest.signal);
  });
});
