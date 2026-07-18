import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';

const WS = 'ws-us156';
const OTHER = 'ws-us156-other';
const timestamp = '2026-07-18T16:00:00.000Z';

describe('US156/US157 — durable Trading Session and fencing', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const accounts = new PrismaPaperAccountRepository(prisma);
  const sessions = new PrismaTradingSessionRepository(prisma);
  const outbox = new TransactionalOutboxAppender();
  const paperAccounts = new PaperAccountService(accounts, transactions, outbox);
  const service = new TradingSessionService(sessions, accounts, transactions, outbox);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({
      where: {
        workspaceId: { in: [WS, OTHER] },
        aggregateType: { in: ['TradingSession', 'PaperAccount'] },
      },
    });
    await prisma.tradingSession.deleteMany({ where: { workspaceId: { in: [WS, OTHER] } } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: { in: [WS, OTHER] } } });
  }

  async function openAccount(workspaceId = WS) {
    return paperAccounts.create({
      workspaceId,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: `account-${workspaceId}`,
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });
  }

  it('creates a durable manual session and starts with a fenced lease', async () => {
    const account = await openAccount();
    const created = await service.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-1',
      origin: 'manual',
      idempotencyKey: 'session-open',
      actorId: 'operator-1',
      correlationId: 'corr-session',
      createdAt: timestamp,
      recordedAt: timestamp,
    });
    expect(created.status).toBe(TradingSessionStatus.CREATED);

    const started = await service.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-18T16:00:01.000Z',
      nowIso: '2026-07-18T16:00:01.000Z',
      leaseTtlMs: 30_000,
    });
    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.lease?.fencingToken).toBe(1);
    expect(started.lease?.ownerId).toBe('worker-1');

    const eligible = service.assertEligible(started, 1, '2026-07-18T16:00:02.000Z');
    expect(eligible.eligible).toBe(true);

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateType: 'TradingSession', aggregateId: created.id },
      orderBy: { aggregateVersion: 'asc' },
    });
    expect(events.map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['TradingSessionCreated', 'TradingSessionStarted']),
    );
  });

  it('rejects stale fencing tokens and non-running execution', async () => {
    const account = await openAccount();
    const created = await service.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-2',
      origin: 'manual',
      idempotencyKey: 'session-fence',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });
    const started = await service.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-18T16:00:01.000Z',
      nowIso: '2026-07-18T16:00:01.000Z',
    });

    await expect(
      service.pause({
        workspaceId: WS,
        sessionId: started.id,
        actorId: 'operator-1',
        ownerId: 'worker-1',
        fencingToken: 99,
        recordedAt: '2026-07-18T16:00:02.000Z',
        nowIso: '2026-07-18T16:00:02.000Z',
      }),
    ).rejects.toThrow(/stale fencing token/);

    const paused = await service.pause({
      workspaceId: WS,
      sessionId: started.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: '2026-07-18T16:00:03.000Z',
      nowIso: '2026-07-18T16:00:03.000Z',
    });
    expect(paused.status).toBe(TradingSessionStatus.PAUSED);
    expect(service.evaluateEligibility(paused, 1, '2026-07-18T16:00:04.000Z').eligible).toBe(false);
  });

  it('scopes lookups by workspace and records invalid transitions', async () => {
    const account = await openAccount();
    const created = await service.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-3',
      origin: 'manual',
      idempotencyKey: 'session-scope',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });
    expect(await service.get(OTHER, created.id)).toBeNull();

    const started = await service.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-18T16:00:01.000Z',
      nowIso: '2026-07-18T16:00:01.000Z',
    });
    const stopped = await service.stop({
      workspaceId: WS,
      sessionId: started.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: '2026-07-18T16:00:02.000Z',
      nowIso: '2026-07-18T16:00:02.000Z',
    });
    expect(stopped.status).toBe(TradingSessionStatus.STOPPED);

    await expect(
      service.start({
        workspaceId: WS,
        sessionId: stopped.id,
        actorId: 'operator-1',
        ownerId: 'worker-2',
        recordedAt: '2026-07-18T16:00:03.000Z',
        nowIso: '2026-07-18T16:00:03.000Z',
      }),
    ).rejects.toThrow(/invalid trading session transition/);

    const rejected = await prisma.outboxEvent.findMany({
      where: {
        workspaceId: WS,
        eventType: 'TradingSessionTransitionRejected',
        payload: { path: ['sessionId'], equals: created.id },
      },
    });
    expect(rejected.length).toBeGreaterThanOrEqual(1);
  });
});
