import { describe, expect, it } from 'vitest';
import { normalizeProviderSymbol, normalizeProviderSymbols } from './market-symbol.normalize';

describe('Market symbol normalization (W2-S03-b)', () => {
  it('normalizes provider symbols deterministically without guessing', () => {
    const first = normalizeProviderSymbol('BINANCE', {
      exchangeSymbol: 'btcusdt',
      baseAsset: 'btc',
      quoteAsset: 'usdt',
      tradingStatus: 'trading',
    });
    const second = normalizeProviderSymbol('BINANCE', {
      exchangeSymbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      tradingStatus: 'TRADING',
    });

    expect(first).toEqual({
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      tradingStatus: 'TRADING',
      providerId: 'BINANCE',
    });
    expect(second).toEqual(first);
  });

  it('does not invent trading status or fill missing assets', () => {
    expect(
      normalizeProviderSymbol('BINANCE', {
        exchangeSymbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        tradingStatus: 'MADE_UP',
      }),
    ).toBeNull();
    expect(
      normalizeProviderSymbol('BINANCE', {
        exchangeSymbol: 'BTCUSDT',
        baseAsset: '',
        quoteAsset: 'USDT',
        tradingStatus: 'TRADING',
      }),
    ).toBeNull();
  });

  it('counts rejected definitions without inventing replacements', () => {
    const result = normalizeProviderSymbols('BINANCE', [
      {
        exchangeSymbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        tradingStatus: 'TRADING',
      },
      {
        exchangeSymbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        tradingStatus: 'UNKNOWN_STATUS',
      },
    ]);
    expect(result.symbols).toHaveLength(1);
    expect(result.rejectedCount).toBe(1);
  });
});
