/**
 * VS003 — Consistency & Invariant Validation for the Research & Simulation platform.
 * Validation only: no product features. Asserts mathematical / business invariants.
 */
import { describe, expect, it } from 'vitest';
import { BacktestEngine } from '../modules/backtesting/backtest-engine';
import type { BacktestSession } from '../modules/backtesting/backtest-session';
import { toBacktestSessionId } from '../modules/backtesting/backtest-session-id';
import { BacktestStatus } from '../modules/backtesting/backtest-status';
import type { Strategy } from '../modules/backtesting/strategy';
import { CsvImporter } from '../modules/historical-import/csv.importer';
import { toInstrument } from '../modules/market-data/instrument';
import { MarketDataDomainService } from '../modules/market-data/market-data-domain.service';
import { InMemoryMarketDataRepository } from '../modules/market-data/repositories/in-memory-market-data.repository';
import { Timeframe } from '../modules/market-data/timeframe';
import { LocalRepositoryProvider } from '../modules/market-data-provider/local-repository.provider';
import { ProviderRegistry } from '../modules/market-data-provider/provider-registry';
import { PerformanceAnalyzer } from '../modules/performance/performance-analyzer';
import type { PortfolioSnapshot } from '../modules/portfolio/portfolio-snapshot';
import { PortfolioEngine } from '../modules/portfolio/portfolio-engine';
import { SimulationReportBuilder } from '../modules/simulation-report/simulation-report.builder';
import { StrategyComparisonService } from '../modules/strategy-comparison/strategy-comparison.service';
import type { Trade } from '../modules/trade/trade';
import { TradeEngine } from '../modules/trade/trade-engine';
import { TradeSide } from '../modules/trade/trade-side';
import { TradeStatus } from '../modules/trade/trade-status';
import { toWalkForwardSessionId } from '../modules/walk-forward/walk-forward-session-id';
import { WalkForwardEngine } from '../modules/walk-forward/walk-forward-engine';

const WS_A = 'ws-a';
const WS_B = 'ws-b';
const INSTRUMENT = 'BTCUSDT';
const HEADER = 'timestamp,open,high,low,close,volume';
const CSV = [
  HEADER,
  '2026-07-01T00:00:00.000Z,100,110,95,105,10',
  '2026-07-01T01:00:00.000Z,105,115,100,110,11',
  '2026-07-01T02:00:00.000Z,110,120,105,115,12',
  '2026-07-01T03:00:00.000Z,115,125,110,120,13',
  '2026-07-01T04:00:00.000Z,120,130,115,125,14',
  '2026-07-01T05:00:00.000Z,125,135,120,130,15',
  '2026-07-01T06:00:00.000Z,130,140,125,135,16',
  '2026-07-01T07:00:00.000Z,135,145,130,140,17',
  '2026-07-01T08:00:00.000Z,140,150,135,145,18',
  '2026-07-01T09:00:00.000Z,145,155,140,150,19',
].join('\n');

const WEIGHT_RETURN = 0.4;
const WEIGHT_DRAWDOWN = 0.3;
const WEIGHT_PROFIT_FACTOR = 0.2;
const WEIGHT_WIN_RATE = 0.1;

