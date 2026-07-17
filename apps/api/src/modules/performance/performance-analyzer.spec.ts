import { describe, expect, it } from 'vitest';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import type { Trade } from '../trade/trade';
import { toTradeId } from '../trade/trade-id';
import { TradeSide } from '../trade/trade-side';
import { TradeStatus } from '../trade/trade-status';
import { toInstrument } from '../market-data/instrument';
import { toPortfolioId } from '../portfolio/portfolio-id';
import { PerformanceAnalyzer } from './performance-analyzer';

describe('PerformanceAnalyzer (US122)', () => {
  const analyzer = new PerformanceAnalyzer();

  it('calculates returns, risk, trade stats, and timing into an immutable report', () => {
    const snapshots: PortfolioSnapshot[] = [
      {
        timestamp: '2026-01-01T00:00:00.000Z',
        cash: 10_000,
        equity: 10_000,
        unrealizedPnL: 0,
        realizedPnL: 0,
      },
      {
        timestamp: '2026-01-02T00:00:00.000Z',
        cash: 9_000,
        equity: 10_500,
        unrealizedPnL: 1_500,
        realizedPnL: 0,
      },
      {
        timestamp: '2026-01-03T00:00:00.000Z',
        cash: 9_000,
        equity: 9_500,
        unrealizedPnL: 500,
        realizedPnL: 0,
      },
      {
        timestamp: '2026-01-04T00:00:00.000Z',
        cash: 11_000,
        equity: 11_000,
        unrealizedPnL: 0,
        realizedPnL: 1_000,
      },
    ];

    const closedTrades: Trade[] = [
      closedTrade({
        id: 't1',
        side: TradeSide.Buy,
        quantity: 1,
        entryPrice: 100,
        exitPrice: 120,
        entryTimestamp: '2026-01-01T00:00:00.000Z',
        exitTimestamp: '2026-01-02T00:00:00.000Z',
      }),
      closedTrade({
        id: 't2',
        side: TradeSide.Buy,
        quantity: 1,
        entryPrice: 100,
        exitPrice: 90,
        entryTimestamp: '2026-01-02T00:00:00.000Z',
        exitTimestamp: '2026-01-03T12:00:00.000Z',
      }),
    ];

    const report = analyzer.analyze({
      backtest: {
        processedBars: 4,
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: '2027-01-01T00:00:00.000Z',
        durationMs: 365 * 24 * 60 * 60 * 1000,
        totalTrades: 2,
        openTrades: 0,
        closedTrades: 2,
      },
      closedTrades,
      snapshots,
      initialCapital: 10_000,
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(report.netProfit).toBe(1_000);
    expect(report.totalReturnPct).toBe(10);
    expect(report.cagr).not.toBeNull();
    expect(report.maxDrawdown).toBe(1_000);
    expect(report.maxDrawdownPct).toBeCloseTo((1000 / 10_500) * 100);
    expect(report.volatility).toBeGreaterThan(0);
    expect(report.totalTrades).toBe(2);
    expect(report.winningTrades).toBe(1);
    expect(report.losingTrades).toBe(1);
    expect(report.winRate).toBe(0.5);
    expect(report.averageWin).toBe(20);
    expect(report.averageLoss).toBe(10);
    expect(report.profitFactor).toBe(2);
    expect(report.averageTradeDurationMs).toBe(
      (Date.parse('2026-01-02T00:00:00.000Z') -
        Date.parse('2026-01-01T00:00:00.000Z') +
        (Date.parse('2026-01-03T12:00:00.000Z') - Date.parse('2026-01-02T00:00:00.000Z'))) /
        2,
    );

    expect(() => {
      (report as { netProfit: number }).netProfit = 0;
    }).toThrow();
  });

  it('handles empty trades and short samples', () => {
    const report = analyzer.analyze({
      backtest: {
        processedBars: 0,
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: '2026-01-01T00:00:00.000Z',
        durationMs: 0,
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
      },
      closedTrades: [],
      snapshots: [
        {
          timestamp: '2026-01-01T00:00:00.000Z',
          cash: 5_000,
          equity: 5_000,
          unrealizedPnL: 0,
          realizedPnL: 0,
        },
      ],
      initialCapital: 5_000,
    });

    expect(report.netProfit).toBe(0);
    expect(report.totalReturnPct).toBe(0);
    expect(report.cagr).toBeNull();
    expect(report.maxDrawdown).toBe(0);
    expect(report.volatility).toBe(0);
    expect(report.winRate).toBe(0);
    expect(report.profitFactor).toBe(0);
    expect(report.averageTradeDurationMs).toBe(0);
  });
});

function closedTrade(input: {
  id: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTimestamp: string;
  exitTimestamp: string;
}): Trade {
  return {
    id: toTradeId(input.id),
    portfolioId: toPortfolioId('pf-1'),
    instrument: toInstrument('BTCUSDT'),
    side: input.side,
    quantity: input.quantity,
    entryPrice: input.entryPrice,
    exitPrice: input.exitPrice,
    entryTimestamp: input.entryTimestamp,
    exitTimestamp: input.exitTimestamp,
    status: TradeStatus.Closed,
  };
}
