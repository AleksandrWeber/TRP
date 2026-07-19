import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketDataCacheRegistry } from '../market-data-cache/market-data-cache-registry';
import { resolveMarketDataCacheConfig } from '../market-data-cache/market-data-cache.config';
import { MarketDataCacheService } from '../market-data-cache/market-data-cache.service';
import { Timeframe } from '../market-data-domain';
import type { MarketDataProvider } from '../market-data-domain/ports/market-data-provider';
import { MarketDataProviderRegistry } from '../market-data-domain/ports/market-data-provider-registry';
import { createSignalResult, type SignalType } from '../signal-engine';
import type { SignalEngineService } from '../signal-engine/signal-engine.service';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import { PaperTradingEngine } from './paper-trading.engine';
import { PaperTradingService } from './paper-trading.service';
import { PnLCalculator } from './pnl-calculator';
import { PositionManager } from './position-manager';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

const WORKSPACE_ID = 'ws-1';

describe('PaperTradingService (US010)', () => {
  let signalType: SignalType;
  let tickerPrice: number;
  let tickerCalls: number;
  let strategies: StrategyDomainService;
  let positions: PositionRegistry;
  let history: TradeHistory;
  let service: PaperTradingService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
    signalType = 'BUY';
    tickerPrice = 100;
    tickerCalls = 0;
    strategies = new StrategyDomainService(new InMemoryStrategyRepository());
    positions = new PositionRegistry();
    history = new TradeHistory();

    const provider: MarketDataProvider = {
      id: 'prices',
      getTicker: async (symbol) => {
        tickerCalls += 1;
        return Object.freeze({
          symbol,
          price: tickerPrice,
          timestamp: new Date().toISOString(),
        });
      },
      getCandles: async () => {
        throw new Error('PaperTradingService must not request candles itself');
      },
      health: async () => ({ providerId: 'prices', status: 'ok', detail: '' }),
    };
    const providers = new MarketDataProviderRegistry();
    providers.register(provider);
    const cache = new MarketDataCacheService(
      resolveMarketDataCacheConfig({
        enabled: undefined,
        tickerTtlSeconds: undefined,
        candlesTtlSeconds: undefined,
      }),
      new MarketDataCacheRegistry(),
    );
    const signals = {
      evaluate: async (_workspaceId: string, strategyId: string) =>
        createSignalResult({
          strategyId,
          symbol: 'BTCUSDT',
          timeframe: Timeframe.H1,
          signal: signalType,
          confidence: 1,
          timestamp: new Date().toISOString(),
          metadata: {},
        }),
    } as SignalEngineService;
    const pnl = new PnLCalculator();
    const manager = new PositionManager(positions, history, pnl);

    service = new PaperTradingService(
      strategies,
      signals,
      cache,
      providers,
      new PaperTradingEngine(manager),
      positions,
      history,
      pnl,
    );
  });

  afterEach(() => vi.useRealTimers());

  async function createStrategy() {
    return strategies.create({
      workspaceId: WORKSPACE_ID,
      name: 'Paper',
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
      positionSize: 2,
    });
  }

  it('executes BUY then SELL from SignalResult and cached ticker prices', async () => {
    const strategy = await createStrategy();

    const opened = await service.execute(WORKSPACE_ID, strategy.id);
    expect(opened).toMatchObject({ action: 'OPEN_LONG', price: 100, quantity: 2 });

    signalType = 'SELL';
    tickerPrice = 112.5;
    await vi.advanceTimersByTimeAsync(5_001);
    const closed = await service.execute(WORKSPACE_ID, strategy.id);

    expect(closed).toMatchObject({
      action: 'CLOSE_LONG',
      price: 112.5,
      quantity: 2,
      realizedPnL: 25,
    });
    expect(service.listPositions(WORKSPACE_ID)).toEqual([
      expect.objectContaining({ strategyId: strategy.id, status: 'CLOSED' }),
    ]);
    expect(service.listHistory(WORKSPACE_ID).map((trade) => trade.action)).toEqual([
      'OPEN_LONG',
      'CLOSE_LONG',
    ]);
    expect(tickerCalls).toBe(2);
  });

  it('uses a warm ticker cache instead of making a second provider call', async () => {
    const strategy = await createStrategy();
    await service.execute(WORKSPACE_ID, strategy.id);
    const ignored = await service.execute(WORKSPACE_ID, strategy.id);

    expect(ignored?.action).toBe('IGNORED');
    expect(tickerCalls).toBe(1);
  });

  it('returns null for a missing or foreign-workspace strategy', async () => {
    const strategy = await createStrategy();
    expect(await service.execute(WORKSPACE_ID, 'missing')).toBeNull();
    expect(await service.execute('ws-other', strategy.id)).toBeNull();
    expect(tickerCalls).toBe(0);
  });

  it('marks an open portfolio with the latest cached ticker', async () => {
    const strategy = await createStrategy();
    await service.execute(WORKSPACE_ID, strategy.id);

    tickerPrice = 110;
    await vi.advanceTimersByTimeAsync(5_001);
    const summary = await service.portfolio(WORKSPACE_ID);

    expect(summary).toMatchObject({
      realizedPnL: 0,
      unrealizedPnL: 20,
      totalPnL: 20,
      openPositions: 1,
      closedPositions: 0,
    });
    expect(summary.positions[0]).toMatchObject({ currentPrice: 110, unrealizedPnL: 20 });
  });

  it('does not call a provider for an empty portfolio', async () => {
    expect(await service.portfolio(WORKSPACE_ID)).toMatchObject({
      totalPnL: 0,
      openPositions: 0,
    });
    expect(tickerCalls).toBe(0);
  });
});
