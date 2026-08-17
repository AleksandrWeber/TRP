import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_PROVIDER_CAPABILITIES,
  hasExchangeProviderCapability,
  isExchangeProviderCapability,
} from './exchange-provider-capabilities';
import { EXCHANGE_PROVIDER_CATALOG } from './exchange-provider-catalog';

describe('Exchange provider capability model (W2-S02-a)', () => {
  it('models connectivity metadata only', () => {
    expect(EXCHANGE_PROVIDER_CAPABILITIES).toEqual([
      'SPOT',
      'FUTURES',
      'TESTNET',
      'MARGIN',
      'WEBSOCKET',
      'REST',
    ]);
    expect(EXCHANGE_PROVIDER_CAPABILITIES).not.toContain('ORDERS');
    expect(EXCHANGE_PROVIDER_CAPABILITIES).not.toContain('BALANCES');
    expect(EXCHANGE_PROVIDER_CAPABILITIES).not.toContain('POSITIONS');
    expect(EXCHANGE_PROVIDER_CAPABILITIES).not.toContain('TRADING');
    expect(EXCHANGE_PROVIDER_CAPABILITIES).not.toContain('LIVE');
  });

  it('accepts only declared capability identifiers', () => {
    expect(isExchangeProviderCapability('SPOT')).toBe(true);
    expect(isExchangeProviderCapability('REST')).toBe(true);
    expect(isExchangeProviderCapability('ORDERS')).toBe(false);
    expect(isExchangeProviderCapability('HTTP')).toBe(false);
  });

  it('reads capabilities from catalog metadata without runtime detection', () => {
    for (const provider of EXCHANGE_PROVIDER_CATALOG) {
      expect(hasExchangeProviderCapability(provider.capabilities, 'SPOT')).toBe(true);
      expect(hasExchangeProviderCapability(provider.capabilities, 'REST')).toBe(true);
      expect(provider.capabilities.every(isExchangeProviderCapability)).toBe(true);
    }
  });
});
