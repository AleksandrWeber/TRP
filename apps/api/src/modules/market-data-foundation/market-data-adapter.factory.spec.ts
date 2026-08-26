import { describe, expect, it } from 'vitest';
import { DeclaredMarketDataAdapter } from './market-data-adapter';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import {
  MarketDataAdapterRegistry,
  MarketDataProviderNotFoundError,
  defaultMarketDataAdapterRegistry,
} from './market-data-adapter.registry';
import type { MarketDataProviderMetadata } from './market-data-provider-catalog';

describe('Market Data adapter factory (W2-S03-a)', () => {
  it('resolves offered adapters by provider identity', () => {
    const factory = new MarketDataAdapterFactory(defaultMarketDataAdapterRegistry);

    expect(factory.resolve('BINANCE').identity).toEqual({
      id: 'BINANCE',
      displayName: 'Binance',
    });
    expect(factory.resolve('BYBIT')).toBeInstanceOf(DeclaredMarketDataAdapter);
    expect(factory.resolve('OKX').describe().availability).toBe('AVAILABLE');
    expect(factory.tryResolve('KRAKEN')).toBeNull();
    expect(() => factory.resolve('KRAKEN')).toThrow(MarketDataProviderNotFoundError);
  });

  it('discovers registered adapters through the factory', () => {
    const factory = new MarketDataAdapterFactory(defaultMarketDataAdapterRegistry);

    expect(factory.discover().map((adapter) => adapter.identity.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
  });

  it('creates and registers an additional provider without modifying existing adapters', () => {
    const registry = new MarketDataAdapterRegistry(defaultMarketDataAdapterRegistry.list());
    const factory = new MarketDataAdapterFactory(registry);
    const extra: MarketDataProviderMetadata = {
      id: 'SIMULATED',
      displayName: 'Simulated',
      capabilities: ['SYMBOLS', 'TICKER', 'CANDLES', 'ORDER_BOOK'],
      availability: 'AVAILABLE',
    };

    const created = factory.create(extra);
    registry.register(created);

    expect(factory.resolve('SIMULATED')).toBe(created);
    expect(factory.resolve('BINANCE').identity.id).toBe('BINANCE');
    expect(factory.resolve('BYBIT').identity.id).toBe('BYBIT');
    expect(factory.resolve('OKX').identity.id).toBe('OKX');
    expect(defaultMarketDataAdapterRegistry.lookup('SIMULATED')).toBeNull();
  });
});
