import { Inject, Injectable } from '@nestjs/common';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  toDurableEventId,
  TransactionalOutboxAppender,
  type DurableEventEnvelope,
} from '../event-processing';
import {
  EXECUTION_ADAPTER,
  type ExecutionAdapterPort,
  type PaperExecutionCommand,
} from '../execution-adapter';
import type { PaperFillConfiguration } from '../execution-adapter/paper-fill-configuration';
import { OrderService } from '../orders/order.service';
import type { Order } from '../orders/domain/order';
import { OrderStatus } from '../orders/domain/order-status';
import { RiskDecisionStatus } from '../risk/domain/risk-decision';
import { assertExecutionEligible } from '../trading-session/domain/execution-eligibility';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import { createPaperFill, type PaperFill } from './domain/paper-fill';
import { PAPER_FILL_CONFIGURATION } from './execution-engine.tokens';
import { FILL_REPOSITORY, type FillRepository } from './persistence/fill.repository';
import { isDuplicateFill } from './persistence/prisma-fill.repository';

export type ExecutionMarketState = Readonly<{
  streamId: string;
  eventId: string;
  sequence: number;
  referencePrice: string;
  occurredAt: string;
}>;

export type SubmitExecutionCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  actorId: string;
  correlationId?: string;
  marketState: ExecutionMarketState;
  occurredAt: string;
  recordedAt: string;
}>;

export type CancelExecutionCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

export type ReconcileExecutionCommand = Readonly<{
  workspaceId: string;
  orderId: string;
}>;

export type ExecutionOutcome = 'filled' | 'resting' | 'already_executed';

export type ExecutionResult = Readonly<{
  order: Order;
  fill: PaperFill | null;
  outcome: ExecutionOutcome;
}>;

export type ReconciliationResult = Readonly<{
  orderId: string;
  status: OrderStatus;
  terminal: boolean;
  fills: ReadonlyArray<PaperFill>;
  reconciliationRequired: boolean;
}>;

/**
 * Single Execution Engine (US170 / ADR-012, ADR-018 #4).
 * The only component permitted to call the execution adapter. It never mutates
 * Orders or accounting directly: every Order transition flows through the Orders
 * port and every Fill is an append-only fact committed with its Outbox event.
 */
@Injectable()
export class ExecutionEngineService {
  constructor(
    @Inject(EXECUTION_ADAPTER)
    private readonly adapter: ExecutionAdapterPort,
    @Inject(OrderService)
    private readonly orders: OrderService,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(FILL_REPOSITORY)
    private readonly fills: FillRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(PAPER_FILL_CONFIGURATION)
    private readonly configuration: PaperFillConfiguration,
  ) {}

