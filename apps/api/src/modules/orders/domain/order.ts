import { FinancialDecimal } from '../../financial';
import {
  RiskDecisionStatus,
  type ApprovedRiskDecisionReference,
} from '../../risk/domain/risk-decision';
import type { OrderIntent } from './order-intent';
import {
  DEFAULT_ORDER_EXECUTION_STATE,
  SubmissionPhase,
  type OrderExecutionState,
  type OrderReconciliationEvidence,
} from './order-execution-state';
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
  riskDecision: ApprovedRiskDecisionReference | null;
  reservationId: string | null;
  adapterOrderId: string | null;
  rejectionReason: string | null;
  /** Technical submission/reconcile substrate (V3-L02-S-UNK1). Not a second business SoT. */
  execution: OrderExecutionState;
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
  riskDecision?: ApprovedRiskDecisionReference;
  reservationId?: string;
  adapterOrderId?: string;
  execution?: Partial<OrderExecutionState>;
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
    riskDecision: null,
    reservationId: null,
    adapterOrderId: null,
    rejectionReason: null,
    execution: DEFAULT_ORDER_EXECUTION_STATE,
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

  const riskDecision =
    input.riskDecision !== undefined ? Object.freeze(input.riskDecision) : order.riskDecision;
  const riskDecisionId = riskDecision?.id ?? null;
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
  const execution = mergeExecution(
    order.execution,
    input.execution,
    input.toStatus,
    input.occurredAt,
  );
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
    riskDecision,
    reservationId,
    adapterOrderId,
    rejectionReason,
    execution,
    lifecycle: Object.freeze([...order.lifecycle, entry]),
    recordedAt: input.recordedAt,
  });
}

/**
 * Idempotent Orders-owned cancellation request (US163).
 * Adapter-facing cancellation is intentionally not performed by the aggregate.
 */
export function requestOrderCancellation(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus'>,
): Order {
  if (order.status === OrderStatus.CANCEL_PENDING || order.status === OrderStatus.CANCELLED) {
    return order;
  }
  if (order.status === OrderStatus.FILLED || order.status === OrderStatus.REJECTED) {
    throw new Error(`order cannot be cancelled from ${order.status}`);
  }
  return transitionOrder(order, { ...input, toStatus: OrderStatus.CANCEL_PENDING });
}

export function completeOrderCancellation(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus'>,
): Order {
  if (order.status === OrderStatus.CANCELLED) return order;
  if (order.status !== OrderStatus.CANCEL_PENDING) {
    throw new Error(`order cancellation cannot complete from ${order.status}`);
  }
  return transitionOrder(order, { ...input, toStatus: OrderStatus.CANCELLED });
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
    execution: order.execution,
    lifecycle: Object.freeze([...order.lifecycle, entry]),
    recordedAt: input.recordedAt,
  });
}

/**
 * Persist local pre-send marker before irreversible venue I/O (AD-L02-11).
 * Does not change business status. Pre-send ≠ venue submission evidence.
 */
export function markOrderReadyToTransmit(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus' | 'execution'> & {
    humanStartProofId?: string | null;
    venueClientOrderId?: string | null;
  },
): Order {
  assertNotTerminal(order);
  if (order.status === OrderStatus.UNKNOWN) {
    throw new Error('cannot mark ready_to_transmit on UNKNOWN order');
  }
  if (order.execution.submissionPhase === SubmissionPhase.READY_TO_TRANSMIT) {
    return order;
  }
  if (order.execution.submissionPhase !== SubmissionPhase.NONE) {
    throw new Error(
      `cannot mark ready_to_transmit from submission phase ${order.execution.submissionPhase}`,
    );
  }
  return appendExecutionLifecycle(order, {
    ...input,
    eventType: input.eventType || 'OrderPreSendMarked',
    execution: {
      submissionPhase: SubmissionPhase.READY_TO_TRANSMIT,
      readyToTransmitAt: input.occurredAt,
      venueClientOrderId: input.venueClientOrderId ?? order.intent.clientOrderId,
      humanStartProofId:
        input.humanStartProofId !== undefined
          ? input.humanStartProofId
          : order.execution.humanStartProofId,
    },
  });
}

/**
 * Persist that the application crossed the local I/O boundary (transmit may have occurred).
 * Still not evidence of venue acceptance. Does not change business status alone.
 */
