import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import {
  CASH_RESERVATION_PORT,
  type CashReservationPort,
} from '../ledger/ports/cash-reservation.port';
import type { ApprovedRiskDecisionReference } from '../risk/domain/risk-decision';
import {
  PAPER_ACCOUNT_REPOSITORY,
  type PaperAccountRepository,
} from '../paper-account/persistence/paper-account.repository';
import { assertExecutionEligible } from '../trading-session/domain/execution-eligibility';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import {
  applyOrderFill,
  createOrder,
  completeOrderCancellation,
  requestOrderCancellation,
  transitionOrder,
  type Order,
  type OrderTransitionInput,
} from './domain/order';
import { createOrderIntent, type CreateOrderIntentInput } from './domain/order-intent';
import { OrderStatus } from './domain/order-status';
import { ORDER_REPOSITORY, type OrderRepository } from './persistence/order.repository';

export type CreateOrderCommand = CreateOrderIntentInput &
  Readonly<{
    /** Operational lease check only; excluded from intent identity. */
    eligibilityCheckedAt: string;
  }>;

export type TransitionOrderCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  expectedVersion: number;
  toStatus: OrderStatus;
  eventType: string;
  actorId: string;
  correlationId?: string;
  reason?: string;
  riskDecision?: ApprovedRiskDecisionReference;
  reservationId?: string;
  adapterOrderId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

export type CancelOrderCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

/**
 * Sole Order lifecycle application boundary (US159-US161 / ADR-018 #3).
 * Every create/transition commits aggregate + lifecycle history + Outbox atomically.
 */
