import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import { ExecutionEngineService } from '../../modules/execution-engine';
import { PrismaFillRepository } from '../../modules/execution-engine';
import type { CashReservationPort } from '../../modules/ledger';
import { createOrder } from '../../modules/orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { RiskDecisionStatus } from '../../modules/risk';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import type { TradingSession } from '../../modules/trading-session/domain/trading-session';
import type { TradingSessionRepository } from '../../modules/trading-session/persistence/trading-session.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us170';
const t0 = '2026-07-18T18:00:00.000Z';
const EXPIRES = '2026-07-18T19:00:00.000Z';
const CHECKPOINT = Object.freeze({
  streamId: 'mark:BTCUSDT',
  sequence: 7,
  eventId: 'market-event-us170',
});

const runningSession: TradingSession = Object.freeze({
  id: 'session-us170',
  workspaceId: WS,
  paperAccountId: 'account-us170',
  deploymentId: 'deploy-us170',
  origin: 'manual',
  status: TradingSessionStatus.RUNNING,
  lease: Object.freeze({
    ownerId: 'owner-us170',
    fencingToken: 1,
    acquiredAt: t0,
    expiresAt: EXPIRES,
    heartbeatAt: t0,
  }),
  lastFencingToken: 1,
  version: 2,
  failureReason: null,
  createdAt: t0,
  recordedAt: t0,
  actorId: 'operator-us170',
  correlationId: null,
  idempotencyKey: 'session-idem-us170',
});

