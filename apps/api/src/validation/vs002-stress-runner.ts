import { cpus, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
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
import { ProviderRegistry } from '../modules/market-data-provider/provider-registry';
import {
  PerformanceAnalyzer,
  type PerformanceAnalyzerInput,
} from '../modules/performance/performance-analyzer';
import type { PerformanceReport } from '../modules/performance/performance-report';
import type { PortfolioSnapshot } from '../modules/portfolio/portfolio-snapshot';
import { PortfolioEngine } from '../modules/portfolio/portfolio-engine';
import { SimulationReportBuilder } from '../modules/simulation-report/simulation-report.builder';
import { TradeEngine } from '../modules/trade/trade-engine';
import { TradeSide } from '../modules/trade/trade-side';
import { toWalkForwardSessionId } from '../modules/walk-forward/walk-forward-session-id';
import { WalkForwardEngine } from '../modules/walk-forward/walk-forward-engine';

const HEADER = 'timestamp,open,high,low,close,volume';
const WORKSPACE = 'vs002-workspace';
const INSTRUMENT = toInstrument('BTCUSDT');
const START_MS = Date.parse('2020-01-01T00:00:00.000Z');
const BAR_MS = 60_000;
const TRADE_INTERVAL = 1_000;

type MemoryPoint = {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  maxRssMb: number;
};

type StageMetric = {
  durationMs: number;
  cpuPercent: number;
  cpuUserMs: number;
  cpuSystemMs: number;
  memoryBefore: MemoryPoint;
  memoryAfter: MemoryPoint;
};

type ScenarioResult = {
  stages: Record<string, StageMetric>;
  importedBars: number;
  replayedBars: number;
  processedBars: number;
  tradesExecuted: number;
  snapshotCount: number;
  walkForwardWindows: number;
  walkForwardProcessedBars: number;
  performanceAnalysisCalls: number;
  performanceAnalysisDurationMs: number;
  semantic: unknown;
  memory: {
    start: MemoryPoint;
    end: MemoryPoint;
    postGc: MemoryPoint;
  };
};

class TimedPerformanceAnalyzer extends PerformanceAnalyzer {
  calls = 0;
  durationMs = 0;

  override analyze(input: PerformanceAnalyzerInput): PerformanceReport {
    const started = performance.now();
    try {
      return super.analyze(input);
    } finally {
      this.calls += 1;
      this.durationMs += performance.now() - started;
    }
  }
}

async function main(): Promise<void> {
  const barCount = parsePositiveInt(process.argv[2], 'barCount');
  const strategyCount = parsePositiveInt(process.argv[3], 'strategyCount');
  const runs: ScenarioResult[] = [];

  for (let run = 1; run <= 2; run += 1) {
    forceGc();
    runs.push(await runScenario(barCount, strategyCount, run));
    forceGc();
  }

  const deterministic = JSON.stringify(runs[0]!.semantic) === JSON.stringify(runs[1]!.semantic);
  const result = {
    environment: {
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      cpuModel: cpus()[0]?.model ?? 'unknown',
      logicalCpus: cpus().length,
      totalMemoryGb: round(totalmem() / 1024 ** 3),
    },
    workload: { barCount, strategyCount },
    runs,
    deterministic,
    postGcGrowth: {
      rssMb: round(runs[1]!.memory.postGc.rssMb - runs[0]!.memory.postGc.rssMb),
      heapUsedMb: round(runs[1]!.memory.postGc.heapUsedMb - runs[0]!.memory.postGc.heapUsedMb),
    },
  };

  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!deterministic) process.exitCode = 3;
}