@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepository,
    @Inject(PAPER_ACCOUNT_REPOSITORY)
    private readonly accounts: PaperAccountRepository,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(CASH_RESERVATION_PORT)
    private readonly cashReservations: CashReservationPort,
  ) {}

  async create(command: CreateOrderCommand): Promise<Order> {
    const intent = createOrderIntent(command);
    const idempotent = await this.orders.findByIdempotencyKey(
      intent.workspaceId,
      intent.idempotencyKey,
    );
    if (idempotent) {
      assertSameIntent(idempotent, intent.intentHash);
      return idempotent;
    }
    const sameClient = await this.orders.findByClientOrderId(
      intent.workspaceId,
      intent.clientOrderId,
    );
    if (sameClient) {
      assertSameIntent(sameClient, intent.intentHash);
      return sameClient;
    }

    const account = await this.accounts.findById(intent.workspaceId, intent.paperAccountId);
    if (!account || account.mode !== 'paper') {
      throw new Error('paper account not found in workspace');
    }
    const session = await this.sessions.findById(intent.workspaceId, intent.tradingSessionId);
    if (!session || session.paperAccountId !== intent.paperAccountId) {
      throw new Error('trading session not found for paper account in workspace');
    }
    assertExecutionEligible(session, intent.sessionFencingToken, command.eligibilityCheckedAt);

    const order = createOrder(intent);
    try {
      return await this.transactions.run(async (transaction) => {
        const created = await this.orders.create(order, transaction);
        await this.outbox.append(transaction, orderEnvelope(created), intent.recordedAt);
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced =
          (await this.orders.findByIdempotencyKey(intent.workspaceId, intent.idempotencyKey)) ??
          (await this.orders.findByClientOrderId(intent.workspaceId, intent.clientOrderId));
        if (raced) {
          assertSameIntent(raced, intent.intentHash);
          return raced;
        }
      }
      throw error;
    }
  }

  async transition(command: TransitionOrderCommand): Promise<Order> {
    const current = await this.orders.findById(command.workspaceId, command.orderId);
    if (!current) throw new Error('order not found in workspace');
    if (current.version !== command.expectedVersion) {
      throw new Error('order optimistic version conflict');
    }
    const transition: OrderTransitionInput = {
      toStatus: command.toStatus,
      eventType: command.eventType,
      actorId: command.actorId,
      correlationId: command.correlationId,
      reason: command.reason,
      riskDecision: command.riskDecision,
      reservationId: command.reservationId,
      adapterOrderId: command.adapterOrderId,
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
    };
    const next = transitionOrder(current, transition);
    return this.transactions.run(async (transaction) => {
      const saved = await this.orders.save(next, current.version, transaction);
      await this.outbox.append(transaction, orderEnvelope(saved), command.recordedAt);
      return saved;
    });
  }

  /**
   * Idempotent cancellation orchestration (US163).
   * Pre-submission cancellation releases cash via Ledger and completes locally.
   * Submitted/acknowledged Orders remain cancel_pending for Execution Engine
   * adapter handling and later confirmed completion.
   */
  async cancel(command: CancelOrderCommand): Promise<Order> {
    const idempotencyKey = required(command.idempotencyKey, 'idempotency key');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.orders.findById(command.workspaceId, command.orderId);
      if (!current) throw new Error('order not found in workspace');
      if (current.status === OrderStatus.CANCELLED) return current;

      const transition = {
        eventType: 'OrderCancellationRequested',
        actorId: command.actorId,
        correlationId: command.correlationId,
        reason: 'cancel_requested',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      } as const;
      const pending = requestOrderCancellation(current, transition);
      try {
        const persisted =
          pending === current ? current : await this.persistTransition(current, pending);

        // adapterOrderId is only assigned at submission. Orders never calls an
        // adapter directly; Execution Engine owns cancellation after submission.
        if (persisted.adapterOrderId !== null) return persisted;

        if (persisted.reservationId !== null) {
          await this.cashReservations.releaseCash({
            workspaceId: persisted.workspaceId,
            orderId: persisted.id,
            idempotencyKey: `${idempotencyKey}:ledger-release`,
            actorId: command.actorId,
            correlationId: command.correlationId,
            recordedAt: command.recordedAt,
          });
        }
        const cancelled = completeOrderCancellation(persisted, {
          ...transition,
          eventType: 'OrderCancelled',
          reason: 'cancelled_before_submission',
        });
        return cancelled === persisted
          ? persisted
          : await this.persistTransition(persisted, cancelled);
      } catch (error) {
        if (isOptimisticConflict(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('order cancellation concurrency limit exceeded');
  }

  /**
   * Post-submission cancellation completion invoked by the Execution Engine
   * after the adapter acknowledges cancellation (US163/US170). Orders remains
   * the sole owner of the transition and the reservation release.
   */
  async confirmCancellation(command: CancelOrderCommand): Promise<Order> {
    const idempotencyKey = required(command.idempotencyKey, 'idempotency key');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.orders.findById(command.workspaceId, command.orderId);
      if (!current) throw new Error('order not found in workspace');
      if (current.status === OrderStatus.CANCELLED) return current;
      if (current.status === OrderStatus.FILLED || current.status === OrderStatus.REJECTED) {
        throw new Error(`order cannot be cancelled from ${current.status}`);
      }

      const transition = {
        eventType: 'OrderCancellationRequested',
        actorId: command.actorId,
        correlationId: command.correlationId,
        reason: 'cancel_requested',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      } as const;
      const pending = requestOrderCancellation(current, transition);
      try {
        const persisted =
          pending === current ? current : await this.persistTransition(current, pending);
        if (persisted.reservationId !== null) {
          await this.cashReservations.releaseCash({
            workspaceId: persisted.workspaceId,
            orderId: persisted.id,
            idempotencyKey: `${idempotencyKey}:ledger-release`,
            actorId: command.actorId,
            correlationId: command.correlationId,
            recordedAt: command.recordedAt,
          });
        }
        const cancelled = completeOrderCancellation(persisted, {
          ...transition,
          eventType: 'OrderCancelled',
          reason: 'cancelled_after_submission',
        });
        return cancelled === persisted
          ? persisted
          : await this.persistTransition(persisted, cancelled);
      } catch (error) {
        if (isOptimisticConflict(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('order cancellation concurrency limit exceeded');
  }

  /**
   * Transaction-aware lifecycle transition for the Execution Engine (US170).
   * Callers own the transaction so an Order transition, an appended Fill, and
   * their Outbox events commit atomically. Orders still owns the aggregate.
   */
  async applyExecutionTransition(
    order: Order,
    input: OrderTransitionInput,
    transaction: TransactionContext,
  ): Promise<Order> {
    const next = transitionOrder(order, input);
    const saved = await this.orders.save(next, order.version, transaction);
    await this.outbox.append(transaction, orderEnvelope(saved), input.recordedAt);
    return saved;
  }

  /**
   * Transaction-aware Fill application for the Execution Engine (US170/US171).
   * The Fill quantity itself is persisted by the Execution Engine within the
   * same transaction; Orders only advances filled quantity and lifecycle.
   */
  async applyExecutionFill(
    order: Order,
    fillQuantity: string,
    input: Omit<OrderTransitionInput, 'toStatus'>,
    transaction: TransactionContext,
  ): Promise<Order> {
    const next = applyOrderFill(order, fillQuantity, input);
    const saved = await this.orders.save(next, order.version, transaction);
    await this.outbox.append(transaction, orderEnvelope(saved), input.recordedAt);
    return saved;
  }

  get(workspaceId: string, orderId: string): Promise<Order | null> {
    return this.orders.findById(workspaceId, orderId);
  }

  list(workspaceId: string): Promise<Order[]> {
    return this.orders.listByWorkspace(workspaceId);
  }

  private persistTransition(current: Order, next: Order): Promise<Order> {
    return this.transactions.run(async (transaction) => {
      const saved = await this.orders.save(next, current.version, transaction);
      await this.outbox.append(transaction, orderEnvelope(saved), next.recordedAt);
      return saved;
    });
  }
}

function orderEnvelope(order: Order): DurableEventEnvelope {
  const latest = order.lifecycle.at(-1);
  if (!latest) throw new Error('order lifecycle entry is required');
  return Object.freeze({
    eventId: toDurableEventId(`order:${order.id}:v${order.version}`),
    eventType: latest.eventType,
    schemaVersion: 1,
    aggregateType: 'Order',
    aggregateId: order.id,
    aggregateVersion: order.version,
    workspaceId: order.workspaceId,
    occurredAt: latest.occurredAt,
    recordedAt: latest.recordedAt,
    ...(latest.correlationId !== null ? { correlationId: latest.correlationId } : {}),
    actorId: latest.actorId,
    payload: Object.freeze({
      orderId: order.id,
      clientOrderId: order.intent.clientOrderId,
      intentHash: order.intent.intentHash,
      idempotencyKey: order.intent.idempotencyKey,
      paperAccountId: order.intent.paperAccountId,
      tradingSessionId: order.intent.tradingSessionId,
      fromStatus: latest.fromStatus,
      toStatus: latest.toStatus,
      quantity: order.intent.quantity,
      filledQuantity: order.filledQuantity,
      riskDecisionId: order.riskDecisionId,
      riskDecision: order.riskDecision,
      reservationId: order.reservationId,
      adapterOrderId: order.adapterOrderId,
      reason: latest.reason,
    }),
  });
}

function assertSameIntent(existing: Order, intentHash: string): void {
  if (existing.intent.intentHash !== intentHash) {
    throw new Error('idempotency or client order id reused with a different intent');
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isOptimisticConflict(error: unknown): boolean {
  return error instanceof Error && error.message === 'order optimistic version conflict';
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
