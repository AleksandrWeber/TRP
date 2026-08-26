import { describe, expect, it } from 'vitest';
import {
  MarketTickerInvalidSymbolError,
  MarketTickerMalformedPayloadError,
  MarketTickerValidationError,
  validateAndNormalizeTicker,
  validateTickerSymbolRequest,
} from './market-ticker.validate';

describe('Market ticker validation (W2-S03-c)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('accepts a valid observation', () => {
    const ticker = validateAndNormalizeTicker({
      providerId: 'BINANCE',
      normalizedSymbol: 'BTC-USDT',
      retrievalTimestamp,
      observation: {
        exchangeSymbol: 'BTCUSDT',
        lastPrice: '100',
        bid: '99',
        ask: '101',
        changePercent24h: '0.5',
        high24h: '110',
        low24h: '90',
        volume24h: '50',
        exchangeTimestampMs: Date.parse(retrievalTimestamp) - 1_000,
      },
    });
    expect(ticker.lastPrice).toBe('100');
    expect(ticker.freshness).toBe('FRESH');
  });

  it('rejects malformed payloads and invalid prices fail-closed', () => {
    expect(() =>
      validateAndNormalizeTicker({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        retrievalTimestamp,
        observation: null,
      }),
    ).toThrow(MarketTickerMalformedPayloadError);

    expect(() =>
      validateAndNormalizeTicker({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        retrievalTimestamp,
        observation: {
          exchangeSymbol: 'BTCUSDT',
          lastPrice: '',
          bid: '1',
          ask: '2',
          changePercent24h: '0',
          high24h: '3',
          low24h: '1',
          volume24h: '1',
          exchangeTimestampMs: Date.parse(retrievalTimestamp),
        },
      }),
    ).toThrow(MarketTickerValidationError);
  });

  it('rejects inconsistent timestamps beyond clock skew', () => {
    expect(() =>
      validateAndNormalizeTicker({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        retrievalTimestamp,
        observation: {
          exchangeSymbol: 'BTCUSDT',
          lastPrice: '1',
          bid: '1',
          ask: '1',
          changePercent24h: '0',
          high24h: '1',
          low24h: '1',
          volume24h: '1',
          exchangeTimestampMs: Date.parse(retrievalTimestamp) + 60_000,
        },
      }),
    ).toThrow(MarketTickerValidationError);
  });

  it('rejects invalid symbols', () => {
    expect(() =>
      validateTickerSymbolRequest({ exchangeSymbol: '', normalizedSymbol: 'BTC-USDT' }),
    ).toThrow(MarketTickerInvalidSymbolError);
    expect(() =>
      validateTickerSymbolRequest({ exchangeSymbol: 'BTCUSDT', normalizedSymbol: 'BTCUSDT' }),
    ).toThrow(MarketTickerInvalidSymbolError);
  });
});
