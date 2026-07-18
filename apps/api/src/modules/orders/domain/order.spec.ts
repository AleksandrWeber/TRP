import { describe, expect, it } from 'vitest';
import {
  applyOrderFill,
  createOrder,
  transitionOrder,
  type Order,
  type OrderTransitionInput,
} from './order';
import { RiskDecisionStatus } from '../../risk';
import { createOrderIntent, OrderSide, OrderType } from './order-intent';
import { canTransitionOrder, OrderStatus } from './order-status';

const t0 = '2026-07-18T17:10:00.000Z';

function proposed(): Order {
  return createOrder(
    createOrderIntent({
      clientOrderId: 'order-state-1',
      idempotencyKey: 'order-state-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      tradingSessionId: 'session-1',
      sessionFencingToken: 1,
      mode: 'paper',
      origin: 'manual',
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: '2',
      marketCheckpoint: { streamId: 'stream-1', sequence: 1, eventId: 'event-1' },
      actorId: 'trader-1',
      occurredAt: t0,
      recordedAt: t0,
    }),
  );
}

function move(
  order: Order,
  toStatus: OrderStatus,
  extra: Partial<OrderTransitionInput> = {},
): Order {
  const next = order.version + 1;
  return transitionOrder(order, {
    toStatus,
    eventType: `Order${toStatus}`,
    actorId: 'orders-service',
    occurredAt: `2026-07-18T17:10:${String(next).padStart(2, '0')}.000Z`,
    recordedAt: `2026-07-18T17:10:${String(next).padStart(2, '0')}.100Z`,
    ...extra,
  });
}

function approvedRisk(order: Order, expiresAt = '2026-07-18T17:11:00.000Z') {
  return Object.freeze({
    id: 'risk-1',
    status: RiskDecisionStatus.APPROVED,
    workspaceId: order.workspaceId,
    orderId: order.id,
    intentHash: order.intent.intentHash,
    policyId: 'm2-baseline-paper-risk',
    policyVersion: 1,
    policyHash: 'policy-hash',
    inputHash: 'input-hash',
    evaluatedAt: '2026-07-18T17:10:01.000Z',
    expiresAt,
  });
}

describe('US160 — Order aggregate and state machine', () => {
  it('owns the explicit lifecycle and immutable history', () => {
    let order = proposed();
    order = move(order, OrderStatus.RISK_PENDING);
    order = move(order, OrderStatus.APPROVED, { riskDecision: approvedRisk(order) });
    order = move(order, OrderStatus.RESERVED, { reservationId: 'reservation-1' });
    order = move(order, OrderStatus.EXECUTABLE);
    order = move(order, OrderStatus.SUBMITTED, { adapterOrderId: 'paper-order-1' });
    order = move(order, OrderStatus.ACKNOWLEDGED);

    expect(order.lifecycle.map((entry) => entry.toStatus)).toEqual([
      OrderStatus.PROPOSED,
      OrderStatus.RISK_PENDING,
      OrderStatus.APPROVED,
      OrderStatus.RESERVED,
      OrderStatus.EXECUTABLE,
      OrderStatus.SUBMITTED,
      OrderStatus.ACKNOWLEDGED,
    ]);
    expect(Object.isFrozen(order.lifecycle)).toBe(true);
    expect(Object.isFrozen(order.lifecycle[0])).toBe(true);
  });

  it('rejects invalid and terminal transitions and requires durable references', () => {
    expect(canTransitionOrder(OrderStatus.PROPOSED, OrderStatus.SUBMITTED)).toBe(false);
    expect(() => move(proposed(), OrderStatus.SUBMITTED)).toThrow(/invalid order transition/);

    const riskPending = move(proposed(), OrderStatus.RISK_PENDING);
    expect(() => move(riskPending, OrderStatus.APPROVED)).toThrow(/approved Risk Decision/);
    expect(() =>
      move(riskPending, OrderStatus.APPROVED, {
        riskDecision: { ...approvedRisk(riskPending), intentHash: 'other-intent' },
      }),
    ).toThrow(/exact approved Risk Decision/);

    const rejected = move(riskPending, OrderStatus.REJECTED, { reason: 'risk rejected' });
    expect(() => move(rejected, OrderStatus.CANCEL_PENDING)).toThrow(/terminal/);
  });

  it('never permits filled quantity to exceed ordered quantity', () => {
    let order = proposed();
    order = move(order, OrderStatus.RISK_PENDING);
    order = move(order, OrderStatus.APPROVED, { riskDecision: approvedRisk(order) });
    order = move(order, OrderStatus.RESERVED, { reservationId: 'reservation-1' });
    order = move(order, OrderStatus.EXECUTABLE);
    order = move(order, OrderStatus.SUBMITTED, { adapterOrderId: 'paper-order-1' });
    order = move(order, OrderStatus.ACKNOWLEDGED);

    const partial = applyOrderFill(order, '0.75', {
      eventType: 'OrderFillApplied',
      actorId: 'orders-service',
      occurredAt: '2026-07-18T17:10:10.000Z',
      recordedAt: '2026-07-18T17:10:10.100Z',
    });
    expect(partial.filledQuantity).toBe('0.75');
    expect(partial.status).toBe(OrderStatus.ACKNOWLEDGED);
    expect(() =>
      applyOrderFill(partial, '1.26', {
        eventType: 'OrderFillApplied',
        actorId: 'orders-service',
        occurredAt: '2026-07-18T17:10:11.000Z',
        recordedAt: '2026-07-18T17:10:11.100Z',
      }),
    ).toThrow(/cannot exceed/);

    const filled = applyOrderFill(partial, '1.25', {
      eventType: 'OrderFilled',
      actorId: 'orders-service',
      occurredAt: '2026-07-18T17:10:12.000Z',
      recordedAt: '2026-07-18T17:10:12.100Z',
    });
    expect(filled.status).toBe(OrderStatus.FILLED);
    expect(filled.filledQuantity).toBe('2');
  });

  it('fails closed when mandatory Risk approval is missing or expired', () => {
    let order = move(proposed(), OrderStatus.RISK_PENDING);
    order = move(order, OrderStatus.APPROVED, {
      riskDecision: approvedRisk(order, '2026-07-18T17:10:03.000Z'),
    });
    order = move(order, OrderStatus.RESERVED, { reservationId: 'reservation-1' });
    expect(() => move(order, OrderStatus.EXECUTABLE)).toThrow(/expired/);
  });
});