async function runScenario(
  barCount: number,
  strategyCount: number,
  runNumber: number,
): Promise<ScenarioResult> {
  const stages: Record<string, StageMetric> = {};
  const memoryStart = memoryPoint();
  const repository = new InMemoryMarketDataRepository();
  const marketData = new MarketDataDomainService(repository);
  const importer = new CsvImporter(marketData);
  let csv = generateCsv(barCount);
  let importedBars = 0;

  const importMeasured = await measure(() => {
    const result = importer.import({
      workspaceId: WORKSPACE,
      instrument: INSTRUMENT,
      timeframe: Timeframe.M1,
      file: csv,
    });
    importedBars = result.importedBars;
    if (result.skippedBars !== 0 || result.validationErrors.length !== 0) {
      throw new Error(`Import rejected ${result.skippedBars} bars`);
    }
  });
  stages.import = importMeasured.metric;
  csv = '';

  const provider = new LocalRepositoryProvider(marketData);
  const providers = new ProviderRegistry([provider]);
  const from = timestampAt(0);
  const to = timestampAt(barCount - 1);
  let replayedBars = 0;

  const providerMeasured = await measure(async () => {
    const response = await provider.fetchHistorical({
      workspaceId: WORKSPACE,
      instrument: INSTRUMENT,
      timeframe: Timeframe.M1,
      from,
      to,
    });
    replayedBars = response.bars.length;
  });
  stages.provider = providerMeasured.metric;

  const analyzer = new TimedPerformanceAnalyzer();
  const backtests = new BacktestEngine(providers, analyzer);
  let processedBars = 0;
  let tradesExecuted = 0;
  let snapshotCount = 0;
  let reportArtifact:
    | {
        session: BacktestSession;
        result: BacktestResult;
        portfolio: PortfolioEngine;
        trades: TradeEngine;
        snapshots: PortfolioSnapshot[];
      }
    | undefined;
  const strategySemantics: unknown[] = [];

  const backtestMeasured = await measure(async () => {
    for (let strategyIndex = 0; strategyIndex < strategyCount; strategyIndex += 1) {
      const session = createSession(strategyIndex, from, to);
      const portfolio = new PortfolioEngine();
      portfolio.initialize({
        id: `portfolio-${strategyIndex}`,
        workspaceId: WORKSPACE,
        initialCapital: 1_000_000,
        timestamp: from,
      });
      const trades = new TradeEngine(portfolio, INSTRUMENT);
      const snapshots: PortfolioSnapshot[] = [];
      const result = await backtests.run(session, createStressStrategy(strategyIndex), {
        portfolio,
        trades,
        snapshotSink: strategyIndex === 0 ? snapshots : undefined,
      });

      if (result.status !== BacktestStatus.Completed) {
        throw new Error(`Backtest ${strategyIndex} returned ${result.status}`);
      }
      processedBars += result.processedBars;
      tradesExecuted += result.totalTrades;
      snapshotCount += result.processedBars + 2;
      strategySemantics.push(stableBacktest(result));

      if (strategyIndex === 0) {
        reportArtifact = { session, result, portfolio, trades, snapshots };
      }
    }
  });
  stages.backtesting = backtestMeasured.metric;

  const trainingWindow = Math.max(2, Math.floor(barCount * 0.2));
  const testingWindow = Math.max(1, Math.floor(barCount * 0.1));
  const stepSize = Math.max(1, Math.floor(barCount * 0.2));
  const walkForward = new WalkForwardEngine(providers, backtests);
  let walkForwardResult: Awaited<ReturnType<WalkForwardEngine['run']>> | undefined;
  const walkForwardMeasured = await measure(async () => {
    walkForwardResult = await walkForward.run(
      {
        id: toWalkForwardSessionId(`vs002-wf-${runNumber}`),
        workspaceId: WORKSPACE,
        strategyId: 'vs002-wf',
        instrument: INSTRUMENT,
        timeframe: Timeframe.M1,
        trainingWindow,
        testingWindow,
        stepSize,
      },
      createStressStrategy(10_000),
    );
    if (walkForwardResult.failedWindows !== 0) {
      throw new Error(`${walkForwardResult.failedWindows} walk-forward windows failed`);
    }
  });
  stages.walkForward = walkForwardMeasured.metric;

  if (!reportArtifact || !walkForwardResult) {
    throw new Error('Missing simulation artifacts');
  }

  const artifact = reportArtifact;
  const wfResult = walkForwardResult;
  const reportBuilder = new SimulationReportBuilder();
  let reportSemantic: unknown;
  const reportMeasured = await measure(() => {
    const report = reportBuilder.build({
      session: artifact.session,
      backtest: artifact.result,
      portfolio: artifact.portfolio.getPortfolio(),
      snapshots: artifact.snapshots,
      openTrades: artifact.trades.getOpenTrades(),
      closedTrades: artifact.trades.getClosedTrades(),
      walkForward: wfResult,
      generatedAt: '2026-07-18T00:00:00.000Z',
    });
    reportSemantic = {
      snapshotSummary: report.portfolio.snapshotsSummary,
      trading: report.trading,
      performance: report.performance,
    };
  });
  stages.simulationReport = reportMeasured.metric;

  const memoryEnd = memoryPoint();
  forceGc();
  const memoryPostGc = memoryPoint();

  return {
    stages,
    importedBars,
    replayedBars,
    processedBars,
    tradesExecuted,
    snapshotCount,
    walkForwardWindows: wfResult.totalWindows,
    walkForwardProcessedBars: wfResult.totalProcessedBars,
    performanceAnalysisCalls: analyzer.calls,
    performanceAnalysisDurationMs: round(analyzer.durationMs),
    semantic: {
      importedBars,
      replayedBars,
      strategySemantics,
      walkForward: {
        totalWindows: wfResult.totalWindows,
        completedWindows: wfResult.completedWindows,
        failedWindows: wfResult.failedWindows,
        totalProcessedBars: wfResult.totalProcessedBars,
        results: wfResult.windowResults.map((item) => stableBacktest(item.result)),
      },
      report: reportSemantic,
    },
    memory: {
      start: memoryStart,
      end: memoryEnd,
      postGc: memoryPostGc,
    },
  };
}

