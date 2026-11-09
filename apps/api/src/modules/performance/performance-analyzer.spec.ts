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
    expect(report.sharpeRatio).toEqual(expect.any(Number));
    expect(Number.isFinite(report.sharpeRatio)).toBe(true);
    expect(report.sortinoRatio).toEqual(expect.any(Number));
    expect(Number.isFinite(report.sortinoRatio)).toBe(true);
    expect(report.calmarRatio).toEqual(expect.any(Number));
    expect(Number.isFinite(report.calmarRatio)).toBe(true);
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
    expect(report.sharpeRatio).toBeNull();
    expect(report.sortinoRatio).toBeNull();
    expect(report.calmarRatio).toBeNull();
    expect(report.winRate).toBe(0);
    expect(report.profitFactor).toBe(0);
    expect(report.averageTradeDurationMs).toBe(0);
  });
});

describe('research risk-adjusted metrics (TD-029)', () => {
  const analyzer = new PerformanceAnalyzer();
  const yearStart = '2026-01-01T00:00:00.000Z';
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  const yearEnd = new Date(Date.parse(yearStart) + yearMs).toISOString();
  const yearMid = new Date(Date.parse(yearStart) + yearMs / 2).toISOString();

  it('uses chronological adjacent simple returns and does not mutate the input', () => {
    const snapshots = [point(yearEnd, 112.5), point(yearStart, 100), point(yearMid, 150)];
    const timestamps = snapshots.map((snapshot) => snapshot.timestamp);
    const equities = snapshots.map((snapshot) => snapshot.equity);

    const report = analyze(analyzer, snapshots);

    expect(snapshots.map((snapshot) => snapshot.timestamp)).toEqual(timestamps);
    expect(snapshots.map((snapshot) => snapshot.equity)).toEqual(equities);
    expect(report.netProfit).toBe(12.5);
    expect(report.totalReturnPct).toBe(12.5);
    expect(report.cagr).toBeCloseTo(0.125);
    expect(report.maxDrawdown).toBe(37.5);
    expect(report.maxDrawdownPct).toBe(25);
    // Sample SD (n - 1), risk-free rate 0, not annualized.
    // Population SD would produce 1/3. sqrt(252) scaling would be far from this value.
    expect(report.sharpeRatio).toBeCloseTo(0.23570226039551587);
    // Downside RMS over both observations, not only the negative one (that would be 0.5).
    expect(report.sortinoRatio).toBeCloseTo(0.7071067811865475);
    // 0.125 / 0.25. Currency drawdown 37.5 or percent 25 would not produce 0.5.
    expect(report.calmarRatio).toBeCloseTo(0.5);
  });

  it('returns the same ratios when the same curve is analyzed twice', () => {
    const snapshots = [point(yearStart, 100), point(yearMid, 150), point(yearEnd, 112.5)];
    const first = analyze(analyzer, snapshots);
    const second = analyze(analyzer, snapshots);
    expect(second).toEqual(first);
  });

  it('skips non-positive prior equity and non-finite observations', () => {
    const skipped = analyze(analyzer, [
      point(yearStart, 0),
      point(yearMid, 100),
      point(yearEnd, 110),
    ]);
    expect(skipped.sharpeRatio).toBeNull();
    expect(skipped.sortinoRatio).toBeNull();
    expect(skipped.sharpeRatio).not.toBe(0);

    const negativePrior = analyze(analyzer, [
      point(yearStart, -100),
      point(yearMid, 50),
      point(yearEnd, 40),
    ]);
    expect(negativePrior.sharpeRatio).toBeNull();
    // The negative prior is omitted. The remaining 50 → 40 return is one downside observation.
    expect(negativePrior.sortinoRatio).toBeCloseTo(-1);

    const nonFinite = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, Number.NaN),
      point(yearEnd, Number.POSITIVE_INFINITY),
    ]);
    expect(nonFinite.sharpeRatio).toBeNull();
    expect(nonFinite.sortinoRatio).toBeNull();
    expect(nonFinite.calmarRatio).toBeNull();
    expect(Number.isNaN(nonFinite.maxDrawdown)).toBe(false);

    const overflowReturn = analyze(analyzer, [
      point(yearStart, Number.MIN_VALUE),
      point(yearEnd, 1),
    ]);
    expect(overflowReturn.sharpeRatio).toBeNull();
    expect(overflowReturn.sortinoRatio).toBeNull();
    expect(overflowReturn.calmarRatio).toBeNull();
  });

  it('treats a duplicate final snapshot as one extra zero return', () => {
    const snapshots = [
      point(yearStart, 100),
      point(yearMid, 150),
      point(yearEnd, 112.5),
      point(yearEnd, 112.5),
    ];

    const report = analyze(analyzer, snapshots);

    expect(report.sharpeRatio).toBeCloseTo(0.2182178902359924);
    expect(report.sortinoRatio).toBeCloseTo(0.5773502691896257);
    expect(report.calmarRatio).toBeCloseTo(0.5);
    expect(Number.isFinite(report.volatility)).toBe(true);
  });

  it('returns null Sharpe for one return, zero variance, and empty history', () => {
    const oneReturn = analyze(analyzer, [point(yearStart, 100), point(yearEnd, 80)]);
    expect(oneReturn.sharpeRatio).toBeNull();
    expect(oneReturn.sortinoRatio).toBeCloseTo(-1);

    const flatReturns = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 110),
      point(yearEnd, 121),
    ]);
    expect(flatReturns.sharpeRatio).toBeNull();
    expect(flatReturns.sortinoRatio).toBeNull();
    expect(flatReturns.cagr).toBeCloseTo(0.21);
    expect(flatReturns.calmarRatio).toBeNull();

    const empty = analyze(analyzer, []);
    expect(empty.sharpeRatio).toBeNull();
    expect(empty.sortinoRatio).toBeNull();
    expect(empty.calmarRatio).toBeNull();
    expect(empty.netProfit).toBe(0);

    const single = analyze(analyzer, [point(yearStart, 100)]);
    expect(single.sharpeRatio).toBeNull();
    expect(single.sortinoRatio).toBeNull();
    expect(single.calmarRatio).toBeNull();
    expect(single.maxDrawdown).toBe(0);
  });

  it('computes Sortino from every valid return and nulls a sample with no downside', () => {
    const mixed = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 150),
      point(yearEnd, 112.5),
    ]);
    expect(mixed.sortinoRatio).toBeCloseTo(0.7071067811865475);

    const onlyLosses = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 90),
      point(yearEnd, 81),
    ]);
    expect(onlyLosses.sharpeRatio).toBeNull();
    expect(onlyLosses.sortinoRatio).toBeCloseTo(-1);
    expect(onlyLosses.cagr).toBeCloseTo(-0.19);
    expect(onlyLosses.calmarRatio).toBeCloseTo(-1);

    const noDownside = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 110),
      point(yearEnd, 132),
    ]);
    expect(noDownside.sharpeRatio).toBeCloseTo(2.1213203435596424);
    expect(noDownside.sortinoRatio).toBeNull();
  });

  it('divides CAGR by the largest fractional drawdown, not currency or percent', () => {
    const report = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 40),
      point(new Date(Date.parse(yearStart) + (yearMs * 3) / 4).toISOString(), 1000),
      point(yearEnd, 700),
    ]);

    expect(report.cagr).toBeCloseTo(6);
    expect(report.maxDrawdown).toBe(300);
    expect(report.maxDrawdownPct).toBe(30);
    expect(report.calmarRatio).toBeCloseTo(10);
    expect(report.calmarRatio).not.toBeCloseTo(6 / 300);
    expect(report.calmarRatio).not.toBeCloseTo(6 / 0.3);
  });

  it('returns null Calmar when CAGR is unavailable or drawdown is zero', () => {
    const sameTimestamp = analyze(analyzer, [point(yearStart, 100), point(yearStart, 40)]);
    expect(sameTimestamp.sharpeRatio).toBeNull();
    expect(sameTimestamp.sortinoRatio).toBeCloseTo(-1);
    expect(sameTimestamp.maxDrawdown).toBe(60);
    expect(analyze(analyzer, [point(yearStart, 100), point(yearStart, 40)])).toEqual(sameTimestamp);

    const wipedOut = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 40),
      point(yearEnd, 0),
    ]);
    expect(wipedOut.cagr).toBeNull();
    expect(wipedOut.maxDrawdown).toBe(100);
    expect(wipedOut.calmarRatio).toBeNull();

    const recovered = analyze(analyzer, [
      point(yearStart, 100),
      point(yearMid, 80),
      point(yearEnd, 100),
    ]);
    expect(recovered.cagr).toBe(0);
    expect(recovered.maxDrawdown).toBe(20);
    expect(recovered.calmarRatio).toBeNull();
  });
});

function analyze(
  analyzer: PerformanceAnalyzer,
  snapshots: PortfolioSnapshot[],
): ReturnType<PerformanceAnalyzer['analyze']> {
  return analyzer.analyze({
    backtest: {
      processedBars: snapshots.length,
      startedAt: '2026-01-01T00:00:00.000Z',
      finishedAt: '2027-01-01T00:00:00.000Z',
      durationMs: 365 * 24 * 60 * 60 * 1000,
      totalTrades: 0,
      openTrades: 0,
      closedTrades: 0,
    },
    closedTrades: [],
    snapshots,
    initialCapital: 100,
  });
}

function point(timestamp: string, equity: number): PortfolioSnapshot {
  return {
    timestamp,
    cash: equity,
    equity,
    unrealizedPnL: 0,
    realizedPnL: 0,
  };
}

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
