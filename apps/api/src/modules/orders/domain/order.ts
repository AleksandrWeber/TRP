import { FinancialDecimal } from '../../financial';
import type { OrderIntent } from './order-intent';
import { assertOrderTransition, OrderStatus, TERMINAL_ORDER_STATUSES } from './order-status';

export const ORDER_SCHEMA_VERSION = 1;

export type OrderLifecycleEntry = Readonly<{
  sequence: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  eventType: string;
  reason: string | null;
  actorId: string;
  correlationId: string | null;
  occurredAt: string;
  recordedAt: string;
}>;

export type Order = Readonly<{
  id: string;
  workspaceId: string;
  intent: OrderIntent;
  status: OrderStatus;
  version: number;
  filledQuantity: string;
  riskDecisionId: string | null;
  reservationId: string | null;
  adapterOrderId: string | null;
  rejectionReason: string | null;
  lifecycle: ReadonlyArray<OrderLifecycleEntry>;
  createdAt: string;
  recordedAt: string;
}>;

export type OrderTransitionInput = Readonly<{
  toStatus: OrderStatus;
  eventType: string;
  actorId: string;
  correlationId?: string;
  reason?: string;
  riskDecisionId?: string;
  reservationId?: string;
  adapterOrderId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

export function createOrder(intent: OrderIntent): Order {
  const lifecycle = Object.freeze([
    lifecycleEntry({
      sequence: 1,
      fromStatus: null,
      toStatus: OrderStatus.PROPOSED,
      eventType: 'OrderProposed',
      actorId: intent.actorId,
      correlationId: intent.correlationId ?? undefined,
      occurredAt: intent.occurredAt,
      recordedAt: intent.recordedAt,
    }),
  ]);
  return Object.freeze({
    id: intent.orderId,
    workspaceId: intent.workspaceId,
    intent,
    status: OrderStatus.PROPOSED,
    version: 1,
    filledQuantity: '0',
    riskDecisionId: null,
    reservationId: null,
    adapterOrderId: null,
    rejectionReason: null,
    lifecycle,
    createdAt: intent.occurredAt,
    recordedAt: intent.recordedAt,
  });
}

/**
 * Orders-owned lifecycle transition (US160 / ADR-018 #3).
 * Callers cannot mutate the aggregate or lifecycle history in place.
 */
export function transitionOrder(order: Order, input: OrderTransitionInput): Order {
  if (TERMINAL_ORDER_STATUSES.has(order.status)) {
    throw new Error(`order is terminal: ${order.status}`);
  }
  assertOrderTransition(order.status, input.toStatus);
  assertIso(input.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');
  validateTransitionReferences(order, input);

  const riskDecisionId =
    input.riskDecisionId !== undefined
      ? required(input.riskDecisionId, 'risk decision id')
      : order.riskDecisionId;
  const reservationId =
    input.reservationId !== undefined
      ? required(input.reservationId, 'reservation id')
      : order.reservationId;
  const adapterOrderId =
    input.adapterOrderId !== undefined
      ? required(input.adapterOrderId, 'adapter order id')
      : order.adapterOrderId;
  const rejectionReason =
    input.toStatus === OrderStatus.REJECTED
      ? required(input.reason ?? '', 'rejection reason')
      : order.rejectionReason;
  const entry = lifecycleEntry({
    sequence: order.version + 1,
    fromStatus: order.status,
    toStatus: input.toStatus,
    eventType: required(input.eventType, 'event type'),
    reason: input.reason,
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  });

  return Object.freeze({
    ...order,
    status: input.toStatus,
    version: order.version + 1,
    riskDecisionId,
    reservationId,
    adapterOrderId,
    rejectionReason,
    lifecycle: Object.freeze([...order.lifecycle, entry]),
    recordedAt: input.recordedAt,
  });
}

/**
 * Apply an immutable Fill quantity. M2 permits no overfill. Partial quantity
 * remains ACKNOWLEDGED; exact completion transitions to FILLED.
 */
export function applyOrderFill(
  order: Order,
  fillQuantity: string,
  input: Omit<OrderTransitionInput, 'toStatus'>,
): Order {
  if (order.status !== OrderStatus.ACKNOWLEDGED) {
    throw new Error(`order cannot apply fill from ${order.status}`);
  }
  const amount = FinancialDecimal.from(fillQuantity).assertPositive('fill quantity');
  const total = FinancialDecimal.from(order.filledQuantity).plus(amount);
  const ordered = FinancialDecimal.from(order.intent.quantity);
  if (total.compare(ordered) > 0) throw new Error('filled quantity cannot exceed order quantity');
  if (total.equals(ordered)) {
    const filled = transitionOrder(order, { ...input, toStatus: OrderStatus.FILLED });
    return Object.freeze({ ...filled, filledQuantity: total.toString() });
  }

  assertIso(input.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');
  const entry = lifecycleEntry({
    sequence: order.version + 1,
    fromStatus: order.status,
    toStatus: order.status,
    eventType: required(input.eventType, 'event type'),
    reason: input.reason,
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  });
  return Object.freeze({
    ...order,
    version: order.version + 1,
    filledQuantity: total.toString(),
    lifecycle: Object.freeze([...order.lifecycle, entry]),
    recordedAt: input.recordedAt,
  });
}

function validateTransitionReferences(order: Order, input: OrderTransitionInput): void {
  if (input.toStatus === OrderStatus.APPROVED && !input.riskDecisionId) {
    throw new Error('approved order requires a risk decision id');
  }
  if (input.toStatus === OrderStatus.RESERVED && !input.reservationId) {
    throw new Error('reserved order requires a reservation id');
  }
  if (
    (input.toStatus === OrderStatus.EXECUTABLE || input.toStatus === OrderStatus.SUBMITTED) &&
    !order.riskDecisionId
  ) {
    throw new Error('executable order requires a risk decision id');
  }
  if (
    (input.toStatus === OrderStatus.EXECUTABLE || input.toStatus === OrderStatus.SUBMITTED) &&
    !order.reservationId
  ) {
    throw new Error('executable order requires a reservation id');
  }
  if (input.toStatus === OrderStatus.SUBMITTED && !input.adapterOrderId) {
    throw new Error('submitted order requires an adapter order id');
  }
}

function lifecycleEntry(input: {
  sequence: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  eventType: string;
  reason?: string;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}): OrderLifecycleEntry {
  assertIso(input.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');
  return Object.freeze({
    sequence: input.sequence,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    eventType: required(input.eventType, 'event type'),
    reason: optional(input.reason),
    actorId: required(input.actorId, 'actor id'),
    correlationId: optional(input.correlationId),
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function optional(value: string | undefined): string | null {
  const result = value?.trim();
  return result ? result : null;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
