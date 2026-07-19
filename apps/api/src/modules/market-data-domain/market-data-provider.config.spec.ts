import { describe, expect, it } from 'vitest';
import { resolveMarketDataProviderId } from './market-data-provider.config';

const REGISTERED = ['mock', 'binance'] as const;

describe('resolveMarketDataProviderId (US007)', () => {
  it('defaults to mock when the variable is unset or blank', () => {
    expect(resolveMarketDataProviderId(undefined, REGISTERED)).toBe('mock');
    expect(resolveMarketDataProviderId('', REGISTERED)).toBe('mock');
    expect(resolveMarketDataProviderId('   ', REGISTERED)).toBe('mock');
  });

  it('activates the configured provider, case-insensitively', () => {
    expect(resolveMarketDataProviderId('binance', REGISTERED)).toBe('binance');
    expect(resolveMarketDataProviderId('  Binance ', REGISTERED)).toBe('binance');
    expect(resolveMarketDataProviderId('mock', REGISTERED)).toBe('mock');
  });

  it('fails fast on an unknown provider id', () => {
    expect(() => resolveMarketDataProviderId('binanse', REGISTERED)).toThrow(
      /Unknown MARKET_DATA_PROVIDER 'binanse'.*mock, binance/,
    );
  });
});