export function markOrderTransmitted(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus' | 'execution'>,
): Order {
  assertNotTerminal(order);
  if (
    order.execution.submissionPhase !== SubmissionPhase.READY_TO_TRANSMIT &&
    order.execution.submissionPhase !== SubmissionPhase.TRANSMITTED
  ) {
    throw new Error(
      `cannot mark transmitted from submission phase ${order.execution.submissionPhase}`,
    );
  }
  if (order.execution.submissionPhase === SubmissionPhase.TRANSMITTED) {
    return order;
  }
  return appendExecutionLifecycle(order, {
    ...input,
    eventType: input.eventType || 'OrderTransmitMarked',
    execution: {
      submissionPhase: SubmissionPhase.TRANSMITTED,
      transmittedAt: input.occurredAt,
    },
  });
}

/**
 * Mark ambiguous venue outcome as UNKNOWN. Never invents REJECTED/CANCELLED/FILLED.
 */
export function markOrderSubmissionUnknown(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus' | 'execution'> & {
    ambiguityReason: string;
  },
): Order {
  if (order.status === OrderStatus.UNKNOWN) {
    return appendExecutionLifecycle(order, {
      ...input,
      eventType: input.eventType || 'OrderUnknownPersisted',
      execution: {
        reconciliationRequired: true,
        ambiguityReason: required(input.ambiguityReason, 'ambiguity reason'),
        unknownEnteredAt: order.execution.unknownEnteredAt ?? input.occurredAt,
      },
    });
  }
  return transitionOrder(order, {
    ...input,
    toStatus: OrderStatus.UNKNOWN,
    eventType: input.eventType || 'OrderUnknown',
    reason: input.ambiguityReason,
    adapterOrderId: input.adapterOrderId,
    execution: {
      submissionPhase:
        order.execution.submissionPhase === SubmissionPhase.NONE
          ? SubmissionPhase.TRANSMITTED
          : order.execution.submissionPhase,
      reconciliationRequired: true,
      unknownEnteredAt: input.occurredAt,
      ambiguityReason: required(input.ambiguityReason, 'ambiguity reason'),
    },
  });
}

/**
 * Resolve UNKNOWN only from authoritative evidence. Unresolved keeps UNKNOWN.
 * Does not create fills/positions — filled evidence only updates order status/qty marker.
 */
export function applyOrderReconciliation(
  order: Order,
  evidence: OrderReconciliationEvidence,
  input: Omit<OrderTransitionInput, 'toStatus' | 'execution'>,
): Order {
  if (order.status !== OrderStatus.UNKNOWN) {
    throw new Error(`reconciliation applies only to UNKNOWN orders (got ${order.status})`);
  }
  const attempts = order.execution.reconcileAttempts + 1;
  const baseExecution: Partial<OrderExecutionState> = {
    lastReconcileAt: input.occurredAt,
    reconcileAttempts: attempts,
  };

  if (evidence.kind === 'unresolved') {
    return transitionOrder(order, {
      ...input,
      toStatus: OrderStatus.UNKNOWN,
      eventType: input.eventType || 'OrderReconcileUnresolved',
      reason: evidence.reason ?? order.execution.ambiguityReason ?? undefined,
      execution: {
        ...baseExecution,
        reconciliationRequired: true,
        lastReconcileResult: 'unresolved',
      },
    });
  }

  if (evidence.kind === 'acknowledged') {
    return transitionOrder(order, {
      ...input,
      toStatus: OrderStatus.ACKNOWLEDGED,
      adapterOrderId: evidence.adapterOrderId ?? order.adapterOrderId ?? undefined,
      eventType: input.eventType || 'OrderReconcileAcknowledged',
      execution: {
        ...baseExecution,
        submissionPhase: SubmissionPhase.COMPLETED,
        completedAt: input.occurredAt,
        reconciliationRequired: false,
        lastReconcileResult: 'acknowledged',
        venueOrderId: evidence.venueOrderId ?? order.execution.venueOrderId,
        ambiguityReason: null,
      },
    });
  }

  if (evidence.kind === 'rejected') {
    return transitionOrder(order, {
      ...input,
      toStatus: OrderStatus.REJECTED,
      reason: evidence.reason,
      eventType: input.eventType || 'OrderReconcileRejected',
      execution: {
        ...baseExecution,
        submissionPhase: SubmissionPhase.COMPLETED,
        completedAt: input.occurredAt,
        reconciliationRequired: false,
        lastReconcileResult: 'rejected',
        ambiguityReason: null,
      },
    });
  }

  if (evidence.kind === 'cancelled') {
    return transitionOrder(order, {
      ...input,
      toStatus: OrderStatus.CANCELLED,
      eventType: input.eventType || 'OrderReconcileCancelled',
      execution: {
        ...baseExecution,
        submissionPhase: SubmissionPhase.COMPLETED,
        completedAt: input.occurredAt,
        reconciliationRequired: false,
        lastReconcileResult: 'cancelled',
        ambiguityReason: null,
      },
    });
  }

  // filled — status only; Positions/Ledger must not auto-settle from UNKNOWN alone.
  const amount = FinancialDecimal.from(evidence.fillQuantity).assertPositive('fill quantity');
  const ordered = FinancialDecimal.from(order.intent.quantity);
  if (amount.compare(ordered) !== 0) {
    throw new Error('UNKNOWN fill reconciliation requires exact order quantity evidence');
  }
  const filled = transitionOrder(order, {
    ...input,
    toStatus: OrderStatus.FILLED,
    adapterOrderId: evidence.adapterOrderId ?? order.adapterOrderId ?? undefined,
    eventType: input.eventType || 'OrderReconcileFilled',
    execution: {
      ...baseExecution,
      submissionPhase: SubmissionPhase.COMPLETED,
      completedAt: input.occurredAt,
      reconciliationRequired: false,
      lastReconcileResult: 'filled',
      venueOrderId: evidence.venueOrderId ?? order.execution.venueOrderId,
      ambiguityReason: null,
    },
  });
  return Object.freeze({ ...filled, filledQuantity: amount.toString() });
}

