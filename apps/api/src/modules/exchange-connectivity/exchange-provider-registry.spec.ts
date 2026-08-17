import { describe, expect, it } from 'vitest';
import {
  ExchangeProviderNotFoundError,
  ExchangeProviderRegistry,
  defaultExchangeProviderRegistry,
  lookupExchangeProvider,
  selectExchangeProvider,
} from './exchange-provider-registry';
import type { ExchangeProviderMetadata } from './exchange-provider-catalog';

describe('Exchange provider registry (W2-S02-a)', () => {
  it('lists the offered catalog without per-provider branching', () => {
    expect(defaultExchangeProviderRegistry.list().map((provider) => provider.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
  });

  it('looks up offered providers and returns null for unknown ids', () => {
    expect(lookupExchangeProvider('BINANCE')?.displayName).toBe('Binance');
    expect(lookupExchangeProvider('BYBIT')?.displayName).toBe('Bybit');
    expect(lookupExchangeProvider('OKX')?.displayName).toBe('OKX');
    expect(lookupExchangeProvider('KRAKEN')).toBeNull();
    expect(lookupExchangeProvider('COINBASE')).toBeNull();
    expect(lookupExchangeProvider('TELEGRAM')).toBeNull();
  });

  it('selects an offered provider and fails closed for unknown ids', () => {
    expect(selectExchangeProvider('BINANCE').id).toBe('BINANCE');
    expect(selectExchangeProvider('BYBIT').id).toBe('BYBIT');
    expect(selectExchangeProvider('OKX').id).toBe('OKX');
    expect(() => selectExchangeProvider('KRAKEN')).toThrow(ExchangeProviderNotFoundError);
    expect(() => selectExchangeProvider('COINBASE')).toThrow(
      'Exchange provider not found: COINBASE',
    );
  });

  it('accepts additional catalog rows without changing selection logic', () => {
    const extra: ExchangeProviderMetadata = {
      id: 'KRAKEN',
      displayName: 'Kraken',
      category: 'EXCHANGE',
      capabilities: ['SPOT', 'REST'],
      availability: 'UNAVAILABLE',
    };
    const registry = new ExchangeProviderRegistry([
      ...defaultExchangeProviderRegistry.list(),
      extra,
    ]);

    expect(registry.select('KRAKEN')).toMatchObject({
      id: 'KRAKEN',
      displayName: 'Kraken',
      availability: 'UNAVAILABLE',
    });
    expect(lookupExchangeProvider('KRAKEN')).toBeNull();
  });
});
