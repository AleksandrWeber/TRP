import { describe, expect, it } from 'vitest';
import { createOrder, applyOrderFill } from './domain/order';
import { OrderLifecycleManager } from './order-lifecycle-manager';
import { OrderValidator } from './order-validator';
import { OrderInvalidStateError, OrderValidationError } from './order-errors';

const T0 = '2026-07-20T14:00:00.000Z';

describe('US206 OrderValidator', () => {
  const validator = new OrderValidator();

  it('rejects non-positive quantity', () => {
    expect(() =>
      validator.validateCreateRequest({
        symbol: 'BTC-USD',
        side: 'BUY',
        type: 'MARKET',
        quantity: '0',
      }),
    ).toThrow(OrderValidationError);
  });

  it('requires price for LIMIT orders', () => {
    expect(() =>
      validator.validateCreateRequest({
        symbol: 'BTC-USD',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '1',
      }),
    ).toThrow(/requested price/);
  });

  it('validates allowed transitions', () => {
    expect(validator.canTransition('CREATED', 'VALIDATED')).toBe(true);
    expect(validator.canTransition('PENDING', 'FILLED')).toBe(true);
    expect(validator.canTransition('FILLED', 'CANCELLED')).toBe(false);
    expect(() => validator.assertTransition('CANCELLED', 'PENDING')).toThrow(
      OrderInvalidStateError,
    );
  });

  it('enforces fill invariants', () => {
    const order = createOrder({
      id: 'o1',
      portfolioId: 'p1',
      symbol: 'ETH-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '2',
      createdAt: T0,
      updatedAt: T0,
    });
    const pending = { ...order, status: 'PENDING' as const };
    expect(() => applyOrderFill(pending, { quantity: '3', price: '100', updatedAt: T0 })).toThrow(
      /exceed/,
    );
  });
});

describe('US206 OrderLifecycleManager', () => {
  const lifecycle = new OrderLifecycleManager();

  it('transitions CREATED → VALIDATED → PENDING → CANCELLED', () => {
    const order = createOrder({
      id: 'o1',
      portfolioId: 'p1',
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
      createdAt: T0,
      updatedAt: T0,
    });
    const validated = lifecycle.validate(order, T0);
    expect(validated.currentStatus).toBe('VALIDATED');
    const submitted = lifecycle.submit(validated.order, T0);
    expect(submitted.currentStatus).toBe('PENDING');
    const cancelled = lifecycle.cancel(submitted.order, T0);
    expect(cancelled.order.status).toBe('CANCELLED');
    expect(cancelled.order.cancelledAt).toBe(T0);
  });

  it('rejects executing after cancel via transition rules', () => {
    const order = createOrder({
      id: 'o1',
      portfolioId: 'p1',
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
      createdAt: T0,
      updatedAt: T0,
    });
    const pending = lifecycle.submit(lifecycle.validate(order, T0).order, T0).order;
    const cancelled = lifecycle.cancel(pending, T0).order;
    expect(() => lifecycle.transition(cancelled, 'FILLED', T0, 'x')).toThrow(
      OrderInvalidStateError,
    );
  });
});

describe('US206 fill generation invariants', () => {
  it('applies partial then complete fill', () => {
    const created = createOrder({
      id: 'o1',
      portfolioId: 'p1',
      symbol: 'SOL-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '4',
      requestedPrice: '50',
      createdAt: T0,
      updatedAt: T0,
    });
    const pending = { ...created, status: 'PENDING' as const };
    const partial = applyOrderFill(pending, {
      quantity: '1',
      price: '49',
      updatedAt: T0,
    });
    expect(partial.order.status).toBe('PARTIALLY_FILLED');
    expect(partial.order.filledQuantity).toBe('1');
    expect(partial.order.remainingQuantity).toBe('3');
    expect(partial.order.executedPrice).toBe('49');

    const full = applyOrderFill(partial.order, {
      quantity: '3',
      price: '51',
      updatedAt: T0,
    });
    expect(full.order.status).toBe('FILLED');
    expect(full.order.remainingQuantity).toBe('0');
    expect(full.order.filledQuantity).toBe('4');
    // VWAP: (1*49 + 3*51) / 4 = 50.5
    expect(full.order.executedPrice).toBe('50.5');
  });
});
