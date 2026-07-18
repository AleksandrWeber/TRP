import { Injectable } from '@nestjs/common';
import { MarketDataSource } from '../market-data-provider/market-data-source';
import { ProviderRegistry } from '../market-data-provider/provider-registry';
import { PerformanceAnalyzer } from '../performance/performance-analyzer';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import { PortfolioEngine } from '../portfolio/portfolio-engine';
import { PortfolioStatus } from '../portfolio/portfolio-status';
import { TradeEngine } from '../trade/trade-engine';
import type { BacktestResult } from './backtest-result';
import type { BacktestSession } from './backtest-session';
import { BacktestStatus } from './backtest-status';
import type { Strategy, StrategyContext } from './strategy';

/** Default simulated capital when a session does not specify one (US120). */
export const DEFAULT_BACKTEST_INITIAL_CAPITAL = 100_000;

/**
 * Optional run configuration (US120 / US121).
 * PortfolioEngine / TradeEngine are created per session when not supplied.
 */
export type BacktestRunOptions = {
  initialCapital?: number;
  /** Optional pre-built portfolio engine owned for this session. */
  portfolio?: PortfolioEngine;
  /** Optional pre-built trade engine; otherwise one is created for the session instrument. */
  trades?: TradeEngine;
  /**
   * Optional caller-owned sink. Engine appends equity snapshots during the run.
   * Used by SimulationReportBuilder — BacktestEngine does not know report internals (US124).
   */
  snapshotSink?: PortfolioSnapshot[];
};

/**
 * Core historical backtesting engine (US118–US122 / US124 sink).
 * Loads bars via ProviderRegistry, replays them sequentially through a Strategy.
 * Owns one PortfolioEngine + TradeEngine per session; attaches PerformanceReport.
 * Optional snapshotSink mirrors equity snapshots for SimulationReportBuilder (no report imports).
 * No paper trading / live trading / REST / Prisma / Pipeline.
 */
@Injectable()
export class BacktestEngine {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly performance: PerformanceAnalyzer = new PerformanceAnalyzer(),
  ) {}

  async run(
    session: BacktestSession,
    strategy: Strategy,
    options: BacktestRunOptions = {},
  ): Promise<BacktestResult> {
    this.assertSession(session);

    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();
    session.status = BacktestStatus.Running;

    // Equity-curve timestamps must be session/bar-aligned (not wall-clock) so
    // performance metrics such as CAGR are deterministic across repeated runs.
    const curveStart = session.from;

    const portfolio = options.portfolio ?? new PortfolioEngine();
    if (!portfolio.isInitialized()) {
      portfolio.initialize({
        workspaceId: session.workspaceId,
        initialCapital: options.initialCapital ?? DEFAULT_BACKTEST_INITIAL_CAPITAL,
        timestamp: curveStart,
      });
    }

    const initialCapital = portfolio.getPortfolio().initialCapital;
    const trades = options.trades ?? new TradeEngine(portfolio, session.instrument);
    const context: StrategyContext = { trades, portfolio };
    const snapshots: PortfolioSnapshot[] = [portfolio.snapshot(curveStart)];
    mirrorSnapshots(options.snapshotSink, snapshots);

    let processedBars = 0;
    let lastBarTimestamp: string | undefined;

    try {
      const { bars } = await this.providers.fetchHistorical(MarketDataSource.Local, {
        workspaceId: session.workspaceId,
        instrument: session.instrument,
        timeframe: session.timeframe,
        from: session.from,
        to: session.to,
      });

      // Provider returns ascending timestamps; sort defensively for sequential replay.
      const ordered = [...bars].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      await strategy.initialize(context);

      for (const bar of ordered) {
        await strategy.onBar(bar, context);
        trades.markToMarket(bar.close, bar.timestamp);
        const barSnapshot = portfolio.snapshot(bar.timestamp);
        snapshots.push(barSnapshot);
        appendSnapshot(options.snapshotSink, barSnapshot);
        lastBarTimestamp = bar.timestamp;
        processedBars += 1;
      }

      await strategy.finalize(context);

      const curveEnd = lastBarTimestamp ?? session.to;
      const finalSnapshot = portfolio.snapshot(curveEnd);
      snapshots.push(finalSnapshot);
      appendSnapshot(options.snapshotSink, finalSnapshot);
      portfolio.close(curveEnd);
      session.status = BacktestStatus.Completed;
      return this.toResult({
        processedBars,
        startedAt,
        startedAtMs,
        status: BacktestStatus.Completed,
        trades,
        snapshots,
        initialCapital,
      });
    } catch {
      const curveEnd = lastBarTimestamp ?? session.to;
      const finalSnapshot = portfolio.snapshot(curveEnd);
      snapshots.push(finalSnapshot);
      appendSnapshot(options.snapshotSink, finalSnapshot);
      if (portfolio.isInitialized() && portfolio.getPortfolio().status === PortfolioStatus.Active) {
        try {
          portfolio.close(curveEnd);
        } catch {
          // ignore close errors during failure path
        }
      }
      session.status = BacktestStatus.Failed;
      return this.toResult({
        processedBars,
        startedAt,
        startedAtMs,
        status: BacktestStatus.Failed,
        trades,
        snapshots,
        initialCapital,
      });
    }
  }

  private toResult(args: {
    processedBars: number;
    startedAt: string;
    startedAtMs: number;
    status: BacktestStatus;
    trades: TradeEngine;
    snapshots: PortfolioSnapshot[];
    initialCapital: number;
  }): BacktestResult {
    const finishedAtMs = Date.now();
    const finishedAt = new Date(finishedAtMs).toISOString();
    const openTrades = args.trades.getOpenTrades().length;
    const closedTradeCount = args.trades.getClosedTrades().length;
    const base = {
      processedBars: args.processedBars,
      startedAt: args.startedAt,
      finishedAt,
      durationMs: finishedAtMs - args.startedAtMs,
      status: args.status,
      totalTrades: openTrades + closedTradeCount,
      openTrades,
      closedTrades: closedTradeCount,
    };

    const performance = this.performance.analyze({
      backtest: base,
      closedTrades: args.trades.getClosedTrades(),
      snapshots: args.snapshots,
      initialCapital: args.initialCapital,
    });

    return {
      ...base,
      performance,
    };
  }

  private assertSession(session: BacktestSession): void {
    assertNonEmpty(session.workspaceId, 'workspaceId');
    assertNonEmpty(session.strategyId, 'strategyId');
    assertNonEmpty(String(session.instrument), 'instrument');
    assertNonEmpty(session.from, 'from');
    assertNonEmpty(session.to, 'to');
    if (session.from > session.to) {
      throw new Error('from must be less than or equal to to');
    }
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function appendSnapshot(sink: PortfolioSnapshot[] | undefined, snapshot: PortfolioSnapshot): void {
  sink?.push(snapshot);
}

function mirrorSnapshots(
  sink: PortfolioSnapshot[] | undefined,
  snapshots: readonly PortfolioSnapshot[],
): void {
  if (!sink) return;
  for (const snapshot of snapshots) {
    sink.push(snapshot);
  }
}
