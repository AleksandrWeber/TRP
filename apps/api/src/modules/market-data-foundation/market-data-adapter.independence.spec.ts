import { describe, expect, it } from 'vitest';
import { DeclaredMarketDataAdapter, type MarketDataProviderAdapter } from './market-data-adapter';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import type { MarketDataProviderMetadata } from './market-data-provider-catalog';

describe('Market Data provider independence (W2-S03-a)', () => {
  it('treats every adapter as the same contract regardless of provider identity', () => {
    const registry = new MarketDataAdapterRegistry();
    const described = registry.list().map((adapter) => adapter.describe());

    for (const contract of described) {
      expect(Object.keys(contract).sort()).toEqual(['availability', 'capabilities', 'identity']);
      expect(contract.identity).toEqual({
        id: contract.identity.id,
        displayName: contract.identity.displayName,
      });
    }
  });

  it('accepts a simulated test adapter that shares the public interface', () => {
    const simulated: MarketDataProviderAdapter = new DeclaredMarketDataAdapter({
      id: 'REPLAY',
      displayName: 'Replay',
      capabilities: ['CANDLES'],
      availability: 'AVAILABLE',
    });
    const registry = new MarketDataAdapterRegistry([]);
    const factory = new MarketDataAdapterFactory(registry);
    registry.register(simulated);

    expect(factory.resolve('REPLAY')).toBe(simulated);
    expect(factory.resolve('REPLAY').describe()).not.toHaveProperty('transport');
    expect(factory.resolve('REPLAY').describe()).not.toHaveProperty('source');
  });

  it('does not require existing adapter source changes to add a provider', () => {
    const extra: MarketDataProviderMetadata = {
      id: 'FUTURE',
      displayName: 'Future Venue',
      capabilities: ['SYMBOLS'],
      availability: 'UNAVAILABLE',
    };
    const registry = new MarketDataAdapterRegistry();
    const offered = registry.list().map((adapter) => adapter.identity.id);
    registry.register(new DeclaredMarketDataAdapter(extra));

    expect(offered).toEqual(['BINANCE', 'BYBIT', 'OKX']);
    expect(registry.list().map((adapter) => adapter.identity.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
      'FUTURE',
    ]);
  });
});
