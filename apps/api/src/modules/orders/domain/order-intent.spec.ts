import { describe, expect, it } from 'vitest';
import {
  createOrderIntent,
  OrderPositionEffect,
  OrderSide,
  OrderType,
  type CreateOrderIntentInput,
} from './order-intent';

const base: CreateOrderIntentInput = {
  clientOrderId: 'manual-001',
  idempotencyKey: 'idem-001',
  workspaceId: 'workspace-1',
  paperAccountId: 'account-1',
  tradingSessionId: 'session-1',
  sessionFencingToken: 7,
  mode: 'paper',
  origin: 'manual',
  instrument: 'btcusdt',
  side: OrderSide.BUY,
  type: OrderType.MARKET,
  quantity: '0.1000',
  marketCheckpoint: {
    streamId: 'binance:BTCUSDT:1m',
    sequence: 42,
    eventId: 'market-event-42',
  },
  actorId: 'trader-1',
  correlationId: 'correlation-a',
  occurredAt: '2026-07-18T17:00:00.000Z',
  recordedAt: '2026-07-18T17:00:00.100Z',
};

describe('US159 — Order Intent and identity contracts', () => {
  it('creates stable paper-only manual identity with canonical decimals', () => {
    const first = createOrderIntent(base);
    const replay = createOrderIntent({
      ...base,
      clientOrderId: 'manual-001-retry',
      idempotencyKey: 'idem-001-retry',
      actorId: 'another-authorized-trader',
      quantity: '0.1',
      correlationId: 'different-operational-correlation',
      recordedAt: '2026-07-18T17:01:00.000Z',
    });

    expect(first.orderId).not.toBe(replay.orderId);
    expect(first.intentHash).toBe(replay.intentHash);
    expect(first.quantity).toBe('0.1');
    expect(first.instrument).toBe('BTCUSDT');
    expect(first.positionEffect).toBe(OrderPositionEffect.OPEN_OR_INCREASE_LONG);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.marketCheckpoint)).toBe(true);
  });

  it('requires exact market/limit semantics and decimal input', () => {
    expect(() => createOrderIntent({ ...base, quantity: 0.1 as never })).toThrow(
      /canonical decimal string/,
    );
    expect(() => createOrderIntent({ ...base, limitPrice: '100' })).toThrow(
      /market order intent cannot have a limit price/,
    );
    expect(() => createOrderIntent({ ...base, type: OrderType.LIMIT })).toThrow(
      /requires a limit price/,
    );

    const limit = createOrderIntent({
      ...base,
      clientOrderId: 'manual-limit',
      idempotencyKey: 'idem-limit',
      type: OrderType.LIMIT,
      limitPrice: '60000.1200',
    });
    expect(limit.limitPrice).toBe('60000.12');
  });

  it('structurally prevents live and short-opening intents', () => {
    expect(() => createOrderIntent({ ...base, mode: 'live' as never })).toThrow(
      /mode must be paper/,
    );
    expect(() =>
      createOrderIntent({
        ...base,
        clientOrderId: 'sell-not-reduce',
        idempotencyKey: 'sell-not-reduce',
        side: OrderSide.SELL,
      }),
    ).toThrow(/sell order intent must be reduce-only/);

    const reduce = createOrderIntent({
      ...base,
      clientOrderId: 'sell-reduce',
      idempotencyKey: 'sell-reduce',
      side: OrderSide.SELL,
      reduceOnly: true,
    });
    expect(reduce.positionEffect).toBe(OrderPositionEffect.REDUCE_ONLY);
  });
});
