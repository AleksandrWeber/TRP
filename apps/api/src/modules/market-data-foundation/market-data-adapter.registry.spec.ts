import { describe, expect, it } from 'vitest';
import { DeclaredMarketDataAdapter } from './market-data-adapter';
import {
  MarketDataAdapterRegistry,
  MarketDataProviderAlreadyRegisteredError,
  MarketDataProviderIdentityInvalidError,
  MarketDataProviderNotFoundError,
  defaultMarketDataAdapterRegistry,
  lookupMarketDataAdapter,
  selectMarketDataAdapter,
} from './market-data-adapter.registry';
import type { MarketDataProviderMetadata } from './market-data-provider-catalog';

describe('Market Data adapter registry (W2-S03-a)', () => {
  it('discovers the offered catalog without per-provider branching', () => {
    expect(defaultMarketDataAdapterRegistry.list().map((adapter) => adapter.identity.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
  });

  it('looks up offered providers and returns null for unknown ids', () => {
    expect(lookupMarketDataAdapter('BINANCE')?.identity.displayName).toBe('Binance');
    expect(lookupMarketDataAdapter('BYBIT')?.identity.displayName).toBe('Bybit');
    expect(lookupMarketDataAdapter('OKX')?.identity.displayName).toBe('OKX');
    expect(lookupMarketDataAdapter('KRAKEN')).toBeNull();
    expect(lookupMarketDataAdapter('COINBASE')).toBeNull();
    expect(lookupMarketDataAdapter('TELEGRAM')).toBeNull();
  });

  it('selects an offered provider and fails closed for unknown ids', () => {
    expect(selectMarketDataAdapter('BINANCE').identity.id).toBe('BINANCE');
    expect(selectMarketDataAdapter('BYBIT').identity.id).toBe('BYBIT');
    expect(selectMarketDataAdapter('OKX').identity.id).toBe('OKX');
    expect(() => selectMarketDataAdapter('KRAKEN')).toThrow(MarketDataProviderNotFoundError);
    expect(() => selectMarketDataAdapter('COINBASE')).toThrow(
      'Market Data provider not found: COINBASE',
    );
  });

  it('registers additional adapters without changing offered adapters', () => {
    const extra: MarketDataProviderMetadata = {
      id: 'KRAKEN',
      displayName: 'Kraken',
      capabilities: ['SYMBOLS', 'TICKER'],
      availability: 'UNAVAILABLE',
    };
    const registry = new MarketDataAdapterRegistry(defaultMarketDataAdapterRegistry.list());
    registry.register(new DeclaredMarketDataAdapter(extra));

    expect(registry.select('KRAKEN').describe()).toMatchObject({
      identity: { id: 'KRAKEN', displayName: 'Kraken' },
      availability: 'UNAVAILABLE',
    });
    expect(registry.select('BINANCE').identity.id).toBe('BINANCE');
    expect(lookupMarketDataAdapter('KRAKEN')).toBeNull();
  });

  it('fails closed on duplicate registration and empty identity', () => {
    const registry = new MarketDataAdapterRegistry();
    expect(() => registry.register(selectMarketDataAdapter('BINANCE'))).toThrow(
      MarketDataProviderAlreadyRegisteredError,
    );
    expect(() =>
      registry.register(
        new DeclaredMarketDataAdapter({
          id: '   ',
          displayName: 'Blank',
          capabilities: ['TICKER'],
          availability: 'UNAVAILABLE',
        }),
      ),
    ).toThrow(MarketDataProviderIdentityInvalidError);
  });
});
