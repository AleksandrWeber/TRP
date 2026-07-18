import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us161';
const OTHER_WS = 'ws-us161-other';
const t0 = '2026-07-18T17:20:00.000Z';

describe('US161 — transactional PostgreSQL Orders and Outbox', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accounts = new PrismaPaperAccountRepository(prisma);
  const sessions = new PrismaTradingSessionRepository(prisma);
  const orders = new PrismaOrderRepository(prisma);
  const accountService = new PaperAccountService(accounts, transactions, outbox);
  const sessionService = new TradingSessionService(sessions, accounts, transactions, outbox);
  const service = new OrderService(orders, accounts, sessions, transactions, outbox);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] } },
    });
    await prisma.paperOrder.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] } },
    });
    await prisma.tradingSession.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] } },
    });
    await prisma.paperAccount.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] } },
    });
  }

  async function runningSession() {
    const account = await accountService.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '10000',
      idempotencyKey: 'account',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    const created = await sessionService.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-order-deployment',
      origin: 'manual',
      idempotencyKey: 'session',
      actorId: 'trader-1',
      createdAt: t0,
      recordedAt: t0,
    });
    const session = await sessionService.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-18T17:20:01.000Z',
      nowIso: '2026-07-18T17:20:01.000Z',
      leaseTtlMs: 60_000,
    });
    return { account, session };
  }

  async function createCommand() {
    const { account, session } = await runningSession();
    return {
      clientOrderId: 'client-order-1',
      idempotencyKey: 'order-idem-1',
      workspaceId: WS,
      paperAccountId: account.id,
      tradingSessionId: session.id,
      sessionFencingToken: session.lease!.fencingToken,
      mode: 'paper' as const,
      origin: 'manual' as const,
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      quantity: '0.25',
      limitPrice: '60000.00',
      marketCheckpoint: {
        streamId: 'binance:BTCUSDT:1m',
        sequence: 100,
        eventId: 'market-event-100',
      },
      actorId: 'trader-1',
      correlationId: 'correlation-order-1',
      occurredAt: '2026-07-18T17:20:02.000Z',
      recordedAt: '2026-07-18T17:20:02.100Z',
      eligibilityCheckedAt: '2026-07-18T17:20:02.050Z',
    };
  }

  it('atomically persists Order, immutable history, and Outbox event', async () => {
    const command = await createCommand();
    const order = await service.create(command);

    const row = await prisma.paperOrder.findUnique({ where: { id: order.id } });
    const history = await prisma.orderLifecycleEntry.findMany({
      where: { orderId: order.id },
    });
    const event = await prisma.outboxEvent.findUnique({
      where: { eventId: `order:${order.id}:v1` },
    });
    expect(row).toMatchObject({
      workspaceId: WS,
      status: OrderStatus.PROPOSED,
      version: 1,
      clientOrderId: command.clientOrderId,
    });
    expect(row?.quantity.toFixed()).toBe('0.25');
    expect(history).toHaveLength(1);
    expect(event?.status).toBe('pending');
    expect(event?.payload).toMatchObject({
      quantity: '0.25',
      toStatus: OrderStatus.PROPOSED,
    });

    const transitioned = await service.transition({
      workspaceId: WS,
      orderId: order.id,
      expectedVersion: 1,
      toStatus: OrderStatus.RISK_PENDING,
      eventType: 'OrderRiskRequested',
      actorId: 'orders-service',
      correlationId: 'correlation-order-1',
      occurredAt: '2026-07-18T17:20:03.000Z',
      recordedAt: '2026-07-18T17:20:03.100Z',
    });
    expect(transitioned.version).toBe(2);
    expect(await prisma.orderLifecycleEntry.count({ where: { orderId: order.id } })).toBe(2);
    expect(
      await prisma.outboxEvent.findUnique({ where: { eventId: `order:${order.id}:v2` } }),
    ).not.toBeNull();
  });

  it('enforces idempotency/client identity, optimistic version, and workspace isolation', async () => {
    const command = await createCommand();
    const first = await service.create(command);
    expect((await service.create(command)).id).toBe(first.id);
    expect(await prisma.paperOrder.count({ where: { workspaceId: WS } })).toBe(1);

    await expect(service.create({ ...command, quantity: '0.26' })).rejects.toThrow(
      /reused with a different intent/,
    );
    await expect(
      service.create({ ...command, idempotencyKey: 'another-key', quantity: '0.26' }),
    ).rejects.toThrow(/reused with a different intent/);
    expect(await service.get(OTHER_WS, first.id)).toBeNull();
    expect(await service.list(OTHER_WS)).toEqual([]);

    await service.transition({
      workspaceId: WS,
      orderId: first.id,
      expectedVersion: 1,
      toStatus: OrderStatus.RISK_PENDING,
      eventType: 'OrderRiskRequested',
      actorId: 'orders-service',
      occurredAt: '2026-07-18T17:20:03.000Z',
      recordedAt: '2026-07-18T17:20:03.100Z',
    });
    await expect(
      service.transition({
        workspaceId: WS,
        orderId: first.id,
        expectedVersion: 1,
        toStatus: OrderStatus.RISK_PENDING,
        eventType: 'OrderRiskRequested',
        actorId: 'orders-service',
        occurredAt: '2026-07-18T17:20:04.000Z',
        recordedAt: '2026-07-18T17:20:04.100Z',
      }),
    ).rejects.toThrow(/optimistic version conflict/);
  });

  it('rolls back Order and history when Outbox append fails', async () => {
    const command = await createCommand();
    const failing = new OrderService(orders, accounts, sessions, transactions, {
      append: async () => {
        throw new Error('injected order outbox failure');
      },
    } as TransactionalOutboxAppender);

    await expect(failing.create(command)).rejects.toThrow(/injected order outbox failure/);
    expect(await prisma.paperOrder.count({ where: { workspaceId: WS } })).toBe(0);
    expect(await prisma.orderLifecycleEntry.count({ where: { workspaceId: WS } })).toBe(0);

    const created = await service.create(command);
    await expect(
      failing.transition({
        workspaceId: WS,
        orderId: created.id,
        expectedVersion: 1,
        toStatus: OrderStatus.RISK_PENDING,
        eventType: 'OrderRiskRequested',
        actorId: 'orders-service',
        occurredAt: '2026-07-18T17:20:05.000Z',
        recordedAt: '2026-07-18T17:20:05.100Z',
      }),
    ).rejects.toThrow(/injected order outbox failure/);
    expect(
      await prisma.paperOrder.findUnique({
        where: { id: created.id },
        select: { version: true, status: true },
      }),
    ).toEqual({ version: 1, status: OrderStatus.PROPOSED });
    expect(await prisma.orderLifecycleEntry.count({ where: { orderId: created.id } })).toBe(1);
  });
});
