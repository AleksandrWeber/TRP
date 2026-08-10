import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { DEFAULT_BINANCE_EXCHANGE_SCOPE_ID } from '../../modules/exchange-scope';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';

const WS = 'ws-rc19-e1';
const timestamp = '2026-08-10T12:00:00.000Z';

/**
 * RC-19 Epic 1 — Exchange Scope identity persistence.
 * Proves Session/Account store default Binance scope without changing paper behavior.
 */
describe('RC-19 Epic 1 — Exchange Scope identity persistence', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const accounts = new PrismaPaperAccountRepository(prisma);
  const sessions = new PrismaTradingSessionRepository(prisma);
  const outbox = new TransactionalOutboxAppender();
  const paperAccounts = new PaperAccountService(accounts, transactions, outbox);
  const deployments = {
    get: vi.fn(async () => {
      throw new Error('Deployment lookup unexpected in RC-19 Epic 1 path');
    }),
  };
  const runtime = {
    loadContext: vi.fn(async () => {
      throw new Error('RuntimePort unexpected in RC-19 Epic 1 path');
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

  it('persists Paper Account with the default Binance Exchange Scope', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'rc19-e1-account',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    expect(account.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const row = await prisma.paperAccount.findUnique({ where: { id: account.id } });
    expect(row?.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(row?.openingCapital.toFixed()).toBe('1000');
    expect(row?.currency).toBe('USDT');
    expect(row?.mode).toBe('paper');
  });

  it('persists Trading Session with Exchange Scope inherited from Paper Account', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'rc19-e1-account-session',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const session = await tradingSessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-rc19-e1',
      origin: 'manual',
      idempotencyKey: 'rc19-e1-session',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    expect(session.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(session.exchangeScopeId).toBe(account.exchangeScopeId);
    expect(session.status).toBe(TradingSessionStatus.CREATED);

    const row = await prisma.tradingSession.findUnique({ where: { id: session.id } });
    expect(row?.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(row?.paperAccountId).toBe(account.id);
    expect(row?.status).toBe(TradingSessionStatus.CREATED);
  });

  it('keeps paper trading lifecycle behavior unchanged after scope identity', async () => {
    const account = await paperAccounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '2500.5',
      idempotencyKey: 'rc19-e1-lifecycle-account',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const created = await tradingSessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-deployment-rc19-e1-life',
      origin: 'manual',
      idempotencyKey: 'rc19-e1-lifecycle-session',
      actorId: 'operator-1',
      createdAt: timestamp,
      recordedAt: timestamp,
    });

    const started = await tradingSessions.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      recordedAt: '2026-08-10T12:00:01.000Z',
      nowIso: '2026-08-10T12:00:01.000Z',
      leaseTtlMs: 30_000,
    });

    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.lease?.fencingToken).toBe(1);
    expect(started.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const eligible = tradingSessions.assertEligible(started, 1, '2026-08-10T12:00:02.000Z');
    expect(eligible.eligible).toBe(true);

    const paused = await tradingSessions.pause({
      workspaceId: WS,
      sessionId: started.id,
      actorId: 'operator-1',
      ownerId: 'worker-1',
      fencingToken: 1,
      recordedAt: '2026-08-10T12:00:03.000Z',
      nowIso: '2026-08-10T12:00:03.000Z',
    });
    expect(paused.status).toBe(TradingSessionStatus.PAUSED);
    expect(paused.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });
});