describe('US170 — single Execution Engine with immutable Fill persistence', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const orderRepo = new PrismaOrderRepository(prisma);
  const fillRepo = new PrismaFillRepository(prisma);
  const releaseCash = vi.fn(async () => null);
  const cashReservations = {
    reserveCash: async () => {
      throw new Error('not used');
    },
    releaseCash,
    findByOrder: async () => null,
  } satisfies CashReservationPort;
  const orders = new OrderService(
    orderRepo,
    null as never,
    null as never,
    transactions,
    outbox,
    cashReservations,
  );
  const sessions = {
    findById: async () => runningSession,
    findByIdempotencyKey: async () => null,
    create: async () => {
      throw new Error('not used');
    },
    save: async () => {
      throw new Error('not used');
    },
  } satisfies TradingSessionRepository;
  const adapter = new PaperExecutionAdapter();
  const engine = new ExecutionEngineService(
    adapter,
    orders,
    sessions,
    fillRepo,
    transactions,
    outbox,
    M2_PAPER_FILL_CONFIGURATION,
  );

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    releaseCash.mockClear();
    await cleanup();
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperOrder.deleteMany({ where: { workspaceId: WS } });
  }

  async function seedExecutable(suffix: string, type: OrderType, limitPrice: string | null) {
    const order = createOrder(
      createOrderIntent({
        clientOrderId: `client-${suffix}`,
        idempotencyKey: `create-${suffix}`,
        workspaceId: WS,
        paperAccountId: 'account-us170',
        tradingSessionId: 'session-us170',
        sessionFencingToken: 1,
        mode: 'paper',
        origin: 'manual',
        instrument: 'BTCUSDT',
        side: OrderSide.BUY,
        type,
        quantity: '2',
        limitPrice,
        reduceOnly: false,
        marketCheckpoint: CHECKPOINT,
        actorId: 'trader-us170',
        occurredAt: t0,
        recordedAt: t0,
      }),
    );
    await transactions.run((context) => orderRepo.create(order, context));
    const risk = {
      id: `risk-${suffix}`,
      status: RiskDecisionStatus.APPROVED,
      workspaceId: WS,
      orderId: order.id,
      intentHash: order.intent.intentHash,
      policyId: 'm2-baseline-paper-risk',
      policyVersion: 1,
      policyHash: 'policy-hash',
      inputHash: `input-${suffix}`,
      evaluatedAt: '2026-07-18T18:00:30.000Z',
      expiresAt: EXPIRES,
    };
    await move(order.id, OrderStatus.RISK_PENDING, 1);
    await move(order.id, OrderStatus.APPROVED, 2, { riskDecision: risk });
    await move(order.id, OrderStatus.RESERVED, 3, { reservationId: `res-${suffix}` });
    await move(order.id, OrderStatus.EXECUTABLE, 4);
    return order;
  }

  async function move(orderId: string, toStatus: OrderStatus, version: number, extra = {}) {
    return orders.transition({
      workspaceId: WS,
      orderId,
      expectedVersion: version,
      toStatus,
      eventType: `Order_${toStatus}`,
      actorId: 'internal-engine',
      occurredAt: `2026-07-18T18:01:0${version}.000Z`,
      recordedAt: `2026-07-18T18:01:0${version}.100Z`,
      ...extra,
    });
  }

  const submitCommand = (orderId: string, referencePrice: string) =>
    ({
      workspaceId: WS,
      orderId,
      actorId: 'trader-us170',
      correlationId: 'corr-us170',
      marketState: {
        streamId: CHECKPOINT.streamId,
        eventId: CHECKPOINT.eventId,
        sequence: CHECKPOINT.sequence,
        referencePrice,
        occurredAt: '2026-07-18T18:02:00.000Z',
      },
      occurredAt: '2026-07-18T18:02:00.000Z',
      recordedAt: '2026-07-18T18:02:00.100Z',
    }) as const;

  it('is the sole adapter entry: submits, fills deterministically, and persists one immutable Fill', async () => {
    const order = await seedExecutable('market', OrderType.MARKET, null);
    const submitSpy = vi.spyOn(adapter, 'submit');

    const result = await engine.submit(submitCommand(order.id, '100'));

    expect(result.outcome).toBe('filled');
    expect(result.order.status).toBe(OrderStatus.FILLED);
    expect(result.fill).toMatchObject({ price: '100.05', quantity: '2', fee: '0.2001' });
    const rows = await prisma.paperFill.findMany({ where: { workspaceId: WS, orderId: order.id } });
    expect(rows).toHaveLength(1);
    const fillEvents = await prisma.outboxEvent.findMany({
      where: { workspaceId: WS, eventType: 'OrderFillRecorded' },
    });
    expect(fillEvents).toHaveLength(1);
    expect(submitSpy).toHaveBeenCalledTimes(1);
    submitSpy.mockRestore();
  });

  it('is idempotent: a duplicate submit cannot duplicate the adapter call or the Fill', async () => {
    const order = await seedExecutable('dup', OrderType.MARKET, null);
    const submitSpy = vi.spyOn(adapter, 'submit');

    const first = await engine.submit(submitCommand(order.id, '100'));
    const second = await engine.submit(submitCommand(order.id, '100'));

    expect(first.outcome).toBe('filled');
    expect(second.outcome).toBe('already_executed');
    expect(second.order.status).toBe(OrderStatus.FILLED);
    const rows = await prisma.paperFill.findMany({ where: { workspaceId: WS, orderId: order.id } });
    expect(rows).toHaveLength(1);
    expect(submitSpy).toHaveBeenCalledTimes(1);
    submitSpy.mockRestore();
  });

  it('rests a non-crossing limit order without a Fill and reconciles cancellation', async () => {
    const order = await seedExecutable('limit', OrderType.LIMIT, '100');

    const resting = await engine.submit(submitCommand(order.id, '101'));
    expect(resting.outcome).toBe('resting');
    expect(resting.order.status).toBe(OrderStatus.ACKNOWLEDGED);
    expect(await prisma.paperFill.count({ where: { workspaceId: WS, orderId: order.id } })).toBe(0);

    const cancelled = await engine.cancel({
      workspaceId: WS,
      orderId: order.id,
      idempotencyKey: `cancel-${order.id}`,
      actorId: 'trader-us170',
      correlationId: 'corr-us170',
      occurredAt: '2026-07-18T18:03:00.000Z',
      recordedAt: '2026-07-18T18:03:00.100Z',
    });
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    expect(releaseCash).toHaveBeenCalledTimes(1);
  });

  it('rejects submission when the market checkpoint differs from the approved intent', async () => {
    const order = await seedExecutable('checkpoint', OrderType.MARKET, null);
    const command = {
      ...submitCommand(order.id, '100'),
      marketState: {
        ...submitCommand(order.id, '100').marketState,
        eventId: 'tampered-event',
      },
    };
    await expect(engine.submit(command)).rejects.toThrow(/market checkpoint/);
  });
});
