import { describe, expect, it } from 'vitest';
import { EXCHANGE_PROVIDER_CATALOG, listExchangeProviders } from './exchange-provider-catalog';

describe('Exchange provider catalog (W2-S02-a)', () => {
  it('offers Binance, Bybit, and OKX as data-driven catalog rows', () => {
    expect(listExchangeProviders().map((provider) => provider.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
    expect(EXCHANGE_PROVIDER_CATALOG).toHaveLength(3);
  });

  it('describes each offered provider with metadata only', () => {
    for (const provider of listExchangeProviders()) {
      expect(provider.displayName.length).toBeGreaterThan(0);
      expect(provider.category).toBe('EXCHANGE');
      expect(provider.availability).toBe('AVAILABLE');
      expect(provider.capabilities).toEqual([
        'SPOT',
        'FUTURES',
        'TESTNET',
        'MARGIN',
        'WEBSOCKET',
        'REST',
      ]);
    }
  });

  it('does not offer unlisted venues as Core providers', () => {
    const ids = listExchangeProviders().map((provider) => provider.id);
    expect(ids).not.toContain('KRAKEN');
    expect(ids).not.toContain('COINBASE');
  });
});
