import { describe, expect, it } from 'vitest';
import { MockMarketDataProvider } from '../providers/mock-market-data-provider';
import { MarketDataProviderRegistry } from './market-data-provider-registry';
import type { MarketDataProvider } from './market-data-provider';

function fakeProvider(id: string): MarketDataProvider {
  const mock = new MockMarketDataProvider();
  return {
    id,
    getTicker: (symbol) => mock.getTicker(symbol),
    getCandles: (symbol, timeframe, limit) => mock.getCandles(symbol, timeframe, limit),
    health: async () => ({ providerId: id, status: 'ok', detail: 'fake' }),
  };
}

describe('MarketDataProviderRegistry (US006)', () => {
  it('activates the first registered provider', async () => {
    const registry = new MarketDataProviderRegistry();
    registry.register(new MockMarketDataProvider());

    expect(registry.getActive().id).toBe('mock');
    expect(registry.list()).toEqual(['mock']);
    await expect(registry.getActive().health()).resolves.toMatchObject({ status: 'ok' });
  });

  it('switches the active provider explicitly', () => {
    const registry = new MarketDataProviderRegistry();
    registry.register(fakeProvider('mock'));
    registry.register(fakeProvider('binance'));

    expect(registry.getActive().id).toBe('mock');
    registry.setActive('binance');
    expect(registry.getActive().id).toBe('binance');
  });

  it('rejects duplicate, empty, and unknown provider ids', () => {
    const registry = new MarketDataProviderRegistry();
    registry.register(fakeProvider('mock'));

    expect(() => registry.register(fakeProvider('mock'))).toThrow(/already registered/);
    expect(() => registry.register(fakeProvider('  '))).toThrow(/must not be empty/);
    expect(() => registry.setActive('binance')).toThrow(/No MarketDataProvider registered/);
  });

  it('fails fast when no provider is registered', () => {
    expect(() => new MarketDataProviderRegistry().getActive()).toThrow(/No active/);
  });
});
