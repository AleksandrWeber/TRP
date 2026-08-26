import { describe, expect, it } from 'vitest';
import { parseBinanceDepth } from './binance-order-book.adapter';

describe('Binance order book provider mapping (W2-S03-e)', () => {
  it('maps Binance depth levels without inventing a timestamp', () => {
    const snapshot = parseBinanceDepth(
      JSON.stringify({
        lastUpdateId: 1,
        bids: [
          ['100.0', '2.0'],
          ['99.0', '1.0'],
        ],
        asks: [
          ['101.0', '3.0'],
          ['102.0', '4.0'],
        ],
      }),
      'BTCUSDT',
    );
    expect(snapshot).toEqual({
      exchangeSymbol: 'BTCUSDT',
      exchangeTimestampMs: null,
      bids: [
        { price: '100.0', quantity: '2.0' },
        { price: '99.0', quantity: '1.0' },
      ],
      asks: [
        { price: '101.0', quantity: '3.0' },
        { price: '102.0', quantity: '4.0' },
      ],
    });
  });

  it('rejects malformed Binance depth payloads', () => {
    expect(parseBinanceDepth('{', 'BTCUSDT')).toBeNull();
    expect(parseBinanceDepth(JSON.stringify({ bids: 'x', asks: [] }), 'BTCUSDT')).toBeNull();
  });
});
