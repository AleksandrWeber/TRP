/**
 * V3-L02-S-UNK1 — Engine UNKNOWN / no-blind-retry / reconcile evidence (fake adapter).
 * ZERO live venue network calls.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ExecutionAdapterPort } from '../execution-adapter/execution-adapter.port';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter/paper-fill-configuration';
import {
  applyOrderReconciliation,
  createOrder,
  markOrderReadyToTransmit,
  markOrderSubmissionUnknown,
  markOrderTransmitted,
  transitionOrder,
  type Order,
} from '../orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../orders/domain/order-intent';
import { SubmissionPhase } from '../orders/domain/order-execution-state';
import { OrderStatus } from '../orders/domain/order-status';
import type { OrderService } from '../orders/order.service';
import { RiskDecisionStatus } from '../risk/domain/risk-decision';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import { ExecutionEngineService } from './execution-engine.service';

const t0 = '2026-09-17T14:10:00.000Z';

function executableOrder(clientOrderId = 'eng-unk1-1'): Order {
  let order = createOrder(
    createOrderIntent({
      clientOrderId,
      idempotencyKey: clientOrderId,
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      tradingSessionId: 'session-1',
      sessionFencingToken: 1,
      mode: 'paper',
      origin: 'manual',
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      quantity: '1',
      limitPrice: '100',
      marketCheckpoint: { streamId: 's', sequence: 1, eventId: 'e' },
      actorId: 'trader-1',
      occurredAt: t0,
      recordedAt: t0,
    }),
  );
  const risk = Object.freeze({
    id: 'risk-1',
    status: RiskDecisionStatus.APPROVED as const,
    workspaceId: order.workspaceId,
    orderId: order.id,
    intentHash: order.intent.intentHash,
    policyId: 'p',
    policyVersion: 1,
    policyHash: 'h',
    inputHash: 'i',
    evaluatedAt: t0,
    expiresAt: '2026-09-17T15:10:00.000Z',
  });
  order = transitionOrder(order, {
    toStatus: OrderStatus.RISK_PENDING,
    eventType: 'r',
    actorId: 'a',
    occurredAt: '2026-09-17T14:10:01.000Z',
    recordedAt: '2026-09-17T14:10:01.100Z',
  });
  order = transitionOrder(order, {
    toStatus: OrderStatus.APPROVED,
    eventType: 'a',
    actorId: 'a',
    riskDecision: risk,
    occurredAt: '2026-09-17T14:10:02.000Z',
    recordedAt: '2026-09-17T14:10:02.100Z',
  });
  order = transitionOrder(order, {
    toStatus: OrderStatus.RESERVED,
    eventType: 'res',
    actorId: 'a',
    reservationId: 'res-1',
    occurredAt: '2026-09-17T14:10:03.000Z',
    recordedAt: '2026-09-17T14:10:03.100Z',
  });
  return transitionOrder(order, {
    toStatus: OrderStatus.EXECUTABLE,
    eventType: 'ex',
    actorId: 'a',
    occurredAt: '2026-09-17T14:10:04.000Z',
    recordedAt: '2026-09-17T14:10:04.100Z',
  });
}

function runningSession() {
  return Object.freeze({
    id: 'session-1',
    workspaceId: 'workspace-1',
    paperAccountId: 'account-1',
    exchangeScopeId: 'exchange-scope:binance',
    deploymentId: 'd1',
    tacticalEnvelope: null,
    origin: 'manual' as const,
    status: TradingSessionStatus.RUNNING,
    lease: Object.freeze({
      ownerId: 'owner-1',
      fencingToken: 1,
      acquiredAt: t0,
      expiresAt: '2026-09-17T16:00:00.000Z',
      heartbeatAt: t0,
    }),
    lastFencingToken: 1,
    version: 2,
    failureReason: null,
    createdAt: t0,
    recordedAt: t0,
    actorId: 'trader-1',
    correlationId: null,
    idempotencyKey: 'session-idem-1',
  });
}

function createEngine(adapter: ExecutionAdapterPort, store: { order: Order }) {
  const orders = {
    get: vi.fn(async () => store.order),
    markReadyToTransmit: vi.fn(async (o: Order, input: never) => {
      store.order = markOrderReadyToTransmit(o, input);
      return store.order;
    }),
    markTransmitted: vi.fn(async (o: Order, input: never) => {
      store.order = markOrderTransmitted(o, input);
      return store.order;
    }),
    markSubmissionUnknown: vi.fn(async (o: Order, input: never) => {
      store.order = markOrderSubmissionUnknown(o, input);
      return store.order;
    }),
    applyExecutionTransition: vi.fn(async (o: Order, input: never) => {
      store.order = transitionOrder(o, input);
      return store.order;
    }),
    applyExecutionFill: vi.fn(),
    applyReconciliationEvidence: vi.fn(async (o: Order, evidence: never, input: never) => {
      store.order = applyOrderReconciliation(o, evidence, input);
      return store.order;
    }),
  };
  const sessions = {
    findById: vi.fn(async () => runningSession()),
  };
  const fills = {
    findByOrder: vi.fn(async () => []),
    append: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => work({})),
  };
  const outbox = { append: vi.fn() };
  const engine = new ExecutionEngineService(
    adapter,
    orders as unknown as OrderService,
    sessions as never,
    fills as never,
    transactions as never,
    outbox as never,
    M2_PAPER_FILL_CONFIGURATION,
  );
  return { engine, orders, store, adapter };
}

describe('V3-L02-S-UNK1 execution engine UNKNOWN path', () => {
  const baseCommand = {
    workspaceId: 'workspace-1',
    actorId: 'trader-1',
    marketState: {
      streamId: 's',
      eventId: 'e',
      sequence: 1,
      referencePrice: '100',
      occurredAt: t0,
    },
    occurredAt: '2026-09-17T14:10:05.000Z',
    recordedAt: '2026-09-17T14:10:05.100Z',
  };

  it('UNK1-03 ambiguous adapter outcome → UNKNOWN after pre-send/transmit markers', async () => {
    const order = executableOrder();
    const store = { order };
    const adapter: ExecutionAdapterPort = {
      submit: async () =>
        Object.freeze({
          mode: 'paper' as const,
          outcome: 'unknown' as const,
          clientOrderId: order.intent.clientOrderId,
          ambiguityReason: 'simulated_timeout_after_transmit',
        }),
      cancel: async () => {
        throw new Error('unused');
      },
      query: async () =>
        Object.freeze({
          outcome: 'unknown' as const,
          mode: 'paper' as const,
          adapterOrderId: 'x',
          reconciliationRequired: true as const,
        }),
      capabilities: () =>
        Object.freeze({
          mode: 'paper' as const,
          marketOrders: true as const,
          limitOrders: true as const,
          cancellation: true as const,
          reconciliation: true as const,
          partialFills: false as const,
          liveCapital: false as const,
        }),
      health: () =>
        Object.freeze({
          mode: 'paper' as const,
          status: 'healthy' as const,
          credentialsConfigured: false as const,
        }),
    };
    const { engine, orders } = createEngine(adapter, store);
    const result = await engine.submit({ ...baseCommand, orderId: order.id });
    expect(result.outcome).toBe('unknown');
    expect(result.order.status).toBe(OrderStatus.UNKNOWN);
    expect(result.fill).toBeNull();
    expect(result.order.execution.submissionPhase).toBe(SubmissionPhase.TRANSMITTED);
    expect(orders.markReadyToTransmit).toHaveBeenCalled();
    expect(orders.markTransmitted).toHaveBeenCalled();
  });

  it('UNK1-16 no blind retry: UNKNOWN submit throws and does not call adapter', async () => {
    let order = executableOrder('eng-unk1-blind');
    order = markOrderSubmissionUnknown(order, {
      eventType: 'OrderUnknown',
      actorId: 'a',
      ambiguityReason: 'x',
      occurredAt: baseCommand.occurredAt,
      recordedAt: baseCommand.recordedAt,
    });
    const store = { order };
    const submit = vi.fn();
    const adapter = {
      submit,
      cancel: vi.fn(),
      query: vi.fn(),
      capabilities: vi.fn(),
      health: vi.fn(),
    } as unknown as ExecutionAdapterPort;
    const { engine } = createEngine(adapter, store);
    await expect(engine.submit({ ...baseCommand, orderId: order.id })).rejects.toThrow(
      /UNKNOWN; reconcile/,
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('crash after transmit marker: retry submit → UNKNOWN without second adapter call', async () => {
    let order = executableOrder('eng-unk1-crash');
    order = markOrderReadyToTransmit(order, {
      eventType: 'OrderPreSendMarked',
      actorId: 'a',
      occurredAt: baseCommand.occurredAt,
      recordedAt: baseCommand.recordedAt,
    });
    order = markOrderTransmitted(order, {
      eventType: 'OrderTransmitMarked',
      actorId: 'a',
      occurredAt: baseCommand.occurredAt,
      recordedAt: baseCommand.recordedAt,
    });
    const store = { order };
    const submit = vi.fn();
    const adapter = {
      submit,
      cancel: vi.fn(),
      query: vi.fn(),
      capabilities: vi.fn(),
      health: vi.fn(),
    } as unknown as ExecutionAdapterPort;
    const { engine } = createEngine(adapter, store);
    const result = await engine.submit({ ...baseCommand, orderId: order.id });
    expect(result.outcome).toBe('unknown');
    expect(result.order.status).toBe(OrderStatus.UNKNOWN);
    expect(submit).not.toHaveBeenCalled();
  });

  it('UNK1-09/10 reconcile resolves only with authoritative evidence', async () => {
    let order = executableOrder('eng-unk1-rec');
    order = markOrderSubmissionUnknown(order, {
      eventType: 'OrderUnknown',
      actorId: 'a',
      ambiguityReason: 'x',
      occurredAt: baseCommand.occurredAt,
      recordedAt: baseCommand.recordedAt,
    });
    const store = { order };
    const adapter = {
      submit: vi.fn(),
      cancel: vi.fn(),
      query: vi.fn(),
      capabilities: vi.fn(),
      health: vi.fn(),
    } as unknown as ExecutionAdapterPort;
    const { engine } = createEngine(adapter, store);

    const unresolved = await engine.reconcile({
      workspaceId: 'workspace-1',
      orderId: order.id,
      evidence: { kind: 'unresolved', reason: 'no_evidence' },
      occurredAt: '2026-09-17T14:11:00.000Z',
      recordedAt: '2026-09-17T14:11:00.100Z',
      actorId: 'reconciler',
    });
    expect(unresolved.status).toBe(OrderStatus.UNKNOWN);
    expect(unresolved.reconciliationRequired).toBe(true);

    const resolved = await engine.reconcile({
      workspaceId: 'workspace-1',
      orderId: order.id,
      evidence: {
        kind: 'acknowledged',
        adapterOrderId: 'paper-1',
        venueOrderId: 'v-1',
      },
      occurredAt: '2026-09-17T14:12:00.000Z',
      recordedAt: '2026-09-17T14:12:00.100Z',
      actorId: 'reconciler',
    });
    expect(resolved.status).toBe(OrderStatus.ACKNOWLEDGED);
    expect(resolved.reconciliationRequired).toBe(false);
  });

  it('UNK1-04 known venue rejection maps to REJECTED (not UNKNOWN)', async () => {
    const order = executableOrder('eng-unk1-rej');
    const store = { order };
    const adapter: ExecutionAdapterPort = {
      submit: async () =>
        Object.freeze({
          mode: 'paper' as const,
          outcome: 'rejected' as const,
          clientOrderId: order.intent.clientOrderId,
          rejectionReason: 'venue_rejected',
        }),
      cancel: async () => {
        throw new Error('unused');
      },
      query: async () => {
        throw new Error('unused');
      },
      capabilities: () =>
        Object.freeze({
          mode: 'paper' as const,
          marketOrders: true as const,
          limitOrders: true as const,
          cancellation: true as const,
          reconciliation: true as const,
          partialFills: false as const,
          liveCapital: false as const,
        }),
      health: () =>
        Object.freeze({
          mode: 'paper' as const,
          status: 'healthy' as const,
          credentialsConfigured: false as const,
        }),
    };
    const { engine } = createEngine(adapter, store);
    const result = await engine.submit({ ...baseCommand, orderId: order.id });
    expect(result.outcome).toBe('rejected');
    expect(result.order.status).toBe(OrderStatus.REJECTED);
    expect(result.order.rejectionReason).toBe('venue_rejected');
  });
});
