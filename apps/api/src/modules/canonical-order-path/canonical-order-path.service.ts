import { Inject, Injectable } from '@nestjs/common';
import {
  ExecutionEngineService,
  type ExecutionMarketState,
  type ExecutionResult,
} from '../execution-engine';
import {
  CASH_RESERVATION_PORT,
  type CashReservationPort,
} from '../ledger/ports/cash-reservation.port';
import type { Order } from '../orders/domain/order';
import { OrderStatus } from '../orders/domain/order-status';
import { OrderService } from '../orders/order.service';
import {
  approvedRiskDecisionReference,
  RiskDecisionService,
  RiskDecisionStatus,
  type BaselineRiskEvaluationInput,
  type RiskDecision,
} from '../risk';

export const CANONICAL_ORDER_PATH_PORT = Symbol('CANONICAL_ORDER_PATH_PORT');

export type CanonicalRiskSnapshot = Omit<
  BaselineRiskEvaluationInput,
  'orderId' | 'intent' | 'evaluatedAt' | 'recordedAt' | 'actorId' | 'correlationId'
>;

export type AdvanceCanonicalOrderCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  actorId: string;
  correlationId?: string;
  evaluatedAt: string;
  recordedAt: string;
  risk: CanonicalRiskSnapshot;
  reservation: Readonly<{
    currency: string;
    amount: string;
    idempotencyKey?: string;
  }>;
  /**
   * When true, the Order must be strategy-origin with an immutable Signal Intent
   * reference (US222 strategy path entry). Manual regression callers set false.
   */
  requireStrategyOrigin?: boolean;
}>;

export type CanonicalAdvanceOutcome = 'executable' | 'rejected' | 'already_advanced';

export type CanonicalOrderAdvanceResult = Readonly<{
  order: Order;
  riskDecision: RiskDecision | null;
  outcome: CanonicalAdvanceOutcome;
}>;

export type RunCanonicalExecutionPathCommand = AdvanceCanonicalOrderCommand &
  Readonly<{
    marketState: ExecutionMarketState;
    occurredAt: string;
  }>;

export type CanonicalExecutionPathOutcome =
  'filled' | 'resting' | 'rejected' | 'already_executed' | 'executable_without_submit';

export type CanonicalExecutionPathResult = Readonly<{
  order: Order;
  riskDecision: RiskDecision | null;
  execution: ExecutionResult | null;
  outcome: CanonicalExecutionPathOutcome;
}>;

/**
 * Canonical Order → Risk → Reservation → Executable → Execution Engine path
 * (US222 / ADR-012). Strategy-origin and manual Orders share this path after
 * proposal. No strategy-specific execution fork; Runtime is never imported.
 */
@Injectable()
export class CanonicalOrderPathService {
  constructor(
    @Inject(OrderService)
    private readonly orders: OrderService,
    @Inject(RiskDecisionService)
    private readonly risk: RiskDecisionService,
    @Inject(CASH_RESERVATION_PORT)
    private readonly cashReservations: CashReservationPort,
    @Inject(ExecutionEngineService)
    private readonly execution: ExecutionEngineService,
  ) {}

  /**
   * Advances a PROPOSED Order through mandatory Risk + cash reservation to
   * EXECUTABLE (or REJECTED). Idempotent for already-advanced Orders.
   */
  async advanceToExecutable(
    command: AdvanceCanonicalOrderCommand,
  ): Promise<CanonicalOrderAdvanceResult> {
    let current = await this.requireOrder(command.workspaceId, command.orderId);
    assertStrategyMetadata(current, command.requireStrategyOrigin === true);

    if (current.status === OrderStatus.REJECTED) {
      return freezeAdvance(current, null, 'rejected');
    }
    if (current.status === OrderStatus.EXECUTABLE || isPostExecutable(current.status)) {
      return freezeAdvance(current, null, 'already_advanced');
    }

    if (current.status === OrderStatus.PROPOSED) {
      current = await this.transition(
        current,
        command,
        OrderStatus.RISK_PENDING,
        'OrderRiskPending',
      );
    }

    let decision: RiskDecision | null = null;

    if (current.status === OrderStatus.RISK_PENDING) {
      decision = await this.risk.evaluate({
        ...command.risk,
        orderId: current.id,
        intent: current.intent,
        evaluatedAt: command.evaluatedAt,
        recordedAt: command.recordedAt,
        actorId: command.actorId,
        correlationId: command.correlationId,
      });

      if (decision.status === RiskDecisionStatus.REJECTED) {
        current = await this.transition(current, command, OrderStatus.REJECTED, 'OrderRejected', {
          reason: decision.reasons[0] ?? 'risk_rejected',
        });
        assertStrategyMetadata(current, command.requireStrategyOrigin === true);
        return freezeAdvance(current, decision, 'rejected');
      }

      current = await this.transition(current, command, OrderStatus.APPROVED, 'OrderApproved', {
        riskDecision: approvedRiskDecisionReference(decision),
      });
    }

    if (current.status === OrderStatus.APPROVED) {
      const reservation = await this.cashReservations.reserveCash({
        workspaceId: current.workspaceId,
        paperAccountId: current.intent.paperAccountId,
        orderId: current.id,
        idempotencyKey:
          command.reservation.idempotencyKey ?? `reserve:${current.intent.idempotencyKey}`,
        currency: command.reservation.currency,
        amount: command.reservation.amount,
        actorId: command.actorId,
        correlationId: command.correlationId,
        recordedAt: command.recordedAt,
      });
      current = await this.transition(current, command, OrderStatus.RESERVED, 'OrderReserved', {
        reservationId: reservation.id,
      });
    }

    if (current.status === OrderStatus.RESERVED) {
      current = await this.transition(current, command, OrderStatus.EXECUTABLE, 'OrderExecutable');
    }

    if (current.status !== OrderStatus.EXECUTABLE) {
      throw new Error(`canonical path failed to reach executable from ${current.status}`);
    }

    assertStrategyMetadata(current, command.requireStrategyOrigin === true);
    return freezeAdvance(current, decision, 'executable');
  }

