import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  EvaluationResultEvent,
  EvaluationResultListener,
  EvaluationSchedulerService,
} from '../evaluation-scheduler';
import type { MarketDataCacheService } from '../market-data-cache';
import { Timeframe, type MarketDataProviderRegistry } from '../market-data-domain';
import { createSignalResult, type SignalType } from '../signal-engine';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { ExecutorPortfolioNotFoundError } from './domain/paper-trading-executor.error';
import { ExecutorPortfolioStore } from './executor-portfolio-store';
import { PaperTradingExecutorService } from './paper-trading-executor.service';

const WORKSPACE_ID = 'ws-1';

describe('PaperTradingExecutorService (US016)', () => {
  let strategies: StrategyDomainService;
  let store: ExecutorPortfolioStore;
  let executor: PaperTradingExecutorService;
  let listeners: Set<EvaluationResultListener>;
  let currentPrice: number;
  let tickerShouldFail: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T12:00:00.000Z'));
    listeners = new Set();
    currentPrice = 100;
    tickerShouldFail = false;
    strategies = new StrategyDomainService(new InMemoryStrategyRepository());
    store = new ExecutorPortfolioStore();

    const scheduler = {
      onResult: (listener: EvaluationResultListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    } as unknown as EvaluationSchedulerService;

    const cache = {
      getTicker: async (symbol: string) => {
        if (tickerShouldFail) {
          throw new Error('ticker unavailable');
        }
        return { symbol, price: currentPrice, timestamp: new Date().toISOString() };
      },
    } as unknown as MarketDataCacheService;

    // The provider registry is only reachable through the cache-miss loader,
    // which the cache fake never invokes.
    const providers = {} as MarketDataProviderRegistry;

    executor = new PaperTradingExecutorService(scheduler, strategies, cache, providers, store);
    executor.onModuleInit();
  });

  afterEach(() => {
    executor.onModuleDestroy();
    vi.useRealTimers();
  });

  async function createStrategy(name = 'Alpha', tradingPair = 'BTCUSDT') {
    return strategies.create({
      workspaceId: WORKSPACE_ID,
      name,
      tradingPair,
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 2,
    });
  }

  function event(
    strategyId: string,
    signal: SignalType,
    options: { symbol?: string; timestamp?: string; workspaceId?: string } = {},
  ): EvaluationResultEvent {
    return {
      workspaceId: options.workspaceId ?? WORKSPACE_ID,
      strategyId,
      result: createSignalResult({
        strategyId,
        symbol: options.symbol ?? 'BTCUSDT',
        timeframe: Timeframe.H1,
        signal,
        confidence: 0.5,
        timestamp: options.timestamp ?? new Date().toISOString(),
        metadata: { evaluator: 'test' },
      }),
    };
  }

  it('subscribes on init and executes scheduler-published signals', async () => {
    expect(listeners.size).toBe(1);
    const strategy = await createStrategy();

    const [listener] = listeners;
    await listener(event(strategy.id, 'BUY'));

    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(1);
  });

  it('unsubscribes on destroy', () => {
    executor.onModuleDestroy();
    expect(listeners.size).toBe(0);
  });

  it('BUY opens a virtual position', async () => {
    const strategy = await createStrategy();

    const outcome = await executor.process(event(strategy.id, 'BUY'));

    expect(outcome.status).toBe('OPENED');
    expect(outcome.trade).toMatchObject({
      strategyId: strategy.id,
      symbol: 'BTCUSDT',
      side: 'BUY',
      entryPrice: 100,
      exitPrice: null,
      quantity: 2,
      openTime: '2026-07-19T12:00:00.000Z',
      closeTime: null,
      profitLoss: 0,
      status: 'OPEN',
    });

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.currentPosition?.tradeId).toBe(outcome.trade?.tradeId);
    expect(portfolio.totalTrades).toBe(1);
  });

  it('ignores a second BUY while a position is open', async () => {
    const strategy = await createStrategy();
    await executor.process(event(strategy.id, 'BUY'));

    vi.setSystemTime(new Date('2026-07-19T12:01:00.000Z'));
    const outcome = await executor.process(event(strategy.id, 'BUY'));

    expect(outcome.status).toBe('IGNORED');
    expect(outcome.trade).toBeNull();
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(1);

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.signalStats.ignored).toBe(1);
  });

  it('SELL closes the open position with realized PnL', async () => {
    const strategy = await createStrategy();
    await executor.process(event(strategy.id, 'BUY'));

    currentPrice = 110;
    vi.setSystemTime(new Date('2026-07-19T12:05:00.000Z'));
    const outcome = await executor.process(event(strategy.id, 'SELL'));

    expect(outcome.status).toBe('CLOSED');
    expect(outcome.trade).toMatchObject({
      entryPrice: 100,
      exitPrice: 110,
      quantity: 2,
      closeTime: '2026-07-19T12:05:00.000Z',
      profitLoss: 20,
      status: 'CLOSED',
    });

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.currentPosition).toBeNull();
    expect(portfolio.realizedPnL).toBe(20);
    expect(portfolio.unrealizedPnL).toBe(0);
    expect(portfolio.totalTrades).toBe(1);
    expect(portfolio.wins).toBe(1);
    expect(portfolio.losses).toBe(0);
  });

  it('counts a losing close as a loss', async () => {
    const strategy = await createStrategy();
    await executor.process(event(strategy.id, 'BUY'));

    currentPrice = 90;
    vi.setSystemTime(new Date('2026-07-19T12:05:00.000Z'));
    await executor.process(event(strategy.id, 'SELL'));

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.realizedPnL).toBe(-20);
    expect(portfolio.wins).toBe(0);
    expect(portfolio.losses).toBe(1);
  });

  it('ignores SELL when no position exists', async () => {
    const strategy = await createStrategy();

    const outcome = await executor.process(event(strategy.id, 'SELL'));

    expect(outcome.status).toBe('IGNORED');
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(0);

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.signalStats).toMatchObject({ sell: 1, ignored: 1 });
  });

  it('HOLD records statistics and never creates a trade', async () => {
    const strategy = await createStrategy();

    const outcome = await executor.process(event(strategy.id, 'HOLD'));

    expect(outcome.status).toBe('HELD');
    expect(outcome.trade).toBeNull();
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(0);

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.signalStats.hold).toBe(1);
    expect(portfolio.totalTrades).toBe(0);
  });

  it('never processes the same signal twice (idempotency)', async () => {
    const strategy = await createStrategy();
    const buy = event(strategy.id, 'BUY');

    const first = await executor.process(buy);
    const second = await executor.process(buy);

    expect(first.status).toBe('OPENED');
    expect(second.status).toBe('DUPLICATE');
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(1);

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.signalStats.duplicates).toBe(1);
    expect(portfolio.signalStats.buy).toBe(1);
  });

  it('reports unrealized PnL from the current price while open', async () => {
    const strategy = await createStrategy();
    await executor.process(event(strategy.id, 'BUY'));

    currentPrice = 125;
    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);

    expect(portfolio.unrealizedPnL).toBe(50);
    expect(portfolio.realizedPnL).toBe(0);
  });

  it('keeps multiple strategies isolated', async () => {
    const alpha = await createStrategy('Alpha', 'BTCUSDT');
    const beta = await createStrategy('Beta', 'ETHUSDT');

    await executor.process(event(alpha.id, 'BUY', { symbol: 'BTCUSDT' }));
    vi.setSystemTime(new Date('2026-07-19T12:01:00.000Z'));
    await executor.process(event(beta.id, 'BUY', { symbol: 'ETHUSDT' }));

    // Closing alpha must not touch beta's position.
    currentPrice = 110;
    vi.setSystemTime(new Date('2026-07-19T12:02:00.000Z'));
    await executor.process(event(alpha.id, 'SELL', { symbol: 'BTCUSDT' }));

    const alphaPortfolio = await executor.getPortfolio(WORKSPACE_ID, alpha.id);
    const betaPortfolio = await executor.getPortfolio(WORKSPACE_ID, beta.id);

    expect(alphaPortfolio.currentPosition).toBeNull();
    expect(alphaPortfolio.realizedPnL).toBe(20);
    expect(betaPortfolio.currentPosition?.symbol).toBe('ETHUSDT');
    expect(betaPortfolio.realizedPnL).toBe(0);
    expect(executor.listTrades(WORKSPACE_ID, alpha.id)).toHaveLength(1);
    expect(executor.listTrades(WORKSPACE_ID, beta.id)).toHaveLength(1);
  });

  it('keeps workspaces isolated', async () => {
    const strategy = await createStrategy();
    await executor.process(event(strategy.id, 'BUY'));

    expect(executor.listTrades('ws-other')).toHaveLength(0);
    await expect(executor.getPortfolio('ws-other', strategy.id)).rejects.toBeInstanceOf(
      ExecutorPortfolioNotFoundError,
    );
  });

  it('survives processing failures and keeps executing later signals', async () => {
    const strategy = await createStrategy();

    tickerShouldFail = true;
    const failed = await executor.process(event(strategy.id, 'BUY'));
    expect(failed.status).toBe('FAILED');
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(0);

    tickerShouldFail = false;
    vi.setSystemTime(new Date('2026-07-19T12:01:00.000Z'));
    const recovered = await executor.process(event(strategy.id, 'BUY'));
    expect(recovered.status).toBe('OPENED');

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.signalStats.failures).toBe(1);
  });

  it('ignores BUY for a strategy that no longer exists', async () => {
    const strategy = await createStrategy();
    await strategies.delete(WORKSPACE_ID, strategy.id);

    const outcome = await executor.process(event(strategy.id, 'BUY'));

    expect(outcome.status).toBe('IGNORED');
    expect(executor.listTrades(WORKSPACE_ID)).toHaveLength(0);
  });

  it('preserves complete trade history across cycles', async () => {
    const strategy = await createStrategy();

    for (let cycle = 0; cycle < 3; cycle += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 6, 19, 13, cycle, 0)));
      await executor.process(event(strategy.id, 'BUY'));
      currentPrice += 5;
      vi.setSystemTime(new Date(Date.UTC(2026, 6, 19, 13, cycle, 30)));
      await executor.process(event(strategy.id, 'SELL'));
    }

    const trades = executor.listTrades(WORKSPACE_ID, strategy.id);
    expect(trades).toHaveLength(3);
    expect(trades.every((trade) => trade.status === 'CLOSED')).toBe(true);

    const portfolio = await executor.getPortfolio(WORKSPACE_ID, strategy.id);
    expect(portfolio.totalTrades).toBe(3);
    expect(portfolio.wins).toBe(3);
    expect(portfolio.realizedPnL).toBe(30);
  });

  it('throws PORTFOLIO_NOT_FOUND for an unknown strategy portfolio', async () => {
    await expect(executor.getPortfolio(WORKSPACE_ID, 'missing')).rejects.toBeInstanceOf(
      ExecutorPortfolioNotFoundError,
    );
  });

  it('lists every portfolio in the workspace', async () => {
    const alpha = await createStrategy('Alpha');
    const beta = await createStrategy('Beta', 'ETHUSDT');
    await executor.process(event(alpha.id, 'BUY'));
    vi.setSystemTime(new Date('2026-07-19T12:01:00.000Z'));
    await executor.process(event(beta.id, 'HOLD', { symbol: 'ETHUSDT' }));

    const portfolios = await executor.listPortfolios(WORKSPACE_ID);

    expect(portfolios.map((portfolio) => portfolio.strategyId).sort()).toEqual(
      [alpha.id, beta.id].sort(),
    );
  });
});
