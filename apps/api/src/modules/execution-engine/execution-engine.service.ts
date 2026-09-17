import { Inject, Injectable, Optional } from '@nestjs/common';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  toDurableEventId,
  TransactionalOutboxAppender,
  type DurableEventEnvelope,
} from '../event-processing';
import {
  EXECUTION_ADAPTER,
  type ExecutionAdapterPort,
  type ExecutionCommand,
  type LiveExecutionCommand,
  type PaperExecutionCommand,
} from '../execution-adapter';
import type { PaperFillConfiguration } from '../execution-adapter/paper-fill-configuration';
import {
  assertLiveVenueIoPreconditions,
  LIVE_VENUE_IO_ACTION_CANCEL,
  LIVE_VENUE_IO_ACTION_SUBMIT,
} from '../execution-adapter/live-venue';
import { purposeForTradingEnvironment } from '../execution-adapter/live-venue-egress/trading-credential-environment';
import type { Role } from '../identity/role';
import { LiveAdmissionService } from '../trading-session/live-admission/live-admission.service';
import type { LiveAdmissionSessionFacts } from '../trading-session/live-admission/domain/session-live-eligibility';
import { OrderService } from '../orders/order.service';
import type { Order } from '../orders/domain/order';
import { OrderStatus } from '../orders/domain/order-status';
import {
  SubmissionPhase,
  type OrderReconciliationEvidence,
} from '../orders/domain/order-execution-state';
import { RiskDecisionStatus } from '../risk/domain/risk-decision';
import { AccountingReconciliationService } from '../positions/reconciliation/accounting-reconciliation.service';
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
  /** Live path (ADP1): human-start token required before irreversible venue I/O. */
  humanStartToken?: string | null;
  actorRole?: Role;
  liveSessionFacts?: LiveAdmissionSessionFacts | null;
  v2Overrides?: {
    liveCapitalAuthorized?: boolean;
    paperFreezeBlocksLive?: boolean;
  };
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
}>;

export type CancelExecutionCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
  humanStartToken?: string | null;
  actorRole?: Role;
  liveSessionFacts?: LiveAdmissionSessionFacts | null;
  v2Overrides?: {
    liveCapitalAuthorized?: boolean;
    paperFreezeBlocksLive?: boolean;
  };
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
}>;

export type ReconcileExecutionCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  actorId?: string;
  correlationId?: string;
  occurredAt?: string;
  recordedAt?: string;
  /** Authoritative simulated/venue evidence (UNK1). Omit → unresolved query path. */
  evidence?: OrderReconciliationEvidence;
}>;

