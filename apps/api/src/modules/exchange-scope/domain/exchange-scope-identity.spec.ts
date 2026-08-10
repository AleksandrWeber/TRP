import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINANCE_EXCHANGE_SCOPE,
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  resolveExchangeScopeId,
} from './exchange-scope-identity';

describe('RC-19 Epic 1 — Exchange Scope identity', () => {
  it('exposes a single default Binance scope', () => {
    expect(DEFAULT_BINANCE_EXCHANGE_SCOPE).toEqual({
      id: DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
      exchangeCode: 'binance',
      label: 'Binance',
    });
    expect(Object.isFrozen(DEFAULT_BINANCE_EXCHANGE_SCOPE)).toBe(true);
  });

  it('assigns the default Binance scope when value is omitted or blank', () => {
    expect(resolveExchangeScopeId()).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(resolveExchangeScopeId(null)).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(resolveExchangeScopeId('')).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(resolveExchangeScopeId('   ')).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });

  it('preserves an explicit non-empty scope id', () => {
    expect(resolveExchangeScopeId('exchange-scope:binance')).toBe(
      DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
    );
    expect(resolveExchangeScopeId('  exchange-scope:binance  ')).toBe(
      DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
    );
  });
});