function appendExecutionLifecycle(
  order: Order,
  input: Omit<OrderTransitionInput, 'toStatus'> & { execution: Partial<OrderExecutionState> },
): Order {
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
    execution: mergeExecution(order.execution, input.execution, order.status, input.occurredAt),
    adapterOrderId:
      input.adapterOrderId !== undefined
        ? required(input.adapterOrderId, 'adapter order id')
        : order.adapterOrderId,
    lifecycle: Object.freeze([...order.lifecycle, entry]),
    recordedAt: input.recordedAt,
  });
}

function mergeExecution(
  current: OrderExecutionState,
  patch: Partial<OrderExecutionState> | undefined,
  toStatus: OrderStatus,
  occurredAt: string,
): OrderExecutionState {
  const next: OrderExecutionState = {
    ...current,
    ...(patch ?? {}),
  };
  if (toStatus === OrderStatus.UNKNOWN) {
    return Object.freeze({
      ...next,
      reconciliationRequired: true,
      unknownEnteredAt: next.unknownEnteredAt ?? occurredAt,
    });
  }
  if (
    toStatus === OrderStatus.ACKNOWLEDGED ||
    toStatus === OrderStatus.FILLED ||
    toStatus === OrderStatus.REJECTED ||
    toStatus === OrderStatus.CANCELLED
  ) {
    return Object.freeze({
      ...next,
      submissionPhase: patch?.submissionPhase ?? SubmissionPhase.COMPLETED,
      completedAt: patch?.completedAt ?? occurredAt,
      reconciliationRequired: patch?.reconciliationRequired ?? false,
    });
  }
  return Object.freeze(next);
}

function assertNotTerminal(order: Order): void {
  if (TERMINAL_ORDER_STATUSES.has(order.status)) {
    throw new Error(`order is terminal: ${order.status}`);
  }
}

function validateTransitionReferences(order: Order, input: OrderTransitionInput): void {
  if (input.toStatus === OrderStatus.APPROVED) {
    const decision = input.riskDecision;
    if (
      !decision ||
      decision.status !== RiskDecisionStatus.APPROVED ||
      decision.workspaceId !== order.workspaceId ||
      decision.orderId !== order.id ||
      decision.intentHash !== order.intent.intentHash ||
      !isCanonicalIso(decision.evaluatedAt) ||
      !isCanonicalIso(decision.expiresAt) ||
      Date.parse(decision.expiresAt) <= Date.parse(decision.evaluatedAt)
    ) {
      throw new Error('approved order requires an exact approved Risk Decision');
    }
  }
  if (input.toStatus === OrderStatus.RESERVED && !input.reservationId) {
    throw new Error('reserved order requires a reservation id');
  }
  if (
    (input.toStatus === OrderStatus.EXECUTABLE || input.toStatus === OrderStatus.SUBMITTED) &&
    !order.riskDecision
  ) {
    throw new Error('executable order requires a mandatory Risk Decision');
  }
  if (
    (input.toStatus === OrderStatus.EXECUTABLE || input.toStatus === OrderStatus.SUBMITTED) &&
    order.riskDecision &&
    Date.parse(input.occurredAt) >= Date.parse(order.riskDecision.expiresAt)
  ) {
    throw new Error('executable order Risk Decision is expired');
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

function isCanonicalIso(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}
