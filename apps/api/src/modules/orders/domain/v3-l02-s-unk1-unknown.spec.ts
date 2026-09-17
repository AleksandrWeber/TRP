/**
 * V3-L02-S-UNK1 — Durable UNKNOWN / pre-send / reconciliation domain tests.
 * No live venue I/O. Claim ≠ submit. UNKNOWN ≠ REJECTED/CANCELLED/success.
 */

import { describe, expect, it } from 'vitest';
import { RiskDecisionStatus } from '../../risk';
import {
  applyOrderReconciliation,
  createOrder,
  markOrderReadyToTransmit,
  markOrderSubmissionUnknown,
  markOrderTransmitted,
  transitionOrder,
  type Order,
  type OrderTransitionInput,
} from './order';
import { createOrderIntent, OrderSide, OrderType } from './order-intent';
import { SubmissionPhase } from './order-execution-state';
import { canTransitionOrder, OrderStatus } from './order-status';

const t0 = '2026-09-17T14:00:00.000Z';

function proposed(overrides?: { workspaceId?: string; clientOrderId?: string }): Order {
  const clientOrderId = overrides?.clientOrderId ?? 'unk1-order-1';
  return createOrder(
    createOrderIntent({
      clientOrderId,
      idempotencyKey: clientOrderId,
      workspaceId: overrides?.workspaceId ?? 'workspace-1',
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
    occurredAt: `2026-09-17T14:00:${String(Math.min(next, 59)).padStart(2, '0')}.000Z`,
    recordedAt: `2026-09-17T14:00:${String(Math.min(next, 59)).padStart(2, '0')}.100Z`,
    ...extra,
  });
}

function toExecutable(order: Order = proposed()): Order {
  let current = move(order, OrderStatus.RISK_PENDING);
  current = move(current, OrderStatus.APPROVED, {
    riskDecision: Object.freeze({
      id: 'risk-1',
      status: RiskDecisionStatus.APPROVED,
      workspaceId: current.workspaceId,
      orderId: current.id,
      intentHash: current.intent.intentHash,
      policyId: 'm2-baseline-paper-risk',
      policyVersion: 1,
      policyHash: 'policy-hash',
      inputHash: 'input-hash',
      evaluatedAt: '2026-09-17T14:00:01.000Z',
      expiresAt: '2026-09-17T15:00:00.000Z',
    }),
  });
  current = move(current, OrderStatus.RESERVED, { reservationId: 'reservation-1' });
  return move(current, OrderStatus.EXECUTABLE);
}

describe('V3-L02-S-UNK1 order UNKNOWN / pre-send / reconciliation', () => {
  it('UNK1-01 UNKNOWN is first-class and durable on the aggregate', () => {
    expect(canTransitionOrder(OrderStatus.EXECUTABLE, OrderStatus.UNKNOWN)).toBe(true);
    expect(canTransitionOrder(OrderStatus.SUBMITTED, OrderStatus.UNKNOWN)).toBe(true);
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.ACKNOWLEDGED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.REJECTED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.FILLED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.UNKNOWN)).toBe(true);
  });

  it('UNK1-05 pre-send marker is durable and ≠ venue submission', () => {
    const executable = toExecutable();
    const ready = markOrderReadyToTransmit(executable, {
      eventType: 'OrderPreSendMarked',
      actorId: 'engine',
      occurredAt: '2026-09-17T14:01:00.000Z',
      recordedAt: '2026-09-17T14:01:00.100Z',
    });
    expect(ready.status).toBe(OrderStatus.EXECUTABLE);
    expect(ready.execution.submissionPhase).toBe(SubmissionPhase.READY_TO_TRANSMIT);
    expect(ready.execution.venueClientOrderId).toBe(executable.intent.clientOrderId);
    expect(ready.execution.readyToTransmitAt).toBe('2026-09-17T14:01:00.000Z');
  });

  it('crash-window T3→T4: transmitted then UNKNOWN without inventing fill', () => {
    let order = toExecutable();
    order = markOrderReadyToTransmit(order, {
      eventType: 'OrderPreSendMarked',
      actorId: 'engine',
      occurredAt: '2026-09-17T14:01:00.000Z',
      recordedAt: '2026-09-17T14:01:00.100Z',
    });
    order = markOrderTransmitted(order, {
      eventType: 'OrderTransmitMarked',
      actorId: 'engine',
      occurredAt: '2026-09-17T14:01:01.000Z',
      recordedAt: '2026-09-17T14:01:01.100Z',
    });
    expect(order.execution.submissionPhase).toBe(SubmissionPhase.TRANSMITTED);
    expect(order.status).toBe(OrderStatus.EXECUTABLE);

    order = markOrderSubmissionUnknown(order, {
      eventType: 'OrderUnknown',
      actorId: 'engine',
      ambiguityReason: 'timeout_after_possible_transmit',
      occurredAt: '2026-09-17T14:01:02.000Z',
      recordedAt: '2026-09-17T14:01:02.100Z',
    });
    expect(order.status).toBe(OrderStatus.UNKNOWN);
    expect(order.execution.reconciliationRequired).toBe(true);
    expect(order.filledQuantity).toBe('0');
    expect(order.rejectionReason).toBeNull();
  });

  it('UNK1-02/08 UNKNOWN cannot silently become success; unresolved keeps UNKNOWN', () => {
    let order = markOrderSubmissionUnknown(toExecutable(), {
      eventType: 'OrderUnknown',
      actorId: 'engine',
      ambiguityReason: 'ambiguous',
      occurredAt: '2026-09-17T14:02:00.000Z',
      recordedAt: '2026-09-17T14:02:00.100Z',
    });
    order = applyOrderReconciliation(
      order,
      { kind: 'unresolved', reason: 'venue_query_inconclusive' },
      {
        eventType: 'OrderReconcileUnresolved',
        actorId: 'reconciler',
        occurredAt: '2026-09-17T14:03:00.000Z',
        recordedAt: '2026-09-17T14:03:00.100Z',
      },
    );
    expect(order.status).toBe(OrderStatus.UNKNOWN);
    expect(order.execution.reconcileAttempts).toBe(1);
    expect(order.execution.lastReconcileResult).toBe('unresolved');
    expect(order.execution.reconciliationRequired).toBe(true);
  });

  it('UNK1-04/09 known rejection and authoritative ACK resolve UNKNOWN', () => {
    let order = markOrderSubmissionUnknown(toExecutable(), {
      eventType: 'OrderUnknown',
      actorId: 'engine',
      ambiguityReason: 'ambiguous',
      occurredAt: '2026-09-17T14:02:00.000Z',
      recordedAt: '2026-09-17T14:02:00.100Z',
    });
    const rejected = applyOrderReconciliation(
      order,
      { kind: 'rejected', reason: 'venue_rejected_invalid_qty' },
      {
        eventType: 'OrderReconcileRejected',
        actorId: 'reconciler',
        occurredAt: '2026-09-17T14:03:00.000Z',
        recordedAt: '2026-09-17T14:03:00.100Z',
      },
    );
    expect(rejected.status).toBe(OrderStatus.REJECTED);
    expect(rejected.rejectionReason).toBe('venue_rejected_invalid_qty');

    order = markOrderSubmissionUnknown(toExecutable(proposed({ clientOrderId: 'unk1-order-2' })), {
      eventType: 'OrderUnknown',
      actorId: 'engine',
      ambiguityReason: 'ambiguous',
      occurredAt: '2026-09-17T14:02:00.000Z',
      recordedAt: '2026-09-17T14:02:00.100Z',
    });
    const ack = applyOrderReconciliation(
      order,
      { kind: 'acknowledged', adapterOrderId: 'venue-1', venueOrderId: 'v-1' },
      {
        eventType: 'OrderReconcileAcknowledged',
        actorId: 'reconciler',
        occurredAt: '2026-09-17T14:03:00.000Z',
        recordedAt: '2026-09-17T14:03:00.100Z',
      },
    );
    expect(ack.status).toBe(OrderStatus.ACKNOWLEDGED);
    expect(ack.execution.reconciliationRequired).toBe(false);
    expect(ack.execution.submissionPhase).toBe(SubmissionPhase.COMPLETED);
  });

  it('UNK1-11 filled reconciliation updates status only (no automatic position/settlement)', () => {
    const order = markOrderSubmissionUnknown(
      toExecutable(proposed({ clientOrderId: 'unk1-fill' })),
      {
        eventType: 'OrderUnknown',
        actorId: 'engine',
        ambiguityReason: 'ambiguous',
        occurredAt: '2026-09-17T14:02:00.000Z',
        recordedAt: '2026-09-17T14:02:00.100Z',
      },
    );
    const filled = applyOrderReconciliation(
      order,
      { kind: 'filled', fillQuantity: '2', adapterOrderId: 'venue-fill-1' },
      {
        eventType: 'OrderReconcileFilled',
        actorId: 'reconciler',
        occurredAt: '2026-09-17T14:03:00.000Z',
        recordedAt: '2026-09-17T14:03:00.100Z',
      },
    );
    expect(filled.status).toBe(OrderStatus.FILLED);
    expect(filled.filledQuantity).toBe('2');
    // No ledger/position side effects in domain — status marker only.
    expect(filled.reservationId).toBe('reservation-1');
  });

  it('UNK1-07 workspace-scoped idempotency identity remains on intent', () => {
    const a = proposed({ workspaceId: 'ws-a', clientOrderId: 'same-client' });
    const b = proposed({ workspaceId: 'ws-b', clientOrderId: 'same-client' });
    expect(a.id).not.toBe(b.id);
    expect(a.intent.idempotencyKey).toBe('same-client');
    expect(b.workspaceId).toBe('ws-b');
  });

  it('Case E restart: UNKNOWN metadata survives freeze/restore of aggregate snapshot', () => {
    const unknown = markOrderSubmissionUnknown(toExecutable(), {
      eventType: 'OrderUnknown',
      actorId: 'engine',
      ambiguityReason: 'network_reset',
      occurredAt: '2026-09-17T14:02:00.000Z',
      recordedAt: '2026-09-17T14:02:00.100Z',
    });
    const snapshot = JSON.parse(JSON.stringify(unknown)) as Order;
    expect(snapshot.status).toBe(OrderStatus.UNKNOWN);
    expect(snapshot.execution.reconciliationRequired).toBe(true);
    expect(snapshot.execution.ambiguityReason).toBe('network_reset');
  });

  it('forbids inventing REJECTED from ambiguity without evidence', () => {
    expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.PROPOSED)).toBe(false);
    const unknown = markOrderSubmissionUnknown(
      toExecutable(proposed({ clientOrderId: 'no-infer' })),
      {
        eventType: 'OrderUnknown',
        actorId: 'engine',
        ambiguityReason: 'timeout',
        occurredAt: '2026-09-17T14:02:00.000Z',
        recordedAt: '2026-09-17T14:02:00.100Z',
      },
    );
    expect(unknown.status).not.toBe(OrderStatus.REJECTED);
    expect(unknown.status).not.toBe(OrderStatus.CANCELLED);
    expect(unknown.status).not.toBe(OrderStatus.FILLED);
  });
});
