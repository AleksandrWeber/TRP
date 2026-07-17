import { beforeEach, describe, expect, it } from 'vitest';
import { toInstrument } from '../market-data/instrument';
import type { MarketBar } from '../market-data/market-bar';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import { InMemoryMarketDataRepository } from '../market-data/repositories/in-memory-market-data.repository';
import { Timeframe } from '../market-data/timeframe';
import { LocalRepositoryProvider } from '../market-data-provider/local-repository.provider';
import { ProviderRegistry } from '../market-data-provider/provider-registry';
import { PortfolioEngine } from '../portfolio/portfolio-engine';
import { PortfolioStatus } from '../portfolio/portfolio-status';
import { TradeSide } from '../trade/trade-side';
import { BacktestEngine, DEFAULT_BACKTEST_INITIAL_CAPITAL } from './backtest-engine';
import type { BacktestSession } from './backtest-session';
import { toBacktestSessionId } from './backtest-session-id';
import { BacktestStatus } from './backtest-status';
import type { Strategy } from './strategy';

const WS = 'ws-1';

describe('BacktestEngine (US118)', () => {
  let marketData: MarketDataDomainService;
  let engine: BacktestEngine;

  beforeEach(() => {
    marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
    const local = new LocalRepositoryProvider(marketData);
    engine = new BacktestEngine(new ProviderRegistry([local]));
  });

  it('replays bars sequentially through the strategy', async () => {
    seedBars(marketData, [
      '2026-07-17T10:00:00.000Z',
      '2026-07-17T11:00:00.000Z',
      '2026-07-17T12:00:00.000Z',
    ]);

    const calls: string[] = [];
    const timestamps: string[] = [];
    const strategy: Strategy = {
      initialize: () => {
        calls.push('initialize');
      },
      onBar: (bar) => {
        calls.push('onBar');
        timestamps.push(bar.timestamp);
      },
      finalize: () => {
        calls.push('finalize');
      },
    };

    const session = createSession();
    const result = await engine.run(session, strategy);

    expect(calls).toEqual(['initialize', 'onBar', 'onBar', 'onBar', 'finalize']);
    expect(timestamps).toEqual([
      '2026-07-17T10:00:00.000Z',
      '2026-07-17T11:00:00.000Z',
      '2026-07-17T12:00:00.000Z',
    ]);
    expect(result.processedBars).toBe(3);
    expect(result.status).toBe(BacktestStatus.Completed);
    expect(session.status).toBe(BacktestStatus.Completed);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(Date.parse(result.startedAt))).toBe(false);
    expect(Number.isNaN(Date.parse(result.finishedAt))).toBe(false);
    expect(Object.keys(result).sort()).toEqual([
      'closedTrades',
      'durationMs',
      'finishedAt',
      'openTrades',
      'performance',
      'processedBars',
      'startedAt',
      'status',
      'totalTrades',
    ]);
    expect(result.totalTrades).toBe(0);
    expect(result.openTrades).toBe(0);
    expect(result.closedTrades).toBe(0);
    expect(Object.isFrozen(result.performance)).toBe(true);
    expect(result.performance.totalTrades).toBe(0);
  });

  it('awaits async onBar before processing the next bar', async () => {
    seedBars(marketData, ['2026-07-17T10:00:00.000Z', '2026-07-17T11:00:00.000Z']);

    let inFlight = 0;
    let maxInFlight = 0;
    const order: string[] = [];

    const strategy: Strategy = {
      initialize: async () => {
        order.push('initialize');
      },
      onBar: async (bar) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        order.push(`start:${bar.timestamp}`);
        await Promise.resolve();
        order.push(`end:${bar.timestamp}`);
        inFlight -= 1;
      },
      finalize: async () => {
        order.push('finalize');
      },
    };

    const result = await engine.run(createSession(), strategy);

    expect(maxInFlight).toBe(1);
    expect(order).toEqual([
      'initialize',
      'start:2026-07-17T10:00:00.000Z',
      'end:2026-07-17T10:00:00.000Z',
      'start:2026-07-17T11:00:00.000Z',
      'end:2026-07-17T11:00:00.000Z',
      'finalize',
    ]);
    expect(result.processedBars).toBe(2);
    expect(result.status).toBe(BacktestStatus.Completed);
  });

  it('returns Failed when strategy throws and stops further onBar calls', async () => {
    seedBars(marketData, [
      '2026-07-17T10:00:00.000Z',
      '2026-07-17T11:00:00.000Z',
      '2026-07-17T12:00:00.000Z',
    ]);

    let onBarCount = 0;
    const strategy: Strategy = {
      initialize: () => undefined,
      onBar: () => {
        onBarCount += 1;
        if (onBarCount === 2) throw new Error('strategy boom');
      },
      finalize: () => undefined,
    };

    const session = createSession();
    const result = await engine.run(session, strategy);

    expect(result.status).toBe(BacktestStatus.Failed);
    expect(session.status).toBe(BacktestStatus.Failed);
    expect(result.processedBars).toBe(1);
    expect(onBarCount).toBe(2);
  });

  it('completes with zero processedBars when no historical data exists', async () => {
    const calls: string[] = [];
    const strategy: Strategy = {
      initialize: () => {
        calls.push('initialize');
      },
      onBar: () => {
        calls.push('onBar');
      },
      finalize: () => {
        calls.push('finalize');
      },
    };

    const result = await engine.run(createSession(), strategy);

    expect(calls).toEqual(['initialize', 'finalize']);
    expect(result.processedBars).toBe(0);
    expect(result.status).toBe(BacktestStatus.Completed);
  });

  it('rejects invalid session range before running', async () => {
    const strategy: Strategy = {
      initialize: () => undefined,
      onBar: () => undefined,
      finalize: () => undefined,
    };

    await expect(
      engine.run(
        {
          ...createSession(),
          from: '2026-07-17T12:00:00.000Z',
          to: '2026-07-17T10:00:00.000Z',
        },
        strategy,
      ),
    ).rejects.toThrow(/from/i);
  });

  it('owns one PortfolioEngine per session and closes it after the run (US120)', async () => {
    seedBars(marketData, ['2026-07-17T10:00:00.000Z']);

    const portfolio = new PortfolioEngine();
    const strategy: Strategy = {
      initialize: () => undefined,
      onBar: () => undefined,
      finalize: () => undefined,
    };

    const result = await engine.run(createSession(), strategy, {
      portfolio,
      initialCapital: 25_000,
    });

    expect(result.status).toBe(BacktestStatus.Completed);
    expect(portfolio.getPortfolio()).toMatchObject({
      workspaceId: WS,
      initialCapital: 25_000,
      cash: 25_000,
      equity: 25_000,
      status: PortfolioStatus.Closed,
    });
    expect(portfolio.snapshot().realizedPnL).toBe(0);
    expect(DEFAULT_BACKTEST_INITIAL_CAPITAL).toBe(100_000);
  });

  it('allows Strategy to open/close trades via TradeEngine during onBar (US121)', async () => {
    seedBars(marketData, [
      '2026-07-17T10:00:00.000Z',
      '2026-07-17T11:00:00.000Z',
      '2026-07-17T12:00:00.000Z',
    ]);

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

    const result = await engine.run(createSession(), strategy, { initialCapital: 1_000 });

    expect(result.status).toBe(BacktestStatus.Completed);
    expect(result.totalTrades).toBe(1);
    expect(result.openTrades).toBe(0);
    expect(result.closedTrades).toBe(1);
    expect(result.performance.totalTrades).toBe(1);
    expect(result.performance.winningTrades + result.performance.losingTrades).toBe(1);
  });
});

function createSession(): BacktestSession {
  return {
    id: toBacktestSessionId('bt-1'),
    workspaceId: WS,
    strategyId: 'noop-strategy',
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.H1,
    from: '2026-07-17T00:00:00.000Z',
    to: '2026-07-17T23:59:59.000Z',
    status: BacktestStatus.Created,
    createdAt: '2026-07-17T09:00:00.000Z',
  };
}

function seedBars(marketData: MarketDataDomainService, timestamps: string[]): MarketBar[] {
  return marketData.saveBars(
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