export type ExecutionOutcome = 'filled' | 'resting' | 'already_executed' | 'unknown' | 'rejected';

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
    @Optional()
    @Inject(AccountingReconciliationService)
    private readonly accountingReconciliation?: AccountingReconciliationService,
    @Optional()
    @Inject(LiveAdmissionService)
    private readonly liveAdmission?: LiveAdmissionService,
  ) {}

  async submit(command: SubmitExecutionCommand): Promise<ExecutionResult> {
    const order = await this.orders.get(command.workspaceId, command.orderId);
    if (!order) throw new Error('order not found in workspace');
    assertSupportedExecutionMode(order);

    // UNKNOWN must reconcile first — no blind retry (AD-L02-11 / UNK1).
    if (order.status === OrderStatus.UNKNOWN) {
      throw new Error('order is UNKNOWN; reconcile before any resubmit');
    }

    // Crash after transmit marker without known outcome → UNKNOWN (no second submit).
    if (
      order.status === OrderStatus.EXECUTABLE &&
      order.execution.submissionPhase === SubmissionPhase.TRANSMITTED
    ) {
      const unknown = await this.orders.markSubmissionUnknown(order, {
        eventType: 'OrderUnknownAfterTransmitCrash',
        actorId: command.actorId,
        correlationId: command.correlationId,
        ambiguityReason: 'crash_or_retry_after_transmit_without_known_outcome',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      });
      return Object.freeze({ order: unknown, fill: null, outcome: 'unknown' as const });
    }

    // Only an EXECUTABLE Order may be submitted. Any later state means execution
    // already began; returning the current facts keeps submit idempotent so a
    // duplicate command cannot duplicate an adapter submission or a Fill.
    if (order.status !== OrderStatus.EXECUTABLE) {
      return this.existingResult(command.workspaceId, command.orderId, order);
    }

    await this.accountingReconciliation?.assertExecutionEligible(
      order.workspaceId,
      order.intent.paperAccountId,
    );
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

    // Live path: S04 revalidation + atomic human-start claim immediately before I/O.
    // Claim ≠ SUBMITTED. Paper path skips admission (ADP1 does not weaken C7).
    if (order.intent.mode === 'live') {
      await this.assertLiveIoGate(order, command, LIVE_VENUE_IO_ACTION_SUBMIT);
    }

    // Pre-send then transmitted markers BEFORE adapter I/O (AD-L02-11).
    const prepared = await this.transactions.run(async (transaction) => {
      let current = order;
      current = await this.orders.markReadyToTransmit(
        current,
        {
          eventType: 'OrderPreSendMarked',
          actorId: command.actorId,
          correlationId: command.correlationId,
          venueClientOrderId: order.intent.clientOrderId,
          occurredAt: command.occurredAt,
          recordedAt: command.recordedAt,
        },
        transaction,
      );
      current = await this.orders.markTransmitted(
        current,
        {
          eventType: 'OrderTransmitMarked',
          actorId: command.actorId,
          correlationId: command.correlationId,
          occurredAt: command.occurredAt,
          recordedAt: command.recordedAt,
        },
        transaction,
      );
      return current;
    });

    let acknowledgement;
    try {
      acknowledgement = await this.adapter.submit(
        buildAdapterCommand(prepared, command, this.configuration),
      );
    } catch (error) {
      // Ambiguous transport failures after transmit → UNKNOWN (never inferred reject).
      const unknown = await this.orders.markSubmissionUnknown(prepared, {
        eventType: 'OrderUnknownAfterAdapterError',
        actorId: command.actorId,
        correlationId: command.correlationId,
        ambiguityReason:
          error instanceof Error ? `adapter_error:${error.message}` : 'adapter_error:unknown',
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      });
      return Object.freeze({ order: unknown, fill: null, outcome: 'unknown' as const });
    }

    if (acknowledgement.outcome === 'unknown') {
      const unknown = await this.orders.markSubmissionUnknown(prepared, {
        eventType: 'OrderUnknownAfterAmbiguousSubmit',
        actorId: command.actorId,
        correlationId: command.correlationId,
        ambiguityReason: acknowledgement.ambiguityReason,
        adapterOrderId: acknowledgement.adapterOrderId ?? undefined,
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      });
      return Object.freeze({ order: unknown, fill: null, outcome: 'unknown' as const });
    }

    if (acknowledgement.outcome === 'rejected') {
      const rejected = await this.transactions.run(async (transaction) => {
        return this.orders.applyExecutionTransition(
          prepared,
          {
            toStatus: OrderStatus.REJECTED,
            eventType: 'OrderRejectedByVenue',
            actorId: command.actorId,
            correlationId: command.correlationId,
            reason: acknowledgement.rejectionReason,
            adapterOrderId: acknowledgement.adapterOrderId ?? undefined,
            occurredAt: command.occurredAt,
            recordedAt: command.recordedAt,
            execution: {
              submissionPhase: SubmissionPhase.COMPLETED,
              completedAt: command.occurredAt,
              reconciliationRequired: false,
            },
          },
          transaction,
        );
      });
      return Object.freeze({ order: rejected, fill: null, outcome: 'rejected' as const });
    }

    try {
      return await this.transactions.run(async (transaction) => {
        const submitted = await this.orders.applyExecutionTransition(
          prepared,
          {
            toStatus: OrderStatus.SUBMITTED,
            eventType: 'OrderSubmitted',
            actorId: command.actorId,
            correlationId: command.correlationId,
            adapterOrderId: acknowledgement.adapterOrderId,
            occurredAt: command.occurredAt,
            recordedAt: command.recordedAt,
            execution: {
              submissionPhase: SubmissionPhase.COMPLETED,
              completedAt: command.occurredAt,
              venueOrderId: acknowledgement.adapterOrderId,
              reconciliationRequired: false,
            },
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

        // Live adapters must not invent fills; paper fill path requires roundingContext.
        if (acknowledgement.mode === 'live' || !acknowledgement.roundingContext) {
          return { order: acknowledged, fill: null, outcome: 'resting' } as const;
        }

        const fill = createPaperFill({
          workspaceId: order.workspaceId,
          exchangeScopeId: order.intent.exchangeScopeId,
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
        await this.outbox.append(
          transaction,
          orderFillRecordedEnvelope(appended),
          command.recordedAt,
        );
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
      // Persistence failure after known adapter response with transmit already marked:
      // durable UNKNOWN until reconcile — do not invent FILLED/ACCEPTED.
      const current = await this.orders.get(command.workspaceId, command.orderId);
      if (
        current &&
        current.status === OrderStatus.EXECUTABLE &&
        current.execution.submissionPhase === SubmissionPhase.TRANSMITTED
      ) {
        const unknown = await this.orders.markSubmissionUnknown(current, {
          eventType: 'OrderUnknownAfterPersistFailure',
          actorId: command.actorId,
          correlationId: command.correlationId,
          ambiguityReason: 'persist_failure_after_possible_venue_accept',
          adapterOrderId: acknowledgement.adapterOrderId,
          occurredAt: command.occurredAt,
          recordedAt: command.recordedAt,
        });
        return Object.freeze({ order: unknown, fill: null, outcome: 'unknown' as const });
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
    assertSupportedExecutionMode(order);
    if (order.status === OrderStatus.CANCELLED) return order;
    if (order.status === OrderStatus.FILLED || order.status === OrderStatus.REJECTED) {
      throw new Error(`order cannot be cancelled from ${order.status}`);
    }
    if (order.status === OrderStatus.UNKNOWN) {
      throw new Error('order is UNKNOWN; reconcile before cancel retry');
    }
    if (order.adapterOrderId === null) {
      throw new Error('execution engine cancels only submitted orders');
    }

    if (order.intent.mode === 'live') {
      await this.assertLiveIoGate(order, command, LIVE_VENUE_IO_ACTION_CANCEL);
    }

    const cancelResult = await this.adapter.cancel(
      order.intent.mode === 'live'
        ? {
            mode: 'live' as const,
            workspaceId: order.workspaceId,
            orderId: order.id,
            clientOrderId: order.intent.clientOrderId,
            adapterOrderId: order.adapterOrderId,
            idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
            instrument: order.intent.instrument,
            venue: order.intent.liveVenue!,
            tradingEnvironment: order.intent.liveTradingEnvironment!,
            vaultType: vaultTypeForVenue(order.intent.liveVenue!),
            purpose: purposeForTradingEnvironment(order.intent.liveTradingEnvironment!),
          }
        : {
            mode: 'paper' as const,
            workspaceId: order.workspaceId,
            orderId: order.id,
            clientOrderId: order.intent.clientOrderId,
            adapterOrderId: order.adapterOrderId,
            idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
          },
    );

    if (cancelResult.outcome === 'unknown') {
      return this.orders.markSubmissionUnknown(order, {
        eventType: 'OrderUnknownAfterCancelAmbiguity',
        actorId: command.actorId,
        correlationId: command.correlationId,
        ambiguityReason: cancelResult.ambiguityReason,
        adapterOrderId: order.adapterOrderId,
        occurredAt: command.occurredAt,
        recordedAt: command.recordedAt,
      });
    }
    if (cancelResult.outcome === 'already_filled') {
      throw new Error('order already filled at venue; not cancellable');
    }
    if (cancelResult.outcome === 'rejected') {
      throw new Error(`live cancel rejected: ${cancelResult.reason}`);
    }

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
    const occurredAt = command.occurredAt ?? new Date().toISOString();
    const recordedAt = command.recordedAt ?? occurredAt;
    const actorId = command.actorId ?? 'execution-engine';

    let current = order;
    const evidenceProvided = command.evidence !== undefined;
    if (order.status === OrderStatus.UNKNOWN) {
      const evidence: OrderReconciliationEvidence = command.evidence ?? {
        kind: 'unresolved',
        reason: 'no_authoritative_evidence',
      };
      current = await this.orders.applyReconciliationEvidence(order, evidence, {
        eventType: 'OrderReconcile',
        actorId,
        correlationId: command.correlationId,
        occurredAt,
        recordedAt,
      });
    }

    const terminal =
      current.status === OrderStatus.FILLED ||
      current.status === OrderStatus.REJECTED ||
      current.status === OrderStatus.CANCELLED;
    let reconciliationRequired = current.execution.reconciliationRequired;
    if (
      !evidenceProvided &&
      !terminal &&
      current.adapterOrderId !== null &&
      current.status !== OrderStatus.UNKNOWN
    ) {
      const query = await this.adapter.query(
        current.intent.mode === 'live'
          ? {
              mode: 'live' as const,
              workspaceId: current.workspaceId,
              adapterOrderId: current.adapterOrderId,
              clientOrderId: current.intent.clientOrderId,
              instrument: current.intent.instrument,
              venue: current.intent.liveVenue!,
              tradingEnvironment: current.intent.liveTradingEnvironment!,
              vaultType: vaultTypeForVenue(current.intent.liveVenue!),
              purpose: purposeForTradingEnvironment(current.intent.liveTradingEnvironment!),
            }
          : {
              mode: 'paper' as const,
              workspaceId: current.workspaceId,
              adapterOrderId: current.adapterOrderId,
            },
      );
      reconciliationRequired = query.reconciliationRequired;
    }
    if (current.status === OrderStatus.UNKNOWN) {
      reconciliationRequired = true;
    }
    return Object.freeze({
      orderId: current.id,
      status: current.status,
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

  private async assertLiveIoGate(
    order: Order,
    command: SubmitExecutionCommand | CancelExecutionCommand,
    actionCommand: string,
  ): Promise<void> {
    if (!this.liveAdmission) {
      throw new Error('live admission service required for live execution');
    }
    if (!command.actorRole) {
      throw new Error('live execution requires actorRole for C7 evaluation');
    }
    const gate = await assertLiveVenueIoPreconditions({
      admission: this.liveAdmission,
      command: {
        workspaceId: order.workspaceId,
        sessionId: order.intent.tradingSessionId,
        actorId: command.actorId,
        actorRole: command.actorRole,
        humanStartToken: command.humanStartToken ?? '',
        actionCommand,
        session: command.liveSessionFacts ?? null,
        claimedLogicalActionId: order.id,
        evaluatedAt: command.occurredAt,
        v2Overrides: command.v2Overrides,
        authorizationOverride: command.authorizationOverride,
        gateRequest: {
          exchangeScopeId: order.intent.exchangeScopeId,
          libraryEntryId: 'live-execution-engine',
        },
      },
    });
    if (!gate.ok) {
      throw new Error(`live_io_gate_denied:${gate.reason}`);
    }
    // Explicit invariant: claim ≠ venue submitted.
    if (gate.claimMeansVenueSubmitted !== false) {
      throw new Error('live_io_gate_invariant_broken');
    }
  }
}

function buildAdapterCommand(
  order: Order,
  command: SubmitExecutionCommand,
  configuration: PaperFillConfiguration,
): ExecutionCommand {
  if (order.intent.mode === 'live') {
    const venue = order.intent.liveVenue;
    const tradingEnvironment = order.intent.liveTradingEnvironment;
    if (!venue || !tradingEnvironment) {
      throw new Error('live order missing venue/environment binding');
    }
    const live: LiveExecutionCommand = Object.freeze({
      mode: 'live',
      workspaceId: order.workspaceId,
      orderId: order.id,
      clientOrderId: order.intent.clientOrderId,
      intentHash: order.intent.intentHash,
      instrument: order.intent.instrument,
      side: order.intent.side,
      type: order.intent.type,
      quantity: order.intent.quantity,
      limitPrice: order.intent.limitPrice,
      venue,
      tradingEnvironment,
      vaultType: vaultTypeForVenue(venue),
      purpose: purposeForTradingEnvironment(tradingEnvironment),
    });
    return live;
  }

  const paper: PaperExecutionCommand = Object.freeze({
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
    origin: order.intent.origin,
    signalIntentId: order.intent.signalIntentId,
    signalIntentHash: order.intent.signalIntentHash,
    marketState: Object.freeze({
      streamId: command.marketState.streamId,
      eventId: command.marketState.eventId,
      sequence: command.marketState.sequence,
      referencePrice: command.marketState.referencePrice,
      occurredAt: command.marketState.occurredAt,
    }),
    configuration,
  });
  return paper;
}

function vaultTypeForVenue(venue: 'BINANCE' | 'BYBIT' | 'OKX'): 'binance' | 'bybit' | 'okx' {
  if (venue === 'BINANCE') return 'binance';
  if (venue === 'BYBIT') return 'bybit';
  return 'okx';
}

function assertSupportedExecutionMode(order: Order): void {
  if (order.intent.mode !== 'paper' && order.intent.mode !== 'live') {
    throw new Error('unsupported order execution mode');
  }
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

/**
 * Canonical OrderFillRecorded envelope (US171 / US223).
 * Shared so accounting consumers and the E2E pipeline reuse one shape.
 */
export function orderFillRecordedEnvelope(fill: PaperFill): DurableEventEnvelope {
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
      exchangeScopeId: fill.exchangeScopeId,
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