  async submit(command: SubmitExecutionCommand): Promise<ExecutionResult> {
    const order = await this.orders.get(command.workspaceId, command.orderId);
    if (!order) throw new Error('order not found in workspace');
    assertPaper(order);

    // Only an EXECUTABLE Order may be submitted. Any later state means execution
    // already began; returning the current facts keeps submit idempotent so a
    // duplicate command cannot duplicate an adapter submission or a Fill.
    if (order.status !== OrderStatus.EXECUTABLE) {
      return this.existingResult(command.workspaceId, command.orderId, order);
    }

    assertMandatoryRiskDecision(order, command.occurredAt);
    if (order.reservationId === null) {
      throw new Error('executable order requires a cash reservation');
    }
    assertCheckpoint(order, command.marketState);

    const session = await this.sessions.findById(
      command.workspaceId,
      order.intent.tradingSessionId,
    );
    if (!session) throw new Error('trading session not found for order');
    assertExecutionEligible(session, order.intent.sessionFencingToken, command.occurredAt);

    const acknowledgement = await this.adapter.submit(
      buildAdapterCommand(order, command, this.configuration),
    );

    try {
      return await this.transactions.run(async (transaction) => {
        const submitted = await this.orders.applyExecutionTransition(
          order,
          {
            toStatus: OrderStatus.SUBMITTED,
            eventType: 'OrderSubmitted',
            actorId: command.actorId,
            correlationId: command.correlationId,
            adapterOrderId: acknowledgement.adapterOrderId,
            occurredAt: command.occurredAt,
            recordedAt: command.recordedAt,
          },
          transaction,
        );
        const acknowledged = await this.orders.applyExecutionTransition(
          submitted,
          {
            toStatus: OrderStatus.ACKNOWLEDGED,
            eventType: 'OrderAcknowledged',
            actorId: command.actorId,
            correlationId: command.correlationId,
            occurredAt: command.occurredAt,
            recordedAt: command.recordedAt,
          },
          transaction,
        );

        if (acknowledgement.outcome === 'acknowledged') {
          return { order: acknowledged, fill: null, outcome: 'resting' } as const;
        }

        const fill = createPaperFill({
          workspaceId: order.workspaceId,
          orderId: order.id,
          paperAccountId: order.intent.paperAccountId,
          tradingSessionId: order.intent.tradingSessionId,
          adapterOrderId: acknowledgement.adapterOrderId,
          executionContextHash: acknowledgement.executionContextHash,
          configurationId: acknowledgement.roundingContext.configurationId,
          configurationVersion: acknowledgement.roundingContext.configurationVersion,
          configurationHash: acknowledgement.roundingContext.configurationHash,
          fact: acknowledgement.fill,
          recordedAt: command.recordedAt,
        });
        const appended = await this.fills.append(fill, transaction);
        await this.outbox.append(transaction, fillEnvelope(appended), command.recordedAt);
        const filled = await this.orders.applyExecutionFill(
          acknowledged,
          appended.quantity,
          {
            eventType: 'OrderFilled',
            actorId: command.actorId,
            correlationId: command.correlationId,
            reason: 'paper_fill',
            occurredAt: appended.occurredAt,
            recordedAt: command.recordedAt,
          },
          transaction,
        );
        return { order: filled, fill: appended, outcome: 'filled' } as const;
      });
    } catch (error) {
      // A concurrent duplicate submit loses the race on the append-only Fill
      // uniqueness or Order optimistic version. That is the idempotent path.
      if (isDuplicateFill(error) || isOptimisticConflict(error)) {
        const current = await this.orders.get(command.workspaceId, command.orderId);
        if (current) return this.existingResult(command.workspaceId, command.orderId, current);
      }
      throw error;
    }
  }

  /**
   * Cancellation reconciliation (US169/US170). The adapter cancel is provider
   * neutral; Orders owns the terminal transition and reservation release.
   */
  async cancel(command: CancelExecutionCommand): Promise<Order> {
    const order = await this.orders.get(command.workspaceId, command.orderId);
    if (!order) throw new Error('order not found in workspace');
    assertPaper(order);
    if (order.status === OrderStatus.CANCELLED) return order;
    if (order.status === OrderStatus.FILLED || order.status === OrderStatus.REJECTED) {
      throw new Error(`order cannot be cancelled from ${order.status}`);
    }
    if (order.adapterOrderId === null) {
      throw new Error('execution engine cancels only submitted orders');
    }

    await this.adapter.cancel({
      mode: 'paper',
      workspaceId: order.workspaceId,
      orderId: order.id,
      clientOrderId: order.intent.clientOrderId,
      adapterOrderId: order.adapterOrderId,
      idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
    });

    return this.orders.confirmCancellation({
      workspaceId: command.workspaceId,
      orderId: command.orderId,
      idempotencyKey: command.idempotencyKey,
      actorId: command.actorId,
      correlationId: command.correlationId,
      occurredAt: command.occurredAt,
      recordedAt: command.recordedAt,
    });
  }

