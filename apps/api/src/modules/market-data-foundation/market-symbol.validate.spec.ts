import { describe, expect, it } from 'vitest';
import {
  MarketSymbolDuplicateError,
  MarketSymbolValidationError,
  validateAndNormalizeSymbols,
} from './market-symbol.validate';

describe('Market symbol validation (W2-S03-b)', () => {
  it('accepts a valid provider-scoped batch', () => {
    const symbols = validateAndNormalizeSymbols('BINANCE', [
      {
        exchangeSymbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        tradingStatus: 'TRADING',
      },
      {
        exchangeSymbol: 'ETHBTC',
        baseAsset: 'ETH',
        quoteAsset: 'BTC',
        tradingStatus: 'HALT',
      },
    ]);
    expect(symbols.map((symbol) => symbol.normalizedSymbol)).toEqual(['BTC-USDT', 'ETH-BTC']);
  });

  it('rejects invalid definitions fail-closed', () => {
    expect(() =>
      validateAndNormalizeSymbols('BINANCE', [
        {
          exchangeSymbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'NOT_A_STATUS',
        },
      ]),
    ).toThrow(MarketSymbolValidationError);
  });

  it('rejects duplicate normalized symbols', () => {
    expect(() =>
      validateAndNormalizeSymbols('BINANCE', [
        {
          exchangeSymbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
        },
        {
          exchangeSymbol: 'BTCUSD',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
        },
      ]),
    ).toThrow(MarketSymbolDuplicateError);
  });

  it('rejects duplicate exchange symbols', () => {
    expect(() =>
      validateAndNormalizeSymbols('BINANCE', [
        {
          exchangeSymbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
        },
        {
          exchangeSymbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'HALT',
        },
      ]),
    ).toThrow(MarketSymbolDuplicateError);
  });
});