describe('VS003 — Consistency & Invariant Validation', () => {
  describe('1. Trade ↔ Portfolio', () => {
    it('links every open/close to portfolio state with no orphans', () => {
      const portfolio = new PortfolioEngine();
      portfolio.initialize({
        workspaceId: WS_A,
        initialCapital: 50_000,
        id: 'pf-vs003',
        timestamp: '2026-07-01T00:00:00.000Z',
      });
      const trades = new TradeEngine(portfolio, INSTRUMENT);
      const before = portfolio.snapshot('2026-07-01T00:00:00.000Z');

      const long = trades.openTrade({
        id: 't-long',
        side: TradeSide.Buy,
        quantity: 1,
        entryPrice: 100,
        entryTimestamp: '2026-07-01T01:00:00.000Z',
      });
      expect(long.portfolioId).toBe(portfolio.getPortfolio().id);
      expect(portfolio.getPortfolio().cash).toBe(before.cash - 100);
      expect(trades.getOpenTrades()).toHaveLength(1);
      expect(trades.getClosedTrades()).toHaveLength(0);

      trades.markToMarket(110, '2026-07-01T02:00:00.000Z');
      expect(portfolio.snapshot().unrealizedPnL).toBe(10);
      expect(portfolio.getPortfolio().equity).toBe(50_010);

      const closed = trades.closeTrade({
        tradeId: long.id,
        exitPrice: 110,
        exitTimestamp: '2026-07-01T03:00:00.000Z',
      });
      expect(closed.status).toBe(TradeStatus.Closed);
      expect(trades.getOpenTrades()).toHaveLength(0);
      expect(trades.getClosedTrades()).toHaveLength(1);
      expect(portfolio.snapshot().realizedPnL).toBe(10);
      expect(portfolio.snapshot().unrealizedPnL).toBe(0);

      // Orphan checks: every closed trade belongs to this portfolio; no open leftover.
      for (const trade of trades.getClosedTrades()) {
        expect(trade.portfolioId).toBe(portfolio.getPortfolio().id);
      }
      expect(trades.getOpenTrades()).toEqual([]);
      // Flat portfolio: no open position without a trade.
      expect(portfolio.getPortfolio().cash).toBe(portfolio.getPortfolio().equity);
    });
  });

  describe('2–3. Portfolio accounting & PnL consistency', () => {
    it('holds cash + market value = equity and realized + unrealized = total PnL', async () => {
      const run = await runInstrumentedBacktest();
      const initialCapital = run.portfolio.initialCapital;

      for (const snapshot of run.barSnapshots) {
        const totalPnL = snapshot.equity - initialCapital;
        expect(snapshot.realizedPnL + snapshot.unrealizedPnL).toBeCloseTo(totalPnL, 10);
        expect(snapshot.cash + snapshot.marketValue).toBeCloseTo(snapshot.equity, 10);
      }

      const final = run.finalSnapshot;
      const finalTotalPnL = final.equity - initialCapital;
      expect(final.realizedPnL + final.unrealizedPnL).toBeCloseTo(finalTotalPnL, 10);
      expect(finalTotalPnL).toBeCloseTo(run.backtest.performance.netProfit, 10);
      expect(sumTradePnL(run.closedTrades)).toBeCloseTo(final.realizedPnL, 10);
    });
  });

  describe('4. Performance consistency', () => {
    it('reproduces PerformanceReport from trades, snapshots, and backtest summary', async () => {
      const run = await runInstrumentedBacktest();
      const analyzer = new PerformanceAnalyzer();
      const reproduced = analyzer.analyze({
        backtest: {
          processedBars: run.backtest.processedBars,
          startedAt: run.backtest.startedAt,
          finishedAt: run.backtest.finishedAt,
          durationMs: run.backtest.durationMs,
          totalTrades: run.backtest.totalTrades,
          openTrades: run.backtest.openTrades,
          closedTrades: run.backtest.closedTrades,
        },
        closedTrades: run.closedTrades,
        snapshots: run.snapshots,
        initialCapital: run.portfolio.initialCapital,
      });

      expect(reproduced).toEqual(run.backtest.performance);
      expect(reproduced.totalTrades).toBe(run.closedTrades.length);
      expect(reproduced.totalTrades).toBe(run.backtest.closedTrades);
    });
  });

  describe('5. Simulation Report', () => {
    it('mirrors BacktestResult, PerformanceReport, Portfolio, and trade summary', async () => {
      const run = await runInstrumentedBacktest();
      const report = new SimulationReportBuilder().build({
        session: run.session,
        backtest: run.backtest,
        portfolio: run.portfolio,
        snapshots: run.snapshots,
        openTrades: run.openTrades,
        closedTrades: run.closedTrades,
        generatedAt: '2026-07-18T00:00:00.000Z',
      });

      expect(report.execution.backtest).toBe(run.backtest);
      expect(report.performance).toBe(run.backtest.performance);
      expect(report.portfolio.final.equity).toBe(run.portfolio.equity);
      expect(report.portfolio.final.cash).toBe(run.portfolio.cash);
      expect(report.trading.summary).toEqual({
        totalTrades: run.openTrades.length + run.closedTrades.length,
        openTrades: run.openTrades.length,
        closedTrades: run.closedTrades.length,
      });
      expect(report.portfolio.snapshotsSummary.endingEquity).toBe(
        run.snapshots[run.snapshots.length - 1]?.equity ?? null,
      );
      expect(report.portfolio.snapshotsSummary.count).toBe(run.snapshots.length);
    });
  });

  describe('6. Walk Forward', () => {
    it('aggregates completed windows without missing or duplicated windows', async () => {
      const wf = await runWalkForward();
      const indices = wf.windowResults.map((item) => item.window.index);

      expect(wf.totalWindows).toBe(wf.windowResults.length);
      expect(wf.completedWindows + wf.failedWindows).toBe(wf.totalWindows);
      expect(new Set(indices).size).toBe(indices.length);
      expect([...indices].sort((a, b) => a - b)).toEqual(indices);

      const sumProcessed = wf.windowResults.reduce(
        (sum, item) => sum + item.result.processedBars,
        0,
      );
      expect(wf.totalProcessedBars).toBe(sumProcessed);

      const comparison = new StrategyComparisonService().compare([
        { strategyId: 'wf', result: wf },
      ]);
      const entry = comparison.entries[0]!;
      const windows = wf.windowResults.map((item) => item.result.performance);
      expect(entry.netProfit).toBeCloseTo(
        windows.reduce((sum, item) => sum + item.netProfit, 0),
        10,
      );
      expect(entry.totalReturn).toBeCloseTo(
        windows.reduce((sum, item) => sum + item.totalReturnPct, 0) / windows.length,
        10,
      );
      expect(entry.maxDrawdown).toBe(Math.max(...windows.map((item) => item.maxDrawdown)));
      expect(entry.winRate).toBeCloseTo(
        windows.reduce((sum, item) => sum + item.winRate, 0) / windows.length,
        10,
      );
    });
  });

  describe('7. Strategy Comparison', () => {
    it('ranks by PerformanceReport metrics and reproduces weighted score / winner', async () => {
      const run = await runInstrumentedBacktest();
      const wf = await runWalkForward();
      const service = new StrategyComparisonService();
      const comparison = service.compare([
        { strategyId: 'bt', result: run.backtest },
        { strategyId: 'wf', result: wf },
      ]);
      const again = service.compare([
        { strategyId: 'bt', result: run.backtest },
        { strategyId: 'wf', result: wf },
      ]);

      expect(comparison).toEqual(again);

      const byReturn = [...comparison.entries].sort((a, b) => b.totalReturn - a.totalReturn);
      expect(comparison.rankings.highestReturn).toEqual(byReturn.map((e) => e.strategyId));

      const byDrawdown = [...comparison.entries].sort((a, b) => a.maxDrawdown - b.maxDrawdown);
      expect(comparison.rankings.lowestDrawdown).toEqual(byDrawdown.map((e) => e.strategyId));

      const byWinRate = [...comparison.entries].sort((a, b) => b.winRate - a.winRate);
      expect(comparison.rankings.highestWinRate).toEqual(byWinRate.map((e) => e.strategyId));

      const scores = reproduceWeightedScores(comparison.entries);
      for (const entry of comparison.entries) {
        expect(entry.weightedScore).toBeCloseTo(scores.get(entry.strategyId)!, 12);
      }

      const winner = [...comparison.entries].sort((a, b) => b.weightedScore - a.weightedScore)[0];
      expect(comparison.overallWinnerStrategyId).toBe(winner?.strategyId ?? null);

      const bt = comparison.entries.find((e) => e.strategyId === 'bt')!;
      expect(bt.netProfit).toBe(run.backtest.performance.netProfit);
      expect(bt.totalReturn).toBe(run.backtest.performance.totalReturnPct);
      expect(bt.maxDrawdown).toBe(run.backtest.performance.maxDrawdown);
      expect(bt.winRate).toBe(run.backtest.performance.winRate);
      expect(bt.profitFactor).toBe(run.backtest.performance.profitFactor);
    });
  });

  describe('8. Workspace isolation', () => {
    it('never surfaces Workspace A objects inside Workspace B', () => {
      const marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
      const importer = new CsvImporter(marketData);

      importer.import({
        workspaceId: WS_A,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        file: CSV,
      });
      importer.import({
        workspaceId: WS_B,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        file: [
          HEADER,
          '2026-08-01T00:00:00.000Z,1,2,1,1.5,1',
          '2026-08-01T01:00:00.000Z,1.5,2.5,1.4,2,1',
        ].join('\n'),
      });

      const barsA = marketData.getRange({
        workspaceId: WS_A,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        from: '1970-01-01T00:00:00.000Z',
        to: '9999-12-31T23:59:59.999Z',
      });
      const barsB = marketData.getRange({
        workspaceId: WS_B,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        from: '1970-01-01T00:00:00.000Z',
        to: '9999-12-31T23:59:59.999Z',
      });

      expect(barsA).toHaveLength(10);
      expect(barsB).toHaveLength(2);
      expect(barsA.every((bar) => bar.workspaceId === WS_A)).toBe(true);
      expect(barsB.every((bar) => bar.workspaceId === WS_B)).toBe(true);
      expect(barsA.some((bar) => barsB.some((other) => other.id === bar.id))).toBe(false);

      expect(marketData.getBar(barsA[0]!.id, WS_B)).toBeNull();
      expect(marketData.getBar(barsB[0]!.id, WS_A)).toBeNull();
    });
  });

  describe('9. Object immutability', () => {
    it('rejects mutation of frozen artifacts', async () => {
      const run = await runInstrumentedBacktest();
      const wf = await runWalkForward();
      const comparison = new StrategyComparisonService().compare([
        { strategyId: 'bt', result: run.backtest },
        { strategyId: 'wf', result: wf },
      ]);
      const report = new SimulationReportBuilder().build({
        session: run.session,
        backtest: run.backtest,
        portfolio: run.portfolio,
        snapshots: run.snapshots,
        openTrades: run.openTrades,
        closedTrades: run.closedTrades,
        comparisonScore: comparison.entries[0]?.weightedScore,
        generatedAt: '2026-07-18T00:00:00.000Z',
      });

      expect(Object.isFrozen(run.backtest.performance)).toBe(true);
      expect(Object.isFrozen(comparison)).toBe(true);
      expect(Object.isFrozen(comparison.entries)).toBe(true);
      expect(Object.isFrozen(comparison.entries[0])).toBe(true);
      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.session)).toBe(true);
      expect(Object.isFrozen(report.portfolio.snapshotsSummary)).toBe(true);

      expect(() => {
        (run.backtest.performance as { netProfit: number }).netProfit = 999;
      }).toThrow();
      expect(() => {
        (comparison as { overallWinnerStrategyId: string | null }).overallWinnerStrategyId = 'x';
      }).toThrow();
      expect(() => {
        (report as { generatedAt: string }).generatedAt = 'mutated';
      }).toThrow();

      expect(run.backtest.performance.netProfit).not.toBe(999);
      expect(report.generatedAt).toBe('2026-07-18T00:00:00.000Z');
    });
  });
});

