import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { createTacticalEnvelope } from '../../modules/tactical-envelope';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  createTradingSession,
  transitionSession,
} from '../../modules/trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';

const WS = 'ws-rc19-e3';
const timestamp = '2026-08-10T15:00:00.000Z';

/**
 * RC-19 Epic 3 — Tactical Envelope schema stub persistence.
 * Proves optional attachment + round-trip; Runtime/service create path ignore envelope.
 */
describe('RC-19 Epic 3 — Tactical Envelope stub persistence', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const accounts = new PrismaPaperAccountRepository(prisma);
  const sessions = new PrismaTradingSessionRepository(prisma);
  const outbox = new TransactionalOutboxAppender();
  const paperAccounts = new PaperAccountService(accounts, transactions, outbox);
  const deployments = {
    get: vi.fn(async () => {
      throw new Error('Deployment lookup unexpected in RC-19 Epic 3 path');
    }),
  };
  const runtime = {
    loadContext: vi.fn(async () => {
      throw new Error('RuntimePort unexpected in RC-19 Epic 3 path');
    }),
  };
  const tradingSessions = new TradingSessionService(
    sessions,
    accounts,
    transactions,
    outbox,
    deployments as never,
    runtime as never,
  );

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({
      where: {
        workspaceId: WS,
        aggregateType: { in: ['TradingSession', 'PaperAccount'] },
      },
    });
    await prisma.tradingSession.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }

  it('creates sessions without an envelope by default (behaviour unchanged)', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'rc19-e3-account-default',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const session = await tradingSessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-rc19-e3',
      origin: 'manual',
      idempotencyKey: 'rc19-e3-session-default',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    expect(session.tacticalEnvelope).toBeNull();
    expect(session.status).toBe(TradingSessionStatus.CREATED);

    const row = await prisma.tradingSession.findUnique({ where: { id: session.id } });
    expect(row?.tacticalEnvelope).toBeNull();
  });

  it('persists an optional Tactical Envelope and round-trips stably', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'rc19-e3-account-envelope',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const envelope = createTacticalEnvelope({
      timeframe: '5m',
      allowedStrategyVersion: 'trend-v1',
      allowedParameterRanges: {
        riskPerTrade: { min: 0.5, max: 2, step: 0.5 },
      },
      riskProfileReference: 'risk-profile:paper-default',
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['5m', '15m'],
    });

    const domainSession = createTradingSession({
      id: 'session-rc19-e3-envelope',
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-rc19-e3-env',
      tacticalEnvelope: envelope,
      origin: 'manual',
      actorId: 'operator-1',
      idempotencyKey: 'rc19-e3-session-envelope',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    await transactions.run(async (transaction) => {
      await sessions.create(domainSession, transaction);
    });

    const loaded = await sessions.findById(WS, domainSession.id);
    expect(loaded?.tacticalEnvelope).toEqual(envelope);

    const row = await prisma.tradingSession.findUnique({ where: { id: domainSession.id } });
    expect(row?.tacticalEnvelope).toEqual(envelope);
  });

  it('keeps lifecycle behaviour unchanged when envelope is absent', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '2500.5',
      idempotencyKey: 'rc19-e3-lifecycle-account',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const created = await tradingSessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-rc19-e3-life',
      origin: 'manual',
      idempotencyKey: 'rc19-e3-lifecycle-session',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    expect(created.tacticalEnvelope).toBeNull();

    const started = await tradingSessions.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      recordedAt: '2026-08-10T15:00:01.000Z',
      nowIso: '2026-08-10T15:00:01.000Z',
      leaseTtlMs: 30_000,
    });

    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.tacticalEnvelope).toBeNull();
    expect(started.lease?.fencingToken).toBe(1);

    const eligible = tradingSessions.assertEligible(started, 1, '2026-08-10T15:00:02.000Z');
    expect(eligible.eligible).toBe(true);

    const paused = await tradingSessions.pause({
      workspaceId: WS,
      sessionId: started.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: '2026-08-10T15:00:03.000Z',
      nowIso: '2026-08-10T15:00:03.000Z',
    });
    expect(paused.status).toBe(TradingSessionStatus.PAUSED);
    expect(paused.tacticalEnvelope).toBeNull();
  });

  it('preserves envelope across domain transitions without runtime enforcement', () => {
    const envelope = createTacticalEnvelope({
      timeframe: '15m',
      allowedStrategyVersion: 'mr-v2',
    });
    const created = createTradingSession({
      id: 'session-rc19-e3-domain',
      workspaceId: WS,
      paperAccountId: 'account-local',
      deploymentId: 'deployment-local',
      tacticalEnvelope: envelope,
      origin: 'manual',
      actorId: 'operator-1',
      idempotencyKey: 'rc19-e3-domain',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    const running = transitionSession(
      transitionSession(created, TradingSessionStatus.STARTING, timestamp),
      TradingSessionStatus.RUNNING,
      '2026-08-10T15:00:01.000Z',
    );

    expect(running.tacticalEnvelope).toEqual(envelope);
    expect(running.status).toBe(TradingSessionStatus.RUNNING);
  });
});
