import { describe, expect, it } from 'vitest';
import { DONCHIAN_STRATEGY } from '../strategies/donchian-breakout';
import { DEFAULT_EMA_CROSSOVER_PARAMS, STRATEGY_ID } from '../strategies/ema-crossover';
import { resolveStrategy } from '../strategies/registry';
import type { OhlcvBar } from '../types';
import { DEFAULT_BACKTEST_CONFIG, runBacktest } from './engine';

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

function makeFlatRoundTripBars(): OhlcvBar[] {
  const price = 100;
  return [0, 1, 2, 3, 4].map((index) => ({
    timestamp: index,
    open: index < 2 ? price - 1 : price,
    high: index < 2 ? price - 1 : price,
    low: index < 2 ? price - 1 : price,
    close: index < 2 ? price - 1 : price,
    volume: 1,
  }));
}

describe('backtest accounting', () => {
  it('reconciles trade PnL with final equity', () => {
    const result = runBacktest(
      makeTrendBars(120),
      resolveStrategy(STRATEGY_ID),
      DEFAULT_EMA_CROSSOVER_PARAMS,
      DEFAULT_BACKTEST_CONFIG,
    );

    const tradePnl = result.trades.reduce((sum, trade) => sum + trade.pnl, 0);
    expect(tradePnl).toBeCloseTo(result.metrics.totalReturn, 8);
    expect(result.metrics.expectancy * result.metrics.tradeCount).toBeCloseTo(
      result.metrics.totalReturn,
      8,
    );
  });

  it('loses only fees and slippage on a flat round trip', () => {
    const config = DEFAULT_BACKTEST_CONFIG;
    const result = runBacktest(
      makeFlatRoundTripBars(),
      DONCHIAN_STRATEGY,
      { channelPeriod: 2 },
      config,
    );

    expect(result.trades).toHaveLength(1);
    const trade = result.trades[0]!;
    const capital = config.initialCapital;
    const entryFee = capital * config.feeRate;
    const entryPrice = 100 * (1 + config.slippageRate);
    const quantity = (capital - entryFee) / entryPrice;
    const exitGross = quantity * (100 * (1 - config.slippageRate));
    const exitFee = exitGross * config.feeRate;
    const expectedPnl = exitGross - exitFee - capital;

    expect(trade.pnl).toBeCloseTo(expectedPnl, 8);
    expect(result.metrics.totalReturn).toBeCloseTo(expectedPnl, 8);
    expect(trade.pnl).toBeLessThan(0);
  });
});