type BarSnapshot = PortfolioSnapshot & { marketValue: number };

async function runInstrumentedBacktest() {
  const marketData = seedMarket(CSV, WS_A);
  const providers = new ProviderRegistry([new LocalRepositoryProvider(marketData)]);
  const engine = new BacktestEngine(providers, new PerformanceAnalyzer());
  const session = createSession('vs003-bt');
  const portfolio = new PortfolioEngine();
  portfolio.initialize({
    workspaceId: WS_A,
    initialCapital: 10_000,
    id: 'pf-vs003-bt',
    timestamp: '2026-07-01T00:00:00.000Z',
  });
  const trades = new TradeEngine(portfolio, INSTRUMENT);
  const snapshots: PortfolioSnapshot[] = [];
  const barSnapshots: BarSnapshot[] = [];

  const strategy = createStrategy((bar, context) => {
    const snap = context.portfolio.snapshot(bar.timestamp);
    barSnapshots.push({
      ...snap,
      marketValue: context.trades.computePositionMarketValue(bar.close),
    });
  });

  const backtest = await engine.run(session, strategy, {
    portfolio,
    trades,
    snapshotSink: snapshots,
  });

  return {
    session,
    backtest,
    portfolio: portfolio.getPortfolio(),
    snapshots,
    barSnapshots,
    openTrades: trades.getOpenTrades(),
    closedTrades: trades.getClosedTrades(),
    finalSnapshot: portfolio.snapshot('2026-07-01T10:00:00.000Z'),
  };
}

