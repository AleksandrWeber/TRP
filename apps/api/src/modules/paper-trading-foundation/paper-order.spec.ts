import { describe, expect, it } from 'vitest';
import {
  cancelPaperOrder,
  createPaperOrder,
  isPaperOrderStatus,
  isPaperOrderType,
  updatePaperOrder,
} from './paper-order';

const now = '2026-08-26T15:00:00.000Z';

describe('Paper Order model (W2-S04-b)', () => {
  it('creates Limit Buy with required limit price', () => {
    const order = createPaperOrder({
      id: 'o-1',
      workspaceId: 'workspace-a',
      paperAccountId: 'pa-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '0.5',
      limitPrice: '50000',
      status: 'PENDING',
      createdAt: now,
    });
    expect(order.status).toBe('PENDING');
    expect(order.limitPrice).toBe('50000');
    expect(order.stopPrice).toBeNull();
  });

  it('validates order types, sides, quantity, and prices', () => {
    expect(isPaperOrderType('MARKET')).toBe(true);
    expect(isPaperOrderType('STOP_LIMIT')).toBe(true);
    expect(isPaperOrderType('TRAILING')).toBe(false);
    expect(isPaperOrderStatus('PENDING')).toBe(true);
    expect(isPaperOrderStatus('FILLED')).toBe(false);

    expect(() =>
      createPaperOrder({
        id: 'o-1',
        workspaceId: 'workspace-a',
        paperAccountId: 'pa-1',
        exchange: 'BINANCE',
        symbol: 'BTC-USDT',
        side: 'HOLD',
        orderType: 'MARKET',
        quantity: '1',
        status: 'PENDING',
        createdAt: now,
      }),
    ).toThrow(/unsupported paper order side/);

    expect(() =>
      createPaperOrder({
        id: 'o-1',
        workspaceId: 'workspace-a',
        paperAccountId: 'pa-1',
        exchange: 'BINANCE',
        symbol: 'BTC-USDT',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: '0',
        status: 'PENDING',
        createdAt: now,
      }),
    ).toThrow(/quantity/);

    expect(() =>
      createPaperOrder({
        id: 'o-1',
        workspaceId: 'workspace-a',
        paperAccountId: 'pa-1',
        exchange: 'BINANCE',
        symbol: 'BTC-USDT',
        side: 'BUY',
        orderType: 'LIMIT',
        quantity: '1',
        status: 'PENDING',
        createdAt: now,
      }),
    ).toThrow(/limit price is required/);
  });

  it('updates Draft/Pending and cancels only those statuses', () => {
    const pending = createPaperOrder({
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
    const updated = updatePaperOrder(pending, { quantity: '2' }, '2026-08-26T15:01:00.000Z');
    expect(updated.quantity).toBe('2');
    expect(updated.status).toBe('PENDING');

    const cancelled = cancelPaperOrder(updated, '2026-08-26T15:02:00.000Z');
    expect(cancelled.status).toBe('CANCELLED');
    expect(() => cancelPaperOrder(cancelled, '2026-08-26T15:03:00.000Z')).toThrow(/cannot cancel/);
  });
});
