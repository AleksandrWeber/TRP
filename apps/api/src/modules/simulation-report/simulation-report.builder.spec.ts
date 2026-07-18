import { beforeEach, describe, expect, it } from 'vitest';
import { BacktestEngine } from '../backtesting/backtest-engine';
import type { BacktestSession } from '../backtesting/backtest-session';
import { toBacktestSessionId } from '../backtesting/backtest-session-id';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { Strategy } from '../backtesting/strategy';
import { toInstrument } from '../market-data/instrument';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import { InMemoryMarketDataRepository } from '../market-data/repositories/in-memory-market-data.repository';
import { Timeframe } from '../market-data/timeframe';
import { LocalRepositoryProvider } from '../market-data-provider/local-repository.provider';
import { ProviderRegistry } from '../market-data-provider/provider-registry';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import { PortfolioEngine } from '../portfolio/portfolio-engine';
import { TradeSide } from '../trade/trade-side';
import { TradeEngine } from '../trade/trade-engine';
import { SimulationReportBuilder } from './simulation-report.builder';

const WS = 'ws-1';

describe('SimulationReportBuilder (US124)', () => {
  const builder = new SimulationReportBuilder();
  let marketData: MarketDataDomainService;
  let backtests: BacktestEngine;

  beforeEach(() => {
    marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
    const local = new LocalRepositoryProvider(marketData);
    backtests = new BacktestEngine(new ProviderRegistry([local]));
  });

  it('builds an immutable report from backtest outputs without BacktestEngine report knowledge', async () => {
    seedBars(marketData, [
      '2026-07-17T10:00:00.000Z',
      '2026-07-17T11:00:00.000Z',
      '2026-07-17T12:00:00.000Z',
    ]);

    const portfolio = new PortfolioEngine();
    const trades = new TradeEngine(portfolio, 'BTCUSDT');
    const snapshotSink: PortfolioSnapshot[] = [];
    const session = createSession();

    const strategy: Strategy = {
      initialize: () => undefined,
      onBar: (bar, context) => {
        if (bar.timestamp === '2026-07-17T10:00:00.000Z') {
          context.trades.openTrade({
            side: TradeSide.Buy,
            quantity: 1,
            entryPrice: bar.close,
            entryTimestamp: bar.timestamp,
          });
        }
        if (bar.timestamp === '2026-07-17T12:00:00.000Z') {
          const open = context.trades.getOpenTrades()[0];
          if (open) {
            context.trades.closeTrade({
              tradeId: open.id,
              exitPrice: bar.close,
              exitTimestamp: bar.timestamp,
            });
          }
        }
      },
      finalize: () => undefined,
    };

    const backtest = await backtests.run(session, strategy, {
      portfolio,
      trades,
      initialCapital: 10_000,
      snapshotSink,
    });

    const report = builder.build({
      session,
      backtest,
      portfolio: portfolio.getPortfolio(),
      snapshots: snapshotSink,
      openTrades: trades.getOpenTrades(),
      closedTrades: trades.getClosedTrades(),
      comparisonScore: 0.82,
      generatedAt: '2026-07-17T13:00:00.000Z',
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.session)).toBe(true);
    expect(Object.isFrozen(report.portfolio.snapshotsSummary)).toBe(true);
    expect(report.session).toEqual({
      strategyId: 'sim-strategy',
      workspaceId: WS,
      instrument: toInstrument('BTCUSDT'),
      timeframe: Timeframe.H1,
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-17T23:59:59.000Z',
    });
    expect(report.execution.backtest).toBe(backtest);
    expect(report.execution.walkForward).toBeUndefined();
    expect(report.portfolio.final.status).toBe('Closed');
    expect(report.portfolio.snapshotsSummary.count).toBeGreaterThanOrEqual(2);
    expect(report.portfolio.snapshotsSummary.startingEquity).toBe(10_000);
    expect(report.trading.summary).toEqual({
      totalTrades: 1,
      openTrades: 0,
      closedTrades: 1,
    });
    expect(report.performance).toBe(backtest.performance);
    expect(report.comparisonScore).toBe(0.82);
    expect(report.generatedAt).toBe('2026-07-17T13:00:00.000Z');
  });

  it('rejects empty session fields and non-finite comparisonScore', () => {
    const portfolio = new PortfolioEngine();
    portfolio.initialize({ workspaceId: WS, initialCapital: 1_000 });
    const backtest = {
      processedBars: 0,
      startedAt: '2026-07-17T10:00:00.000Z',
      finishedAt: '2026-07-17T10:00:00.000Z',
      durationMs: 0,
      status: BacktestStatus.Completed,
      totalTrades: 0,
      openTrades: 0,
      closedTrades: 0,
      performance: Object.freeze({
        netProfit: 0,
        totalReturnPct: 0,
        cagr: null,
        maxDrawdown: 0,
        maxDrawdownPct: 0,
        volatility: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        averageTradeDurationMs: 0,
      }),
    };

    expect(() =>
      builder.build({
        session: {
          strategyId: '  ',
          workspaceId: WS,
          instrument: toInstrument('BTCUSDT'),
          timeframe: Timeframe.H1,
          from: '2026-07-17T00:00:00.000Z',
          to: '2026-07-17T23:59:59.000Z',
        },
        backtest,
        portfolio: portfolio.getPortfolio(),
        snapshots: [],
        openTrades: [],
        closedTrades: [],
      }),
    ).toThrow(/strategyId/);

    expect(() =>
      builder.build({
        session: createSession(),
        backtest,
        portfolio: portfolio.getPortfolio(),
        snapshots: [],
        openTrades: [],
        closedTrades: [],
        comparisonScore: Number.NaN,
      }),
    ).toThrow(/comparisonScore/);
  });

  it('summarizes snapshot sets larger than the JavaScript argument limit', () => {
    const portfolio = new PortfolioEngine();
    portfolio.initialize({ workspaceId: WS, initialCapital: 1_000 });
    const snapshots: PortfolioSnapshot[] = Array.from({ length: 150_000 }, (_, index) => ({
      timestamp: new Date(Date.UTC(2026, 0, 1) + index * 60_000).toISOString(),
      cash: 1_000,
      equity: 1_000 + (index % 3) - 1,
      unrealizedPnL: 0,
      realizedPnL: 0,
    }));

    const report = builder.build({
      session: createSession(),
      backtest: {
        processedBars: snapshots.length,
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: '2026-04-15T03:59:00.000Z',
        durationMs: 0,
        status: BacktestStatus.Completed,
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        performance: Object.freeze({
          netProfit: 0,
          totalReturnPct: 0,
          cagr: 0,
          maxDrawdown: 0,
          maxDrawdownPct: 0,
          volatility: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          averageWin: 0,
          averageLoss: 0,
          profitFactor: 0,
          averageTradeDurationMs: 0,
        }),
      },
      portfolio: portfolio.getPortfolio(),
      snapshots,
      openTrades: [],
      closedTrades: [],
    });

    expect(report.portfolio.snapshotsSummary).toMatchObject({
      count: 150_000,
      peakEquity: 1_001,
      troughEquity: 999,
    });
  });
});

function createSession(): BacktestSession {
  return {
    id: toBacktestSessionId('bt-sim-1'),
    workspaceId: WS,
    strategyId: 'sim-strategy',
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.H1,
    from: '2026-07-17T00:00:00.000Z',
    to: '2026-07-17T23:59:59.000Z',
    status: BacktestStatus.Created,
    createdAt: '2026-07-17T09:00:00.000Z',
  };
}

function seedBars(marketData: MarketDataDomainService, timestamps: string[]): void {
  marketData.saveBars(
    timestamps.map((timestamp, index) => ({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      timestamp,
      open: 100 + index,
      high: 110 + index,
      low: 95 + index,
      close: 105 + index,
      volume: 1,
    })),
  );
}