async function runWalkForward() {
  const marketData = seedMarket(CSV, WS_A);
  const providers = new ProviderRegistry([new LocalRepositoryProvider(marketData)]);
  const backtests = new BacktestEngine(providers, new PerformanceAnalyzer());
  return new WalkForwardEngine(providers, backtests).run(
    {
      id: toWalkForwardSessionId('wf-vs003'),
      workspaceId: WS_A,
      strategyId: 'vs003-wf',
      instrument: toInstrument(INSTRUMENT),
      timeframe: Timeframe.H1,
      trainingWindow: 4,
      testingWindow: 2,
      stepSize: 2,
    },
    createStrategy(),
  );
}

function createStrategy(
  afterBar?: (
    bar: { close: number; timestamp: string },
    context: { trades: TradeEngine; portfolio: PortfolioEngine },
  ) => void,
): Strategy {
  let lastClose = 0;
  let lastTimestamp = '';
  let opened = false;

  return {
    initialize: () => {
      lastClose = 0;
      lastTimestamp = '';
      opened = false;
    },
    onBar: (bar, context) => {
      lastClose = bar.close;
      lastTimestamp = bar.timestamp;
      if (!opened) {
        context.trades.openTrade({
          id: 't-vs003',
          side: TradeSide.Buy,
          quantity: 1,
          entryPrice: bar.close,
          entryTimestamp: bar.timestamp,
        });
        opened = true;
      }
      // Align with BacktestEngine: mark before measuring bar-level invariants.
      context.trades.markToMarket(bar.close, bar.timestamp);
      afterBar?.(bar, context);
    },
    finalize: (context) => {
      const open = context.trades.getOpenTrades()[0];
      if (open && lastClose > 0 && lastTimestamp !== '') {
        context.trades.closeTrade({
          tradeId: open.id,
          exitPrice: lastClose,
          exitTimestamp: lastTimestamp,
        });
      }
    },
  };
}