  /**
   * Full canonical path: Risk → Executable → ExecutionEngine.submit.
   * Duplicate submits reuse Execution Engine idempotency (`already_executed`).
   */
  async runCanonicalPath(
    command: RunCanonicalExecutionPathCommand,
  ): Promise<CanonicalExecutionPathResult> {
    const advanced = await this.advanceToExecutable(command);
    if (advanced.outcome === 'rejected') {
      return Object.freeze({
        order: advanced.order,
        riskDecision: advanced.riskDecision,
        execution: null,
        outcome: 'rejected',
      });
    }

    const execution = await this.execution.submit({
      workspaceId: command.workspaceId,
      orderId: command.orderId,
      actorId: command.actorId,
      correlationId: command.correlationId,
      marketState: command.marketState,
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
    });
    assertStrategyMetadata(execution.order, command.requireStrategyOrigin === true);

    return Object.freeze({
      order: execution.order,
      riskDecision: advanced.riskDecision,
      execution,
      outcome: execution.outcome === 'already_executed' ? 'already_executed' : execution.outcome,
    });
  }

  private async requireOrder(workspaceId: string, orderId: string): Promise<Order> {
    const order = await this.orders.get(workspaceId, orderId);
    if (!order) throw new Error('order not found in workspace');
    return order;
  }

  private transition(
    order: Order,
    command: AdvanceCanonicalOrderCommand,
    toStatus: OrderStatus,
    eventType: string,
    extra: {
      reason?: string;
      riskDecision?: ReturnType<typeof approvedRiskDecisionReference>;
      reservationId?: string;
    } = {},
  ): Promise<Order> {
    return this.orders.transition({
      workspaceId: command.workspaceId,
      orderId: order.id,
      expectedVersion: order.version,
      toStatus,
      eventType,
      actorId: command.actorId,
      correlationId: command.correlationId,
      reason: extra.reason,
      riskDecision: extra.riskDecision,
      reservationId: extra.reservationId,
      occurredAt: command.evaluatedAt,
      recordedAt: command.recordedAt,
    });
  }
}

function freezeAdvance(
  order: Order,
  riskDecision: RiskDecision | null,
  outcome: CanonicalAdvanceOutcome,
): CanonicalOrderAdvanceResult {
  return Object.freeze({ order, riskDecision, outcome });
}

function isPostExecutable(status: OrderStatus): boolean {
  return (
    status === OrderStatus.SUBMITTED ||
    status === OrderStatus.ACKNOWLEDGED ||
    status === OrderStatus.FILLED ||
    status === OrderStatus.CANCEL_PENDING ||
    status === OrderStatus.CANCELLED
  );
}

function assertStrategyMetadata(order: Order, required: boolean): void {
  if (!required) return;
  if (order.intent.origin !== 'strategy') {
    throw new Error('canonical strategy path requires origin strategy');
  }
  if (!order.intent.signalIntentId || !order.intent.signalIntentHash) {
    throw new Error('canonical strategy path requires immutable Signal Intent reference');
  }
}

export interface CanonicalOrderPathPort {
  advanceToExecutable(command: AdvanceCanonicalOrderCommand): Promise<CanonicalOrderAdvanceResult>;
  runCanonicalPath(
    command: RunCanonicalExecutionPathCommand,
  ): Promise<CanonicalExecutionPathResult>;
}
