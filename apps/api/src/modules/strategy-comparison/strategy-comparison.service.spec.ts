import { describe, expect, it } from 'vitest';
import type { BacktestResult } from '../backtesting/backtest-result';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { PerformanceReport } from '../performance/performance-report';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';
import { StrategyComparisonService } from './strategy-comparison.service';

describe('StrategyComparisonService (US123)', () => {
  const service = new StrategyComparisonService();

  it('ranks strategies and picks a weighted overall winner', () => {
    const comparison = service.compare([
      {
        strategyId: 'high-return',
        result: backtest({
          totalReturnPct: 40,
          maxDrawdown: 20,
          winRate: 0.4,
          profitFactor: 1.2,
          netProfit: 4000,
        }),
      },
      {
        strategyId: 'low-dd',
        result: backtest({
          totalReturnPct: 15,
          maxDrawdown: 2,
          winRate: 0.55,
          profitFactor: 1.5,
          netProfit: 1500,
        }),
      },
      {
        strategyId: 'balanced',
        result: backtest({
          totalReturnPct: 30,
          maxDrawdown: 8,
          winRate: 0.6,
          profitFactor: 2.5,
          netProfit: 3000,
        }),
      },
    ]);

    expect(Object.isFrozen(comparison)).toBe(true);
    expect(Object.isFrozen(comparison.entries)).toBe(true);
    expect(Object.isFrozen(comparison.rankings)).toBe(true);
    expect(comparison.entries).toHaveLength(3);

    expect(comparison.rankings.highestReturn[0]).toBe('high-return');
    expect(comparison.rankings.lowestDrawdown[0]).toBe('low-dd');
    expect(comparison.rankings.bestProfitFactor[0]).toBe('balanced');
    expect(comparison.rankings.highestWinRate[0]).toBe('balanced');

    expect(comparison.overallWinnerStrategyId).toBeTruthy();
    const winner = comparison.entries.find(
      (entry) => entry.strategyId === comparison.overallWinnerStrategyId,
    );
    expect(winner?.weightedScore).toBeGreaterThan(0);

    const scores = comparison.entries.map((entry) => entry.weightedScore);
    const maxScore = Math.max(...scores);
    expect(winner?.weightedScore).toBe(maxScore);

    expect(comparison.entries[0]).toMatchObject({
      strategyId: expect.any(String),
      source: 'backtest',
      processedBars: expect.any(Number),
      totalTrades: expect.any(Number),
      netProfit: expect.any(Number),
      totalReturn: expect.any(Number),
      maxDrawdown: expect.any(Number),
      winRate: expect.any(Number),
      profitFactor: expect.any(Number),
      durationMs: expect.any(Number),
      weightedScore: expect.any(Number),
    });
  });

  it('aggregates WalkForwardResult windows into one entry', () => {
    const comparison = service.compare([
      {
        strategyId: 'wf-a',
        result: walkForward([
          backtest({
            totalReturnPct: 10,
            maxDrawdown: 5,
            winRate: 0.5,
            profitFactor: 1.5,
            netProfit: 100,
            processedBars: 10,
            totalTrades: 2,
          }),
          backtest({
            totalReturnPct: 20,
            maxDrawdown: 8,
            winRate: 0.7,
            profitFactor: 2.5,
            netProfit: 200,
            processedBars: 12,
            totalTrades: 3,
          }),
        ]),
      },
      {
        strategyId: 'bt-b',
        result: backtest({
          totalReturnPct: 5,
          maxDrawdown: 1,
          winRate: 0.9,
          profitFactor: 3,
          netProfit: 50,
        }),
      },
    ]);

    const wf = comparison.entries.find((entry) => entry.strategyId === 'wf-a');
    expect(wf?.source).toBe('walk-forward');
    expect(wf?.processedBars).toBe(22);
    expect(wf?.totalTrades).toBe(5);
    expect(wf?.netProfit).toBe(300);
    expect(wf?.totalReturn).toBe(15);
    expect(wf?.maxDrawdown).toBe(8);
    expect(wf?.winRate).toBeCloseTo(0.6);
    expect(wf?.profitFactor).toBe(2);
  });

  it('returns empty immutable comparison for empty input', () => {
    const comparison = service.compare([]);
    expect(comparison.entries).toEqual([]);
    expect(comparison.overallWinnerStrategyId).toBeNull();
    expect(Object.isFrozen(comparison)).toBe(true);
  });

  it('rejects duplicate strategy ids', () => {
    expect(() =>
      service.compare([
        { strategyId: 'a', result: backtest({}) },
        { strategyId: 'a', result: backtest({}) },
      ]),
    ).toThrow(/Duplicate strategyId/);
  });
});

function backtest(
  overrides: Partial<{
    totalReturnPct: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    netProfit: number;
    processedBars: number;
    totalTrades: number;
    cagr: number | null;
    durationMs: number;
  }> = {},
): BacktestResult {
  const performance: PerformanceReport = Object.freeze({
    netProfit: overrides.netProfit ?? 1000,
    totalReturnPct: overrides.totalReturnPct ?? 10,
    cagr: overrides.cagr === undefined ? 0.1 : overrides.cagr,
    maxDrawdown: overrides.maxDrawdown ?? 5,
    maxDrawdownPct: 5,
    volatility: 0.01,
    totalTrades: overrides.totalTrades ?? 10,
    winningTrades: 6,
    losingTrades: 4,
    winRate: overrides.winRate ?? 0.5,
    averageWin: 100,
    averageLoss: 50,
    profitFactor: overrides.profitFactor ?? 1.5,
    averageTradeDurationMs: 1000,
  });

  return {
    processedBars: overrides.processedBars ?? 100,
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-02T00:00:00.000Z',
    durationMs: overrides.durationMs ?? 86_400_000,
    status: BacktestStatus.Completed,
    totalTrades: overrides.totalTrades ?? 10,
    openTrades: 0,
    closedTrades: overrides.totalTrades ?? 10,
    performance,
  };
}

function walkForward(windowBacktests: BacktestResult[]): WalkForwardResult {
  return {
    totalWindows: windowBacktests.length,
    completedWindows: windowBacktests.length,
    failedWindows: 0,
    totalProcessedBars: windowBacktests.reduce((sum, item) => sum + item.processedBars, 0),
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-03T00:00:00.000Z',
    durationMs: 172_800_000,
    windowResults: windowBacktests.map((result, index) => ({
      window: {
        index,
        trainFrom: 't0',
        trainTo: 't1',
        testFrom: 't2',
        testTo: 't3',
      },
      result,
    })),
  };
}
