import { describe, expect, it } from 'vitest';
import {
  MarketCandleDuplicateTimestampError,
  MarketCandleInvalidIntervalError,
  MarketCandleValidationError,
  validateAndNormalizeCandles,
  validateCandleRetrievalRequest,
} from './market-candle.validate';

describe('Market candle validation (W2-S03-d)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('accepts a valid batch and rejects unsupported intervals', () => {
    const result = validateAndNormalizeCandles({
      providerId: 'BINANCE',
      normalizedSymbol: 'BTC-USDT',
      interval: '1h',
      retrievalTimestamp,
      observations: [
        {
          openTimeMs: Date.parse('2026-08-26T10:00:00.000Z'),
          closeTimeMs: Date.parse('2026-08-26T10:59:59.999Z'),
          open: '100',
          high: '110',
          low: '90',
          close: '105',
          volume: '1',
          tradeCount: 10,
        },
      ],
    });
    expect(result.candles).toHaveLength(1);
    expect(result.freshness).toBe('STALE');

    expect(() =>
      validateCandleRetrievalRequest({
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        interval: '2h',
        rangeStart: '2026-08-26T00:00:00.000Z',
        rangeEnd: '2026-08-26T12:00:00.000Z',
      }),
    ).toThrow(MarketCandleInvalidIntervalError);
  });

  it('rejects duplicate open timestamps', () => {
    expect(() =>
      validateAndNormalizeCandles({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        interval: '1h',
        retrievalTimestamp,
        observations: [
          {
            openTimeMs: 1000,
            closeTimeMs: 2000,
            open: '1',
            high: '2',
            low: '1',
            close: '1.5',
            volume: '1',
            tradeCount: 1,
          },
          {
            openTimeMs: 1000,
            closeTimeMs: 2000,
            open: '1',
            high: '2',
            low: '1',
            close: '1.5',
            volume: '1',
            tradeCount: 1,
          },
        ],
      }),
    ).toThrow(MarketCandleDuplicateTimestampError);
  });

  it('rejects invalid prices fail-closed', () => {
    expect(() =>
      validateAndNormalizeCandles({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        interval: '1h',
        retrievalTimestamp,
        observations: [
          {
            openTimeMs: 1000,
            closeTimeMs: 2000,
            open: 'bad',
            high: '2',
            low: '1',
            close: '1.5',
            volume: '1',
            tradeCount: 1,
          },
        ],
      }),
    ).toThrow(MarketCandleValidationError);
  });
});
