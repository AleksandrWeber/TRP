import { describe, expect, it } from 'vitest';
import { MarketSymbolCache } from './market-symbol.cache';

describe('Market symbol cache (W2-S03-b)', () => {
  it('stores normalized symbols only and isolates workspace connections', () => {
    const cache = new MarketSymbolCache();
    cache.set('workspace-a', 'connection-a', {
      providerId: 'BINANCE',
      discoveredAt: '2026-08-26T00:00:00.000Z',
      symbols: [
        {
          exchangeSymbol: 'BTCUSDT',
          normalizedSymbol: 'BTC-USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
          providerId: 'BINANCE',
        },
      ],
    });

    expect(cache.get('workspace-a', 'connection-a')?.symbols).toHaveLength(1);
    expect(cache.get('workspace-b', 'connection-a')).toBeNull();
    expect(cache.get('workspace-a', 'connection-b')).toBeNull();
    expect(JSON.stringify(cache.get('workspace-a', 'connection-a'))).not.toMatch(
      /price|ticker|candle|orderBook|balance/i,
    );

    cache.clear('workspace-a', 'connection-a');
    expect(cache.get('workspace-a', 'connection-a')).toBeNull();
  });
});
