import { describe, expect, it } from 'vitest';
import {
  MARKET_DATA_PROVIDER_CAPABILITIES,
  hasMarketDataProviderCapability,
  isMarketDataProviderCapability,
} from './market-data-provider-capabilities';
import { MARKET_DATA_PROVIDER_CATALOG } from './market-data-provider-catalog';

describe('Market Data provider capability model (W2-S03-a)', () => {
  it('models product capability metadata only', () => {
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).toEqual([
      'SYMBOLS',
      'TICKER',
      'CANDLES',
      'ORDER_BOOK',
    ]);
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('REST');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('WEBSOCKET');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('HTTP');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('POLLING');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('ORDERS');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('BALANCES');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('POSITIONS');
    expect(MARKET_DATA_PROVIDER_CAPABILITIES).not.toContain('TRADING');
  });

  it('accepts only declared capability identifiers', () => {
    expect(isMarketDataProviderCapability('TICKER')).toBe(true);
    expect(isMarketDataProviderCapability('CANDLES')).toBe(true);
    expect(isMarketDataProviderCapability('REST')).toBe(false);
    expect(isMarketDataProviderCapability('WEBSOCKET')).toBe(false);
    expect(isMarketDataProviderCapability('ORDERS')).toBe(false);
  });

  it('reads capabilities from catalog metadata without runtime detection', () => {
    for (const provider of MARKET_DATA_PROVIDER_CATALOG) {
      expect(hasMarketDataProviderCapability(provider.capabilities, 'SYMBOLS')).toBe(true);
      expect(hasMarketDataProviderCapability(provider.capabilities, 'TICKER')).toBe(true);
      expect(hasMarketDataProviderCapability(provider.capabilities, 'CANDLES')).toBe(true);
      expect(hasMarketDataProviderCapability(provider.capabilities, 'ORDER_BOOK')).toBe(true);
      expect(provider.capabilities.every(isMarketDataProviderCapability)).toBe(true);
    }
  });
});