  async reconcile(command: ReconcileExecutionCommand): Promise<ReconciliationResult> {
    const order = await this.orders.get(command.workspaceId, command.orderId);
    if (!order) throw new Error('order not found in workspace');
    const fills = await this.fills.findByOrder(command.workspaceId, command.orderId);
    const terminal =
      order.status === OrderStatus.FILLED ||
      order.status === OrderStatus.REJECTED ||
      order.status === OrderStatus.CANCELLED;
    let reconciliationRequired = false;
    if (!terminal && order.adapterOrderId !== null) {
      const query = await this.adapter.query({
        mode: 'paper',
        workspaceId: order.workspaceId,
        adapterOrderId: order.adapterOrderId,
      });
      reconciliationRequired = query.reconciliationRequired;
    }
    return Object.freeze({
      orderId: order.id,
      status: order.status,
      terminal,
      fills: Object.freeze(fills),
      reconciliationRequired,
    });
  }

  private async existingResult(
    workspaceId: string,
    orderId: string,
    order: Order,
  ): Promise<ExecutionResult> {
    const fills = await this.fills.findByOrder(workspaceId, orderId);
    const outcome: ExecutionOutcome =
      order.status === OrderStatus.EXECUTABLE ? 'resting' : 'already_executed';
    return Object.freeze({ order, fill: fills.at(0) ?? null, outcome });
  }
}

function buildAdapterCommand(
  order: Order,
  command: SubmitExecutionCommand,
  configuration: PaperFillConfiguration,
): PaperExecutionCommand {
  return Object.freeze({
    mode: 'paper',
    workspaceId: order.workspaceId,
    orderId: order.id,
    clientOrderId: order.intent.clientOrderId,
    intentHash: order.intent.intentHash,
    instrument: order.intent.instrument,
    side: order.intent.side,
    type: order.intent.type,
    quantity: order.intent.quantity,
    limitPrice: order.intent.limitPrice,
    marketState: Object.freeze({
      streamId: command.marketState.streamId,
      eventId: command.marketState.eventId,
      sequence: command.marketState.sequence,
      referencePrice: command.marketState.referencePrice,
      occurredAt: command.marketState.occurredAt,
    }),
    configuration,
  });
}

function assertPaper(order: Order): void {
  if (order.intent.mode !== 'paper') throw new Error('execution engine is paper-only');
}

function assertMandatoryRiskDecision(order: Order, occurredAt: string): void {
  const decision = order.riskDecision;
  if (!decision || decision.status !== RiskDecisionStatus.APPROVED) {
    throw new Error('executable order requires an approved Risk Decision');
  }
  if (Date.parse(occurredAt) >= Date.parse(decision.expiresAt)) {
    throw new Error('Risk Decision is expired at submission');
  }
}

function assertCheckpoint(order: Order, marketState: ExecutionMarketState): void {
  const checkpoint = order.intent.marketCheckpoint;
  if (
    checkpoint.streamId !== marketState.streamId ||
    checkpoint.eventId !== marketState.eventId ||
    checkpoint.sequence !== marketState.sequence
  ) {
    throw new Error('submission market checkpoint does not match approved intent checkpoint');
  }
}

function fillEnvelope(fill: PaperFill): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`fill:${fill.id}`),
    eventType: 'OrderFillRecorded',
    schemaVersion: 1,
    aggregateType: 'Fill',
    aggregateId: fill.id,
    aggregateVersion: fill.sequence,
    workspaceId: fill.workspaceId,
    occurredAt: fill.occurredAt,
    recordedAt: fill.recordedAt,
    actorId: 'execution-engine',
    payload: Object.freeze({
      fillId: fill.id,
      orderId: fill.orderId,
      paperAccountId: fill.paperAccountId,
      tradingSessionId: fill.tradingSessionId,
      adapterOrderId: fill.adapterOrderId,
      adapterFillId: fill.adapterFillId,
      sequence: fill.sequence,
      instrument: fill.instrument,
      side: fill.side,
      price: fill.price,
      quantity: fill.quantity,
      grossNotional: fill.grossNotional,
      fee: fill.fee,
      executionContextHash: fill.executionContextHash,
      configurationId: fill.configurationId,
      configurationVersion: fill.configurationVersion,
      configurationHash: fill.configurationHash,
    }),
  });
}

function isOptimisticConflict(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'order optimistic version conflict' ||
      error.message === 'order aggregate version must advance exactly once')
  );
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
