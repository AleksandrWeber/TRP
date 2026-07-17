import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMarketDataRepository } from '../market-data/repositories/in-memory-market-data.repository';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import { Timeframe } from '../market-data/timeframe';
import type { HistoricalDataResponse } from './historical-data-response';
import type { MarketDataProvider } from './market-data-provider';
import { MarketDataSource } from './market-data-source';
import { LocalRepositoryProvider } from './local-repository.provider';
import { ProviderRegistry } from './provider-registry';

const WS = 'ws-1';

describe('ProviderRegistry / LocalRepositoryProvider (US117)', () => {
  let marketData: MarketDataDomainService;
  let local: LocalRepositoryProvider;
  let registry: ProviderRegistry;

  beforeEach(() => {
    marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
    local = new LocalRepositoryProvider(marketData);
    registry = new ProviderRegistry([local]);
  });

  it('LocalRepositoryProvider supports only local source', () => {
    expect(local.supports(MarketDataSource.Local)).toBe(true);
    expect(local.supports(MarketDataSource.Binance)).toBe(false);
    expect(local.supports('bybit')).toBe(false);
  });

  it('fetches historical bars from MarketDataDomainService', async () => {
    marketData.saveBars([
      {
        workspaceId: WS,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1,
      },
      {
        workspaceId: WS,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T11:00:00.000Z',
        open: 105,
        high: 115,
        low: 100,
        close: 110,
        volume: 2,
      },
      {
        workspaceId: WS,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T14:00:00.000Z',
        open: 110,
        high: 120,
        low: 105,
        close: 115,
        volume: 3,
      },
    ]);

    const response = await local.fetchHistorical({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-17T10:00:00.000Z',
      to: '2026-07-17T11:00:00.000Z',
    });

    expect(response.source).toBe(MarketDataSource.Local);
    expect(Number.isNaN(Date.parse(response.fetchedAt))).toBe(false);
    expect(response.bars.map((bar) => bar.close)).toEqual([105, 110]);
  });

  it('registry resolves local provider and fetchHistorical delegates', async () => {
    marketData.saveBars([
      {
        workspaceId: WS,
        instrument: 'ETHUSDT',
        timeframe: Timeframe.M15,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 1,
        high: 2,
        low: 1,
        close: 1.5,
        volume: 10,
      },
    ]);

    expect(registry.resolve(MarketDataSource.Local)).toBe(local);

    const response = await registry.fetchHistorical(MarketDataSource.Local, {
      workspaceId: WS,
      instrument: 'ETHUSDT',
      timeframe: Timeframe.M15,
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-17T23:59:59.000Z',
    });

    expect(response.bars).toHaveLength(1);
    expect(response.source).toBe(MarketDataSource.Local);
  });

  it('registry throws when source has no provider', () => {
    expect(() => registry.resolve(MarketDataSource.Binance)).toThrow(/Binance|binance/i);
  });

  it('allows registering a future provider without Domain changes', async () => {
    const stub: MarketDataProvider = {
      supports: (source) => source === MarketDataSource.Binance,
      fetchHistorical: async (): Promise<HistoricalDataResponse> => ({
        bars: [],
        source: MarketDataSource.Binance,
        fetchedAt: '2026-07-17T12:00:00.000Z',
      }),
    };

    registry.register(stub);

    const response = await registry.fetchHistorical(MarketDataSource.Binance, {
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-17T23:59:59.000Z',
    });

    expect(response.source).toBe(MarketDataSource.Binance);
    expect(response.bars).toEqual([]);
  });

  it('preserves workspace isolation when reading via local provider', async () => {
    marketData.saveBars([
      {
        workspaceId: 'ws-a',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.D1,
        timestamp: '2026-07-17T00:00:00.000Z',
        open: 1,
        high: 2,
        low: 1,
        close: 1.5,
        volume: 1,
      },
    ]);

    const response = await registry.fetchHistorical(MarketDataSource.Local, {
      workspaceId: 'ws-b',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.D1,
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T00:00:00.000Z',
    });

    expect(response.bars).toHaveLength(0);
  });
});
