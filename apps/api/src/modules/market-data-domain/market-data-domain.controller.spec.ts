import { describe, expect, it } from 'vitest';
import { MarketDataCacheRegistry } from '../market-data-cache/market-data-cache-registry';
import { resolveMarketDataCacheConfig } from '../market-data-cache/market-data-cache.config';
import { MarketDataCacheService } from '../market-data-cache/market-data-cache.service';
import { Timeframe } from './domain/timeframe';
import { DEFAULT_CANDLES_LIMIT, MarketDataDomainController } from './market-data-domain.controller';
import { MarketDataProviderRegistry } from './ports/market-data-provider-registry';
import {
  MOCK_SERIES_ANCHOR_ISO,
  MockMarketDataProvider,
} from './providers/mock-market-data-provider';

function buildController(): MarketDataDomainController {
  const registry = new MarketDataProviderRegistry();
  registry.register(new MockMarketDataProvider());
  const cache = new MarketDataCacheService(
    resolveMarketDataCacheConfig({
      enabled: undefined,
      tickerTtlSeconds: undefined,
      candlesTtlSeconds: undefined,
    }),
    new MarketDataCacheRegistry(),
  );
  return new MarketDataDomainController(registry, cache);
}

describe('MarketDataDomainController (US006)', () => {
  const controller = buildController();

  it('reports active provider health with the registry inventory', async () => {
    const health = await controller.health();
    expect(health).toMatchObject({
      providerId: 'mock',
      status: 'ok',
      registeredProviders: ['mock'],
    });
    expect(Number.isFinite(Date.parse(health.checkedAt))).toBe(true);
  });

  it('serves a deterministic ticker through the provider port', async () => {
    const first = await controller.ticker({ symbol: 'BTCUSDT' });
    const second = await controller.ticker({ symbol: 'BTCUSDT' });
    expect(second).toEqual(first);
    expect(first).toMatchObject({ symbol: 'BTCUSDT', timestamp: MOCK_SERIES_ANCHOR_ISO });
  });

  it('serves candles with an explicit limit', async () => {
    const candles = await controller.candles({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      limit: 3,
    });
    expect(candles).toHaveLength(3);
    expect(candles[2]).toMatchObject({
      symbol: 'BTCUSDT',
      timeframe: Timeframe.H1,
      closeTime: MOCK_SERIES_ANCHOR_ISO,
    });
  });

  it('defaults the candle limit when omitted', async () => {
    const candles = await controller.candles({ symbol: 'ETHUSDT', timeframe: '5m' });
    expect(candles).toHaveLength(DEFAULT_CANDLES_LIMIT);
  });
});

describe('MarketDataDomainController cache integration (US008)', () => {
  it('serves the second identical ticker request from the cache', async () => {
    const controller = buildController();

    const first = await controller.ticker({ symbol: 'BTCUSDT' });
    const statsAfterMiss = controller.cacheStats();
    expect(statsAfterMiss).toMatchObject({ hits: 0, misses: 1, providerCalls: 1 });

    const second = await controller.ticker({ symbol: 'BTCUSDT' });
    expect(second).toEqual(first);
    const statsAfterHit = controller.cacheStats();
    expect(statsAfterHit).toMatchObject({ hits: 1, misses: 1, providerCalls: 1 });
  });

  it('caches candles per symbol/timeframe/limit key', async () => {
    const controller = buildController();

    await controller.candles({ symbol: 'BTCUSDT', timeframe: '1h', limit: 3 });
    await controller.candles({ symbol: 'BTCUSDT', timeframe: '1h', limit: 3 });
    // Different limit — different key, so a second provider call.
    await controller.candles({ symbol: 'BTCUSDT', timeframe: '1h', limit: 5 });

    const stats = controller.cacheStats();
    expect(stats).toMatchObject({ hits: 1, misses: 2, providerCalls: 2 });
    expect(stats.caches.candles).toMatchObject({ hits: 1, misses: 2, entries: 2 });
  });

  it('exposes cache statistics with per-cache breakdown', async () => {
    const controller = buildController();
    await controller.ticker({ symbol: 'BTCUSDT' });

    const stats = controller.cacheStats();
    expect(stats.enabled).toBe(true);
    expect(stats.caches.ticker).toMatchObject({ misses: 1, entries: 1, ttlSeconds: 5 });
    expect(stats.caches.candles).toMatchObject({ hits: 0, misses: 0, entries: 0, ttlSeconds: 60 });
    expect(Number.isFinite(Date.parse(stats.generatedAt))).toBe(true);
    expect(Number.isFinite(Date.parse(stats.lastRefresh ?? ''))).toBe(true);
  });
});
