import { describe, expect, it } from 'vitest';
import type { NormalizedMarketTicker } from '../market-data-foundation/market-ticker';
import { matchPaperOrder } from './paper-matching';
import { createPaperOrder } from './paper-order';

const now = '2026-08-26T16:00:00.000Z';

function ticker(overrides?: Partial<NormalizedMarketTicker>): NormalizedMarketTicker {
  return {
    normalizedSymbol: 'BTC-USDT',
    lastPrice: '50000',
    bid: '49990',
    ask: '50010',
    changePercent24h: '1',
    high24h: '51000',
    low24h: '49000',
    volume24h: '100',
    exchangeTimestamp: now,
    retrievalTimestamp: now,
    providerId: 'BINANCE',
    freshness: 'FRESH',
    ...overrides,
  };
}

describe('Paper Matching (W2-S04-c)', () => {
  it('matches market buy at ask and market sell at bid', () => {
    const buy = createPaperOrder({
      id: 'o-1',
      workspaceId: 'workspace-a',
      paperAccountId: 'pa-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
      status: 'PENDING',
      createdAt: now,
    });
    expect(matchPaperOrder(buy, ticker())).toEqual({ matched: true, executionPrice: '50010' });

    const sell = createPaperOrder({
      id: 'o-2',
      workspaceId: 'workspace-a',
      paperAccountId: 'pa-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'SELL',
      orderType: 'MARKET',
      quantity: '1',
      status: 'PENDING',
      createdAt: now,
    });
    expect(matchPaperOrder(sell, ticker())).toEqual({ matched: true, executionPrice: '49990' });
  });

  it('refuses missing or stale Market Data without fabricating prices', () => {
    const order = createPaperOrder({
      id: 'o-1',
      workspaceId: 'workspace-a',
      paperAccountId: 'pa-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
      status: 'PENDING',
      createdAt: now,
    });
    expect(matchPaperOrder(order, null).matched).toBe(false);
    expect(matchPaperOrder(order, ticker({ freshness: 'STALE' })).matched).toBe(false);
  });

  it('matches limit buy only when ask is at or below limit', () => {
    const order = createPaperOrder({
      id: 'o-1',
      workspaceId: 'workspace-a',
      paperAccountId: 'pa-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '1',
      limitPrice: '50000',
      status: 'PENDING',
      createdAt: now,
    });
    expect(matchPaperOrder(order, ticker({ ask: '50010' })).matched).toBe(false);
    expect(matchPaperOrder(order, ticker({ ask: '49950' }))).toEqual({
      matched: true,
      executionPrice: '49950',
    });
  });
});