function seedMarket(csv: string, workspaceId: string): MarketDataDomainService {
  const marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
  new CsvImporter(marketData).import({
    workspaceId,
    instrument: INSTRUMENT,
    timeframe: Timeframe.H1,
    file: csv,
  });
  return marketData;
}

function createSession(strategyId: string): BacktestSession {
  return {
    id: toBacktestSessionId(`bt-${strategyId}`),
    workspaceId: WS_A,
    strategyId,
    instrument: toInstrument(INSTRUMENT),
    timeframe: Timeframe.H1,
    from: '2026-07-01T00:00:00.000Z',
    to: '2026-07-01T09:00:00.000Z',
    status: BacktestStatus.Created,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

function sumTradePnL(trades: readonly Trade[]): number {
  return trades.reduce((sum, trade) => {
    if (trade.exitPrice === undefined) return sum;
    const pnl =
      trade.side === TradeSide.Buy
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - trade.exitPrice) * trade.quantity;
    return sum + pnl;
  }, 0);
}

function reproduceWeightedScores(
  entries: readonly {
    strategyId: string;
    totalReturn: number;
    maxDrawdown: number;
    profitFactor: number;
    winRate: number;
  }[],
): Map<string, number> {
  const returns = normalizeHigherBetter(entries.map((e) => e.totalReturn));
  const drawdowns = normalizeLowerBetter(entries.map((e) => e.maxDrawdown));
  const profitFactors = normalizeHigherBetter(
    entries.map((e) => finiteProfitFactor(e.profitFactor)),
  );
  const winRates = normalizeHigherBetter(entries.map((e) => e.winRate));
  const scores = new Map<string, number>();
  entries.forEach((entry, index) => {
    scores.set(
      entry.strategyId,
      WEIGHT_RETURN * returns[index]! +
        WEIGHT_DRAWDOWN * drawdowns[index]! +
        WEIGHT_PROFIT_FACTOR * profitFactors[index]! +
        WEIGHT_WIN_RATE * winRates[index]!,
    );
  });
  return scores;
}

function normalizeHigherBetter(values: readonly number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 1);
  return values.map((value) => (value - min) / (max - min));
}

function normalizeLowerBetter(values: readonly number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 1);
  return values.map((value) => 1 - (value - min) / (max - min));
}

function finiteProfitFactor(value: number): number {
  if (!Number.isFinite(value)) {
    return value === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : 0;
  }
  return value;
}
