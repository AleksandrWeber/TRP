import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing';
import type { CashReservationPort } from '../../modules/ledger';
import { createOrder } from '../../modules/orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us163';
const t0 = '2026-07-18T18:05:00.000Z';

describe('US163 — idempotent Orders-owned cancellation lifecycle', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const orders = new PrismaOrderRepository(prisma);
  const releaseCash = vi.fn(async () => null);
  const cashReservations = {
    reserveCash: async () => {
      throw new Error('not used');
    },
    releaseCash,
    findByOrder: async () => null,
  } satisfies CashReservationPort;
  const service = new OrderService(
    orders,
    null as never,
    null as never,
    transactions,
    outbox,
    cashReservations,
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
    await prisma.paperOrder.deleteMany({ where: { workspaceId: WS } });
  }

  async function seedOrder(suffix: string) {
    const order = createOrder(
      createOrderIntent({
        clientOrderId: `client-${suffix}`,
        idempotencyKey: `create-${suffix}`,
        workspaceId: WS,
        paperAccountId: 'account-us163',
        tradingSessionId: 'session-us163',
        sessionFencingToken: 1,
        mode: 'paper',
        origin: 'manual',
        instrument: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        quantity: '1',
        limitPrice: '100',
        reduceOnly: false,
        marketCheckpoint: {
          streamId: 'book:BTCUSDT',
          sequence: 42,
          eventId: 'market-event-us163',
        },
        actorId: 'trader-us163',
        occurredAt: t0,
        recordedAt: t0,
      }),
    );
    await transactions.run((context) => orders.create(order, context));
    return order;
  }

  async function move(orderId: string, toStatus: OrderStatus, version: number, extra = {}) {
    return service.transition({
      workspaceId: WS,
      orderId,
      expectedVersion: version,
      toStatus,
      eventType: `Order${toStatus}`,
      actorId: 'internal-engine',
      occurredAt: `2026-07-18T18:05:0${version}.000Z`,
      recordedAt: `2026-07-18T18:05:0${version}.100Z`,
      ...extra,
    });
  }

  const cancelCommand = (orderId: string) =>
    ({
      workspaceId: WS,
      orderId,
      idempotencyKey: `cancel-${orderId}`,
      actorId: 'trader-us163',
      correlationId: 'corr-us163',
      occurredAt: '2026-07-18T18:05:08.000Z',
      recordedAt: '2026-07-18T18:05:08.100Z',
    }) as const;

  it('completes pre-submission cancellation, releases Ledger cash once, and is idempotent', async () => {
    const created = await seedOrder('reserved');
    await move(created.id, OrderStatus.RISK_PENDING, 1);
    await move(created.id, OrderStatus.APPROVED, 2, { riskDecisionId: 'risk-us163' });
    await move(created.id, OrderStatus.RESERVED, 3, { reservationId: 'cashres-us163' });

    const cancelled = await service.cancel(cancelCommand(created.id));
    const duplicate = await service.cancel(cancelCommand(created.id));
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    expect(duplicate).toEqual(cancelled);
    expect(releaseCash).toHaveBeenCalledTimes(1);
    expect(await prisma.orderLifecycleEntry.count({ where: { orderId: created.id } })).toBe(6);
  });

  it('leaves submitted Orders cancel-pending for Execution Engine adapter handling', async () => {
    const created = await seedOrder('submitted');
    await move(created.id, OrderStatus.RISK_PENDING, 1);
    await move(created.id, OrderStatus.APPROVED, 2, { riskDecisionId: 'risk-submitted' });
    await move(created.id, OrderStatus.RESERVED, 3, { reservationId: 'cashres-submitted' });
    await move(created.id, OrderStatus.EXECUTABLE, 4);
    await move(created.id, OrderStatus.SUBMITTED, 5, { adapterOrderId: 'adapter-us163' });

    const pending = await service.cancel(cancelCommand(created.id));
    const duplicate = await service.cancel(cancelCommand(created.id));
    expect(pending.status).toBe(OrderStatus.CANCEL_PENDING);
    expect(duplicate).toEqual(pending);
    expect(releaseCash).not.toHaveBeenCalled();
  });

  it('rejects cancellation of filled or rejected terminal Orders', async () => {
    const created = await seedOrder('rejected');
    await move(created.id, OrderStatus.REJECTED, 1, { reason: 'risk_rejected' });
    await expect(service.cancel(cancelCommand(created.id))).rejects.toThrow(
      /cannot be cancelled from rejected/,
    );
  });
});
