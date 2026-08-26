import { describe, expect, it } from 'vitest';
import {
  MARKET_DATA_PROVIDER_CATALOG,
  listMarketDataProviders,
} from './market-data-provider-catalog';

describe('Market Data provider catalog (W2-S03-a)', () => {
  it('offers Binance, Bybit, and OKX as data-driven catalog rows', () => {
    expect(listMarketDataProviders().map((provider) => provider.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
    expect(MARKET_DATA_PROVIDER_CATALOG).toHaveLength(3);
  });

  it('describes each offered provider with identity and static availability', () => {
    for (const provider of listMarketDataProviders()) {
      expect(provider.displayName.length).toBeGreaterThan(0);
      expect(provider.availability).toBe('AVAILABLE');
      expect(provider.capabilities).toEqual(['SYMBOLS', 'TICKER', 'CANDLES', 'ORDER_BOOK']);
    }
  });

  it('does not offer unlisted venues as Core providers', () => {
    const ids = listMarketDataProviders().map((provider) => provider.id);
    expect(ids).not.toContain('KRAKEN');
    expect(ids).not.toContain('COINBASE');
  });

  it('does not store transport or trading fields on catalog rows', () => {
    for (const provider of listMarketDataProviders()) {
      expect(provider).not.toHaveProperty('transport');
      expect(provider).not.toHaveProperty('rest');
      expect(provider).not.toHaveProperty('websocket');
      expect(provider).not.toHaveProperty('http');
      expect(provider).not.toHaveProperty('baseUrl');
      expect(provider).not.toHaveProperty('pollInterval');
    }
  });
});
