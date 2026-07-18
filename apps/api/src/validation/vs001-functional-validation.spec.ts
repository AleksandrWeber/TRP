/**
 * VS001 — Functional Validation of the Research & Simulation pipeline.
 * Validation only: no product features. Asserts coverage + determinism.
 */
import { describe, expect, it } from 'vitest';
import { BacktestEngine } from '../modules/backtesting/backtest-engine';
import type { BacktestResult } from '../modules/backtesting/backtest-result';
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
import { MarketDataSource } from '../modules/market-data-provider/market-data-source';
import { ProviderRegistry } from '../modules/market-data-provider/provider-registry';
import { PerformanceAnalyzer } from '../modules/performance/performance-analyzer';
import type { PortfolioSnapshot } from '../modules/portfolio/portfolio-snapshot';
import { PortfolioEngine } from '../modules/portfolio/portfolio-engine';
import { SimulationReportBuilder } from '../modules/simulation-report/simulation-report.builder';
import { StrategyComparisonService } from '../modules/strategy-comparison/strategy-comparison.service';
import { TradeEngine } from '../modules/trade/trade-engine';
import { TradeSide } from '../modules/trade/trade-side';
import { TradeStatus } from '../modules/trade/trade-status';
import { toWalkForwardSessionId } from '../modules/walk-forward/walk-forward-session-id';
import { WalkForwardEngine } from '../modules/walk-forward/walk-forward-engine';
import { buildWalkForwardWindows } from '../modules/walk-forward/walk-forward-window-builder';

const WS = 'ws-vs001';
const WS_OTHER = 'ws-other';
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

