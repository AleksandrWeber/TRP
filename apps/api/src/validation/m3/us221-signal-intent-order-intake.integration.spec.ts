import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import type { CashReservationPort } from '../../modules/ledger';
import { createSignalIntent, SignalIntentDirection } from '../../modules/strategy-runtime';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us221';
const t0 = '2026-07-29T16:30:00.000Z';

describe('US221 — Signal Intent → Order proposal integration', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accounts = new PrismaPaperAccountRepository(prisma);
  const sessions = new PrismaTradingSessionRepository(prisma);
  const orders = new PrismaOrderRepository(prisma);
  const accountService = new PaperAccountService(accounts, transactions, outbox);
  const sessionService = new TradingSessionService(
    sessions,
    accounts,
    transactions,
    outbox,
    { get: async () => null } as never,
    {
      loadContext: async () => {
        throw new Error('RuntimePort unexpected in US221 Orders intake');
      },
    } as never,
  );
  const cashReservations: CashReservationPort = {
    reserveCash: async () => {
      throw new Error('not used');
    },
    releaseCash: async () => null,
    findByOrder: async () => null,
  };
  const service = new OrderService(
    orders,
    accounts,
    sessions,
    transactions,
    outbox,
    cashReservations,
  );

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperOrder.deleteMany({ where: { workspaceId: WS } });
    await prisma.tradingSession.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }

  async function runningSession() {
    const account = await accountService.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '10000',
      idempotencyKey: 'account-us221',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    const created = await sessionService.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-order-deployment',
      origin: 'manual',
      idempotencyKey: 'session-us221',
      actorId: 'trader-1',
      createdAt: t0,
      recordedAt: t0,
    });
    const session = await sessionService.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-29T16:30:01.000Z',
      nowIso: '2026-07-29T16:30:01.000Z',
      leaseTtlMs: 60_000,
    });
    return { account, session };
  }

  function buildSignal(sessionId: string, salt = '1') {
    return createSignalIntent({
      workspaceId: WS,
      deploymentId: 'deployment-us221',
      sessionId,
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1m',
      direction: SignalIntentDirection.BUY,
      confidence: 0.8,
      marketCheckpoint: {
        streamId: 'binance:BTCUSDT:1m',
        sequence: Number(salt),
        eventId: `market-event-us221-${salt}`,
      },
      generatedAt: '2026-07-29T16:30:02.000Z',
      recordedAt: '2026-07-29T16:30:02.100Z',
      actorId: 'runtime-1',
      correlationId: `corr-us221-${salt}`,
    });
  }

  it('persists strategy-origin Order from Signal Intent with immutable reference', async () => {
    const { account, session } = await runningSession();
    const signal = buildSignal(session.id);
    const order = await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      quantity: '0.1',
      recordedAt: '2026-07-29T16:30:03.000Z',
      eligibilityCheckedAt: '2026-07-29T16:30:03.000Z',
    });

    expect(order).not.toBeNull();
    expect(order!.status).toBe(OrderStatus.PROPOSED);
    expect(order!.intent.origin).toBe('strategy');
    expect(order!.intent.signalIntentId).toBe(signal.id);
    expect(order!.intent.signalIntentHash).toBe(signal.intentHash);

    const row = await prisma.paperOrder.findUnique({ where: { id: order!.id } });
    expect(row).not.toBeNull();
    const intent = row!.intent as Record<string, unknown>;
    expect(intent.signalIntentId).toBe(signal.id);
    expect(intent.signalIntentHash).toBe(signal.intentHash);
    expect(intent.origin).toBe('strategy');
  });

  it('NO_ACTION produces no Order row', async () => {
    const before = await prisma.paperOrder.count({ where: { workspaceId: WS } });
    const result = await service.proposeOrderFromSignalIntent({
      kind: 'NO_ACTION',
      reason: 'close equals open',
    });
    const after = await prisma.paperOrder.count({ where: { workspaceId: WS } });
    expect(result).toBeNull();
    expect(after).toBe(before);
  });

  it('duplicate Signal Intent processing is idempotent (replay)', async () => {
    const { account, session } = await runningSession();
    const signal = buildSignal(session.id, '2');
    const command = {
      kind: 'SIGNAL_INTENT' as const,
      signalIntent: signal,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      quantity: '0.2',
      recordedAt: '2026-07-29T16:30:04.000Z',
      eligibilityCheckedAt: '2026-07-29T16:30:04.000Z',
    };
    const first = await service.proposeOrderFromSignalIntent(command);
    const second = await service.proposeOrderFromSignalIntent({
      ...command,
      recordedAt: '2026-07-29T16:31:00.000Z',
      eligibilityCheckedAt: '2026-07-29T16:31:00.000Z',
    });

    expect(second!.id).toBe(first!.id);
    expect(second!.intent.intentHash).toBe(first!.intent.intentHash);
    const count = await prisma.paperOrder.count({ where: { workspaceId: WS } });
    expect(count).toBe(1);
  });

  it('rejects conflicting reprocessing of the same Signal Intent identity', async () => {
    const { account, session } = await runningSession();
    const signal = buildSignal(session.id, '3');
    await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      quantity: '0.3',
      recordedAt: '2026-07-29T16:30:05.000Z',
      eligibilityCheckedAt: '2026-07-29T16:30:05.000Z',
    });

    await expect(
      service.proposeOrderFromSignalIntent({
        kind: 'SIGNAL_INTENT',
        signalIntent: signal,
        paperAccountId: account.id,
        sessionFencingToken: session.lease!.fencingToken,
        quantity: '0.9',
        recordedAt: '2026-07-29T16:30:06.000Z',
        eligibilityCheckedAt: '2026-07-29T16:30:06.000Z',
      }),
    ).rejects.toThrow(/different intent/);
  });
});