function createStressStrategy(strategyIndex: number): Strategy {
  let index = 0;
  let openTradeId: string | null = null;

  return {
    initialize: () => {
      index = 0;
      openTradeId = null;
    },
    onBar: (bar, context) => {
      if (openTradeId === null && index % TRADE_INTERVAL === 0) {
        openTradeId = `strategy-${strategyIndex}-trade-${index}`;
        context.trades.openTrade({
          id: openTradeId,
          side: TradeSide.Buy,
          quantity: 0.01,
          entryPrice: bar.close,
          entryTimestamp: bar.timestamp,
        });
      } else if (
        openTradeId !== null &&
        index % TRADE_INTERVAL === Math.floor(TRADE_INTERVAL / 2)
      ) {
        context.trades.closeTrade({
          tradeId: openTradeId,
          exitPrice: bar.close,
          exitTimestamp: bar.timestamp,
        });
        openTradeId = null;
      }
      index += 1;
    },
    finalize: (context) => {
      if (openTradeId !== null) {
        const open = context.trades.getOpenTrades()[0];
        if (open) {
          context.trades.closeTrade({
            tradeId: openTradeId,
            exitPrice: open.entryPrice,
            exitTimestamp: open.entryTimestamp,
          });
        }
        openTradeId = null;
      }
    },
  };
}

function createSession(strategyIndex: number, from: string, to: string): BacktestSession {
  return {
    id: toBacktestSessionId(`vs002-backtest-${strategyIndex}`),
    workspaceId: WORKSPACE,
    strategyId: `strategy-${strategyIndex}`,
    instrument: INSTRUMENT,
    timeframe: Timeframe.M1,
    from,
    to,
    status: BacktestStatus.Created,
    createdAt: '2026-07-18T00:00:00.000Z',
  };
}

function stableBacktest(result: BacktestResult): unknown {
  return {
    processedBars: result.processedBars,
    status: result.status,
    totalTrades: result.totalTrades,
    openTrades: result.openTrades,
    closedTrades: result.closedTrades,
    performance: result.performance,
  };
}

function generateCsv(barCount: number): string {
  const lines = new Array<string>(barCount + 1);
  lines[0] = HEADER;
  for (let index = 0; index < barCount; index += 1) {
    const open = 100 + (index % 100);
    const close = open + ((index % 7) - 3) * 0.1;
    const high = Math.max(open, close) + 1;
    const low = Math.min(open, close) - 1;
    lines[index + 1] =
      `${timestampAt(index)},${open},${high},${low},${close},${1_000 + (index % 50)}`;
  }
  return lines.join('\n');
}

function timestampAt(index: number): string {
  return new Date(START_MS + index * BAR_MS).toISOString();
}

async function measure<T>(fn: () => T | Promise<T>): Promise<{ value: T; metric: StageMetric }> {
  const memoryBefore = memoryPoint();
  const cpuBefore = process.cpuUsage();
  const started = performance.now();
  const value = await fn();
  const durationMs = performance.now() - started;
  const cpu = process.cpuUsage(cpuBefore);
  const cpuUserMs = cpu.user / 1_000;
  const cpuSystemMs = cpu.system / 1_000;
  return {
    value,
    metric: {
      durationMs: round(durationMs),
      cpuPercent: durationMs === 0 ? 0 : round(((cpuUserMs + cpuSystemMs) / durationMs) * 100),
      cpuUserMs: round(cpuUserMs),
      cpuSystemMs: round(cpuSystemMs),
      memoryBefore,
      memoryAfter: memoryPoint(),
    },
  };
}

function memoryPoint(): MemoryPoint {
  const memory = process.memoryUsage();
  return {
    rssMb: round(memory.rss / 1024 ** 2),
    heapUsedMb: round(memory.heapUsed / 1024 ** 2),
    heapTotalMb: round(memory.heapTotal / 1024 ** 2),
    externalMb: round(memory.external / 1024 ** 2),
    maxRssMb: round((process.resourceUsage().maxRSS * 1024) / 1024 ** 2),
  };
}

function forceGc(): void {
  global.gc?.();
}

function parsePositiveInt(value: string | undefined, name: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return parsed;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 2;
});