describe('VS001 — Functional Validation (Research & Simulation pipeline)', () => {
  describe('1. Historical Import', () => {
    it('imports valid CSV and enforces duplicates, ordering, OHLC, workspace isolation', () => {
      const marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
      const importer = new CsvImporter(marketData);

      const ok = importer.import({
        workspaceId: WS,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        file: CSV,
      });
      expect(ok.importedBars).toBe(10);
      expect(ok.skippedBars).toBe(0);
      expect(ok.duplicateBars).toBe(0);
      expect(ok.validationErrors).toEqual([]);

      const duplicates = importer.import({
        workspaceId: WS,
        instrument: 'ETHUSDT',
        timeframe: Timeframe.H1,
        file: [
          HEADER,
          '2026-07-01T00:00:00.000Z,1,2,1,1.5,1',
          '2026-07-01T00:00:00.000Z,1,2,1,1.6,1',
          '2026-07-01T01:00:00.000Z,1.5,2.5,1.4,2,1',
        ].join('\n'),
      });
      expect(duplicates.importedBars).toBe(2);
      expect(duplicates.duplicateBars).toBe(1);
      expect(duplicates.skippedBars).toBe(1);

      const ordering = importer.import({
        workspaceId: WS,
        instrument: 'SOLUSDT',
        timeframe: Timeframe.H1,
        file: [
          HEADER,
          '2026-07-01T02:00:00.000Z,1,2,1,1.5,1',
          '2026-07-01T01:00:00.000Z,1,2,1,1.5,1',
          '2026-07-01T03:00:00.000Z,1,2,1,1.5,1',
        ].join('\n'),
      });
      expect(ordering.importedBars).toBe(2);
      expect(ordering.skippedBars).toBe(1);
      expect(ordering.validationErrors[0]?.field).toBe('timestamp');

      const ohlc = importer.import({
        workspaceId: WS,
        instrument: 'XRPUSDT',
        timeframe: Timeframe.H1,
        file: `${HEADER}\n2026-07-01T00:00:00.000Z,100,90,95,105,1`,
      });
      expect(ohlc.importedBars).toBe(0);
      expect(ohlc.validationErrors[0]?.field).toBe('high');

      expect(
        marketData.getRange({
          workspaceId: WS_OTHER,
          instrument: INSTRUMENT,
          timeframe: Timeframe.H1,
          from: '2026-07-01T00:00:00.000Z',
          to: '2026-07-01T23:59:59.000Z',
        }),
      ).toHaveLength(0);
      expect(
        marketData.getRange({
          workspaceId: WS,
          instrument: INSTRUMENT,
          timeframe: Timeframe.H1,
          from: '2026-07-01T00:00:00.000Z',
          to: '2026-07-01T23:59:59.000Z',
        }),
      ).toHaveLength(10);
    });
  });

  describe('2. Market Data', () => {
    it('keeps bars isolated from external mutation and preserves instrument/timeframe', () => {
      const marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
      const [bar] = marketData.saveBars([
        {
          id: 'bar-fixed-1',
          workspaceId: WS,
          instrument: INSTRUMENT,
          timeframe: Timeframe.H1,
          timestamp: '2026-07-01T00:00:00.000Z',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 10,
        },
      ]);

      const loaded = marketData.getBar(bar.id, WS)!;
      loaded.close = 999;
      const reloaded = marketData.getBar(bar.id, WS)!;
      expect(reloaded.close).toBe(105);
      expect(reloaded.instrument).toBe(toInstrument(INSTRUMENT));
      expect(reloaded.timeframe).toBe(Timeframe.H1);

      const range = marketData.getRange({
        workspaceId: WS,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-01T00:00:00.000Z',
      });
      expect(range).toHaveLength(1);
      expect(range[0]?.id).toBe('bar-fixed-1');
    });
  });

  describe('3. Provider', () => {
    it('returns deterministic bars for identical requests and isolates workspaces', async () => {
      const marketData = seedMarket(CSV);
      const provider = new LocalRepositoryProvider(marketData);
      const request = {
        workspaceId: WS,
        instrument: INSTRUMENT,
        timeframe: Timeframe.H1,
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-01T09:00:00.000Z',
      };

      const a = await provider.fetchHistorical(request);
      const b = await provider.fetchHistorical(request);
      expect(a.bars.map(stableBar)).toEqual(b.bars.map(stableBar));
      expect(a.source).toBe(MarketDataSource.Local);

      const other = await provider.fetchHistorical({ ...request, workspaceId: WS_OTHER });
      expect(other.bars).toHaveLength(0);
    });
  });

  describe('4–7. Backtesting + Trade + Portfolio + Performance', () => {
    it('executes deterministically for business metrics across repeated runs', async () => {
      const runA = await runBacktestPipeline();
      const runB = await runBacktestPipeline();

      expect(runA.backtest.processedBars).toBe(10);
      expect(runA.backtest.processedBars).toBe(runB.backtest.processedBars);
      expect(runA.backtest.totalTrades).toBe(1);
      expect(runA.backtest.closedTrades).toBe(1);
      expect(runA.backtest.openTrades).toBe(0);

      expect(stableBacktest(runA.backtest)).toEqual(stableBacktest(runB.backtest));
      expect(stablePerformance(runA.backtest.performance)).toEqual(
        stablePerformance(runB.backtest.performance),
      );
      expect(stablePortfolio(runA.portfolio)).toEqual(stablePortfolio(runB.portfolio));
      expect(runA.snapshots.map(stableSnapshot)).toEqual(runB.snapshots.map(stableSnapshot));

      expect(runA.backtest.performance.netProfit).not.toBeUndefined();
      expect(runA.backtest.performance.totalReturnPct).not.toBeUndefined();
      expect(runA.backtest.performance.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(runA.backtest.performance.volatility).toBeGreaterThanOrEqual(0);
      expect(runA.backtest.performance.winRate).toBeGreaterThanOrEqual(0);
      expect(runA.backtest.performance.profitFactor).toBeGreaterThan(0);
      expect(runA.portfolio.cash).toBe(runA.portfolio.equity);
      expect(runA.finalSnapshot.realizedPnL).toBe(runA.backtest.performance.netProfit);
    });
  });

  describe('5. Trade Engine edge cases', () => {
    it('supports buy/sell/close, multiple trades, and rejects invalid ops', () => {
      const portfolio = new PortfolioEngine();
      portfolio.initialize({
        workspaceId: WS,
        initialCapital: 50_000,
        id: 'pf-vs001',
        timestamp: '2026-07-01T00:00:00.000Z',
      });
      const trades = new TradeEngine(portfolio, INSTRUMENT);

      const long = trades.openTrade({
        id: 't-long',
        side: TradeSide.Buy,
        quantity: 1,
        entryPrice: 100,
        entryTimestamp: '2026-07-01T01:00:00.000Z',
      });
      const short = trades.openTrade({
        id: 't-short',
        side: TradeSide.Sell,
        quantity: 1,
        entryPrice: 200,
        entryTimestamp: '2026-07-01T02:00:00.000Z',
      });
      expect(trades.getOpenTrades()).toHaveLength(2);

      trades.closeTrade({
        tradeId: long.id,
        exitPrice: 110,
        exitTimestamp: '2026-07-01T03:00:00.000Z',
      });
      trades.closeTrade({
        tradeId: short.id,
        exitPrice: 180,
        exitTimestamp: '2026-07-01T04:00:00.000Z',
      });

      expect(trades.getOpenTrades()).toHaveLength(0);
      expect(trades.getClosedTrades()).toHaveLength(2);
      expect(trades.getClosedTrades().every((t) => t.status === TradeStatus.Closed)).toBe(true);
      expect(portfolio.snapshot().realizedPnL).toBe(30); // +10 long, +20 short

      expect(() =>
        trades.openTrade({
          side: TradeSide.Buy,
          quantity: 1_000_000,
          entryPrice: 100,
          entryTimestamp: '2026-07-01T05:00:00.000Z',
        }),
      ).toThrow(/insufficient cash/i);
      expect(() =>
        trades.closeTrade({
          tradeId: 'missing',
          exitPrice: 1,
          exitTimestamp: '2026-07-01T05:00:00.000Z',
        }),
      ).toThrow(/not found/i);
    });
  });

  describe('8. Walk Forward', () => {
    it('generates windows, runs train/test backtests, aggregates, and is deterministic', async () => {
      const a = await runWalkForwardPipeline();
      const b = await runWalkForwardPipeline();

      expect(a.totalWindows).toBeGreaterThan(0);
      expect(a.completedWindows).toBe(a.totalWindows);
      expect(a.failedWindows).toBe(0);
      expect(
        a.windowResults.every(
          (w) => w.window.testFrom < w.window.testTo || w.window.testFrom === w.window.testTo,
        ),
      ).toBe(true);
      expect(stableWalkForward(a)).toEqual(stableWalkForward(b));
    });
  });

  describe('9. Strategy Comparison', () => {
    it('produces deterministic rankings and weighted scores', async () => {
      const run = await runBacktestPipeline();
      const wf = await runWalkForwardPipeline();
      const service = new StrategyComparisonService();

      const comparisonA = service.compare([
        { strategyId: 'bt-strategy', result: run.backtest },
        { strategyId: 'wf-strategy', result: wf },
      ]);
      const comparisonB = service.compare([
        { strategyId: 'bt-strategy', result: run.backtest },
        { strategyId: 'wf-strategy', result: wf },
      ]);

      expect(comparisonA.rankings.highestReturn.length).toBe(2);
      expect(comparisonA.overallWinnerStrategyId).toBeTruthy();
      expect(stableComparison(comparisonA)).toEqual(stableComparison(comparisonB));
      expect(Object.isFrozen(comparisonA)).toBe(true);
    });
  });

  describe('10. Simulation Report', () => {
    it('builds an immutable report consistent with source artifacts', async () => {
      const run = await runBacktestPipeline();
      const builder = new SimulationReportBuilder();
      const report = builder.build({
        session: run.session,
        backtest: run.backtest,
        portfolio: run.portfolio,
        snapshots: run.snapshots,
        openTrades: [],
        closedTrades: run.closedTrades,
        comparisonScore: 0.75,
        generatedAt: '2026-07-18T00:00:00.000Z',
      });

      expect(Object.isFrozen(report)).toBe(true);
      expect(report.execution.backtest).toBe(run.backtest);
      expect(report.performance).toBe(run.backtest.performance);
      expect(report.trading.summary.closedTrades).toBe(run.backtest.closedTrades);
      expect(report.portfolio.final.equity).toBe(run.portfolio.equity);
      expect(report.portfolio.snapshotsSummary.endingEquity).toBe(
        run.snapshots[run.snapshots.length - 1]?.equity ?? null,
      );
      expect(report.comparisonScore).toBe(0.75);
    });
  });

  describe('Full pipeline determinism (two identical end-to-end runs)', () => {
    it('produces identical semantic results for identical inputs', async () => {
      const first = await runFullPipeline();
      const second = await runFullPipeline();

      expect(first.semantic).toEqual(second.semantic);

      // Wall-clock / UUID surfaces may differ; report residual fields explicitly.
      const residual = collectResiduals(first.raw, second.raw);
      // Residuals are allowed only for wall-clock timestamps / duration / fetchedAt / random ids.
      for (const path of residual) {
        expect(
          /finishedAt|startedAt|durationMs|fetchedAt|generatedAt|createdAt|timestamp|id$|portfolioId/.test(
            path,
          ),
        ).toBe(true);
      }
    });
  });
});

async function runFullPipeline() {
  const marketData = seedMarket(CSV);
  const provider = new LocalRepositoryProvider(marketData);
  const providers = new ProviderRegistry([provider]);
  const backtests = new BacktestEngine(providers, new PerformanceAnalyzer());
  const walkForward = new WalkForwardEngine(providers, backtests);
  const comparison = new StrategyComparisonService();
  const reportBuilder = new SimulationReportBuilder();

  const session = createSession('vs001-full');
  const portfolio = new PortfolioEngine();
  const trades = new TradeEngine(portfolio, INSTRUMENT);
  const snapshots: PortfolioSnapshot[] = [];

  const backtest = await backtests.run(session, createStrategy(), {
    portfolio,
    trades,
    initialCapital: 10_000,
    snapshotSink: snapshots,
    // fixed portfolio id via pre-init
  });

  // Re-init path already used; portfolio was initialized by engine.
  const wf = await walkForward.run(
    {
      id: toWalkForwardSessionId('wf-vs001'),
      workspaceId: WS,
      strategyId: 'vs001-wf',
      instrument: toInstrument(INSTRUMENT),
      timeframe: Timeframe.H1,
      trainingWindow: 4,
      testingWindow: 2,
      stepSize: 2,
    },
    createStrategy(),
  );

  const compared = comparison.compare([
    { strategyId: 'bt', result: backtest },
    { strategyId: 'wf', result: wf },
  ]);

  const report = reportBuilder.build({
    session,
    backtest,
    portfolio: portfolio.getPortfolio(),
    snapshots,
    openTrades: trades.getOpenTrades(),
    closedTrades: trades.getClosedTrades(),
    walkForward: wf,
    comparisonScore: compared.entries.find((e) => e.strategyId === 'bt')?.weightedScore,
    generatedAt: '2026-07-18T00:00:00.000Z',
  });

  const providerOnce = await provider.fetchHistorical({
    workspaceId: WS,
    instrument: INSTRUMENT,
    timeframe: Timeframe.H1,
    from: '2026-07-01T00:00:00.000Z',
    to: '2026-07-01T09:00:00.000Z',
  });

  const windows = buildWalkForwardWindows(
    marketData.getRange({
      workspaceId: WS,
      instrument: INSTRUMENT,
      timeframe: Timeframe.H1,
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-01T09:00:00.000Z',
    }),
    4,
    2,
    2,
  );

  const raw = {
    bars: providerOnce.bars,
    fetchedAt: providerOnce.fetchedAt,
    backtest,
    wf,
    compared,
    report,
    portfolio: portfolio.getPortfolio(),
    snapshots,
  };

  return {
    raw,
    semantic: {
      bars: providerOnce.bars.map(stableBar),
      windows,
      backtest: stableBacktest(backtest),
      performance: stablePerformance(backtest.performance),
      wf: stableWalkForward(wf),
      compared: stableComparison(compared),
      report: {
        session: report.session,
        trading: report.trading,
        performance: stablePerformance(report.performance),
        snapshotsSummary: report.portfolio.snapshotsSummary,
        portfolio: stablePortfolio(report.portfolio.final),
        comparisonScore: report.comparisonScore,
        walkForward: report.execution.walkForward
          ? stableWalkForward(report.execution.walkForward)
          : undefined,
      },
    },
  };
}

async function runBacktestPipeline() {
  const marketData = seedMarket(CSV);
  const providers = new ProviderRegistry([new LocalRepositoryProvider(marketData)]);
  const engine = new BacktestEngine(providers, new PerformanceAnalyzer());
  const session = createSession('vs001-bt');
  const portfolio = new PortfolioEngine();
  portfolio.initialize({
    workspaceId: WS,
    initialCapital: 10_000,
    id: 'pf-bt-vs001',
    timestamp: '2026-07-01T00:00:00.000Z',
  });
  const trades = new TradeEngine(portfolio, INSTRUMENT);
  const snapshots: PortfolioSnapshot[] = [];

  const backtest = await engine.run(session, createStrategy(), {
    portfolio,
    trades,
    snapshotSink: snapshots,
  });

  return {
    session,
    backtest,
    portfolio: portfolio.getPortfolio(),
    snapshots,
    closedTrades: trades.getClosedTrades(),
    finalSnapshot: portfolio.snapshot('2026-07-01T10:00:00.000Z'),
  };
}

async function runWalkForwardPipeline() {
  const marketData = seedMarket(CSV);
  const providers = new ProviderRegistry([new LocalRepositoryProvider(marketData)]);
  const backtests = new BacktestEngine(providers, new PerformanceAnalyzer());
  const engine = new WalkForwardEngine(providers, backtests);
  return engine.run(
    {
      id: toWalkForwardSessionId('wf-pipe'),
      workspaceId: WS,
      strategyId: 'vs001-wf',
      instrument: toInstrument(INSTRUMENT),
      timeframe: Timeframe.H1,
      trainingWindow: 4,
      testingWindow: 2,
      stepSize: 2,
    },
    createStrategy(),
  );
}

function createStrategy(): Strategy {
  let lastClose = 0;
  let lastTimestamp = '';
  return {
    initialize: () => {
      lastClose = 0;
      lastTimestamp = '';
    },
    onBar: (bar, context) => {
      lastClose = bar.close;
      lastTimestamp = bar.timestamp;
      if (context.trades.getOpenTrades().length === 0) {
        context.trades.openTrade({
          id: 't-vs001',
          side: TradeSide.Buy,
          quantity: 1,
          entryPrice: bar.close,
          entryTimestamp: bar.timestamp,
        });
      }
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

function seedMarket(csv: string): MarketDataDomainService {
  const marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
  new CsvImporter(marketData).import({
    workspaceId: WS,
    instrument: INSTRUMENT,
    timeframe: Timeframe.H1,
    file: csv,
  });
  return marketData;
}

function createSession(strategyId: string): BacktestSession {
  return {
    id: toBacktestSessionId(`bt-${strategyId}`),
    workspaceId: WS,
    strategyId,
    instrument: toInstrument(INSTRUMENT),
    timeframe: Timeframe.H1,
    from: '2026-07-01T00:00:00.000Z',
    to: '2026-07-01T09:00:00.000Z',
    status: BacktestStatus.Created,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

function stableBar(bar: {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  instrument: string;
  timeframe: string;
  workspaceId: string;
}) {
  return {
    workspaceId: bar.workspaceId,
    instrument: bar.instrument,
    timeframe: bar.timeframe,
    timestamp: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  };
}

function stableBacktest(result: BacktestResult) {
  return {
    processedBars: result.processedBars,
    status: result.status,
    totalTrades: result.totalTrades,
    openTrades: result.openTrades,
    closedTrades: result.closedTrades,
    performance: stablePerformance(result.performance),
  };
}

function stablePerformance(performance: BacktestResult['performance']) {
  return {
    netProfit: performance.netProfit,
    totalReturnPct: performance.totalReturnPct,
    cagr: performance.cagr,
    maxDrawdown: performance.maxDrawdown,
    maxDrawdownPct: performance.maxDrawdownPct,
    volatility: performance.volatility,
    totalTrades: performance.totalTrades,
    winningTrades: performance.winningTrades,
    losingTrades: performance.losingTrades,
    winRate: performance.winRate,
    averageWin: performance.averageWin,
    averageLoss: performance.averageLoss,
    profitFactor: performance.profitFactor,
    averageTradeDurationMs: performance.averageTradeDurationMs,
  };
}

function stablePortfolio(portfolio: {
  workspaceId: string;
  initialCapital: number;
  currentCapital: number;
  equity: number;
  cash: number;
  status: string;
}) {
  return {
    workspaceId: portfolio.workspaceId,
    initialCapital: portfolio.initialCapital,
    currentCapital: portfolio.currentCapital,
    equity: portfolio.equity,
    cash: portfolio.cash,
    status: portfolio.status,
  };
}

function stableSnapshot(snapshot: PortfolioSnapshot) {
  return {
    cash: snapshot.cash,
    equity: snapshot.equity,
    unrealizedPnL: snapshot.unrealizedPnL,
    realizedPnL: snapshot.realizedPnL,
  };
}

function stableWalkForward(result: Awaited<ReturnType<typeof runWalkForwardPipeline>>) {
  return {
    totalWindows: result.totalWindows,
    completedWindows: result.completedWindows,
    failedWindows: result.failedWindows,
    totalProcessedBars: result.totalProcessedBars,
    windowResults: result.windowResults.map((item) => ({
      window: item.window,
      result: stableBacktest(item.result),
    })),
  };
}

/** Omits wall-clock durationMs (informational; not used in rankings/scores). */
function stableComparison(comparison: {
  entries: readonly {
    strategyId: string;
    source: string;
    processedBars: number;
    totalTrades: number;
    netProfit: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    cagr: number | null;
    weightedScore: number;
  }[];
  rankings: unknown;
  overallWinnerStrategyId: string | null;
}) {
  return {
    entries: comparison.entries.map((entry) => ({
      strategyId: entry.strategyId,
      source: entry.source,
      processedBars: entry.processedBars,
      totalTrades: entry.totalTrades,
      netProfit: entry.netProfit,
      totalReturn: entry.totalReturn,
      maxDrawdown: entry.maxDrawdown,
      winRate: entry.winRate,
      profitFactor: entry.profitFactor,
      cagr: entry.cagr,
      weightedScore: entry.weightedScore,
    })),
    rankings: comparison.rankings,
    overallWinnerStrategyId: comparison.overallWinnerStrategyId,
  };
}

function collectResiduals(a: unknown, b: unknown, path = ''): string[] {
  if (Object.is(a, b)) return [];
  if (typeof a !== typeof b) return [path || '$'];
  if (a === null || b === null || typeof a !== 'object') {
    return a === b ? [] : [path || '$'];
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length);
    const out: string[] = [];
    for (let i = 0; i < max; i += 1) {
      out.push(...collectResiduals(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  const out: string[] = [];
  for (const key of keys) {
    out.push(...collectResiduals(aObj[key], bObj[key], path ? `${path}.${key}` : key));
  }
  return out;
}
