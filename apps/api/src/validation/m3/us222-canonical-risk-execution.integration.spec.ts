import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CanonicalOrderPathService } from '../../modules/canonical-order-path';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import { ExecutionEngineService } from '../../modules/execution-engine';
import { PrismaFillRepository } from '../../modules/execution-engine';
import { PrismaCashReservationAdapter } from '../../modules/ledger/adapters/prisma-cash-reservation.adapter';
import { LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  M2_BASELINE_RISK_POLICY,
  RiskDecisionService,
  RiskDecisionStatus,
} from '../../modules/risk';
import { PrismaRiskDecisionRepository } from '../../modules/risk/persistence/prisma-risk-decision.repository';
import { createSignalIntent, SignalIntentDirection } from '../../modules/strategy-runtime';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us222';
const t0 = '2026-07-29T17:10:00.000Z';
const CHECKPOINT = Object.freeze({
  streamId: 'binance:BTCUSDT:1m',
  sequence: 42,
  eventId: 'market-event-us222',
});

describe('US222 — strategy-origin Orders through canonical Risk + Execution', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accountRepo = new PrismaPaperAccountRepository(prisma);
  const sessionRepo = new PrismaTradingSessionRepository(prisma);
  const orderRepo = new PrismaOrderRepository(prisma);
  const fillRepo = new PrismaFillRepository(prisma);
  const accountService = new PaperAccountService(accountRepo, transactions, outbox);
  const sessionService = new TradingSessionService(
    sessionRepo,
    accountRepo,
    transactions,
    outbox,
    { get: async () => null } as never,
    {
      loadContext: async () => {
        throw new Error('RuntimePort unexpected in US222 path');
      },
    } as never,
  );
  const ledger = new LedgerService(
    new PrismaLedgerRepository(prisma),
    accountService,
    transactions,
    outbox,
  );
  const reservations = new PrismaCashReservationAdapter(prisma, transactions, outbox, ledger);
  const orders = new OrderService(
    orderRepo,
    accountRepo,
    sessionRepo,
    transactions,
    outbox,
    reservations,
  );
  const risk = new RiskDecisionService(
    M2_BASELINE_RISK_POLICY,
    new PrismaRiskDecisionRepository(prisma),
    transactions,
    outbox,
  );
  const engine = new ExecutionEngineService(
    new PaperExecutionAdapter(),
    orders,
    sessionRepo,
    fillRepo,
    transactions,
    outbox,
    M2_PAPER_FILL_CONFIGURATION,
  );
  const path = new CanonicalOrderPathService(orders, risk, reservations, engine);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.riskDecision.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperOrder.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashReservation.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.tradingSession.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }

  async function runningAccountAndSession() {
    const account = await accountService.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '100000',
      idempotencyKey: 'account-us222',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us222',
      actorId: 'ledger-1',
      recordedAt: '2026-07-29T17:10:00.100Z',
    });
    const created = await sessionService.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: 'manual-order-deployment',
      origin: 'manual',
      idempotencyKey: 'session-us222',
      actorId: 'trader-1',
      createdAt: t0,
      recordedAt: t0,
    });
    const session = await sessionService.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-29T17:10:01.000Z',
      nowIso: '2026-07-29T17:10:01.000Z',
      leaseTtlMs: 60_000,
    });
    return { account, session };
  }

  function riskContext(accountId: string, sessionId: string, fencingToken: number) {
    return {
      account: {
        id: accountId,
        workspaceId: WS,
        mode: 'paper',
        status: 'active',
        version: 1,
      },
      session: {
        id: sessionId,
        workspaceId: WS,
        paperAccountId: accountId,
        status: 'running',
        version: 2,
        fencingToken,
        reconciled: true,
      },
      market: {
        workspaceId: WS,
        streamId: CHECKPOINT.streamId,
        eventId: CHECKPOINT.eventId,
        sequence: CHECKPOINT.sequence,
        instrument: 'BTCUSDT',
        health: 'healthy',
        referencePrice: '100',
        occurredAt: '2026-07-29T17:10:02.000Z',
        projectionVersion: CHECKPOINT.sequence,
      },
      cash: {
        workspaceId: WS,
        paperAccountId: accountId,
        currency: 'USDT',
        availableCash: '100000',
        version: 1,
        reconciled: true,
      },
      reservation: null,
      position: null,
      portfolio: {
        workspaceId: WS,
        paperAccountId: accountId,
        checkpointId: 'portfolio-us222-v1',
        version: 1,
        reconciled: true,
      },
      duplicateIntent: false,
      unresolvedReconciliation: false,
    };
  }

  it('runs strategy Order through existing Risk + Execution Engine without forks', async () => {
    const { account, session } = await runningAccountAndSession();
    const signal = createSignalIntent({
      workspaceId: WS,
      deploymentId: 'deployment-us222',
      sessionId: session.id,
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1m',
      direction: SignalIntentDirection.BUY,
      marketCheckpoint: CHECKPOINT,
      generatedAt: '2026-07-29T17:10:02.000Z',
      recordedAt: '2026-07-29T17:10:02.100Z',
      actorId: 'runtime-1',
    });
    const proposed = await orders.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      quantity: '1',
      recordedAt: '2026-07-29T17:10:03.000Z',
      eligibilityCheckedAt: '2026-07-29T17:10:03.000Z',
    });
    expect(proposed).not.toBeNull();

    const result = await path.runCanonicalPath({
      workspaceId: WS,
      orderId: proposed!.id,
      actorId: 'canonical-path',
      correlationId: 'corr-us222',
      evaluatedAt: '2026-07-29T17:10:04.000Z',
      recordedAt: '2026-07-29T17:10:04.100Z',
      occurredAt: '2026-07-29T17:10:04.000Z',
      risk: riskContext(account.id, session.id, session.lease!.fencingToken),
      reservation: { currency: 'USDT', amount: '110' },
      requireStrategyOrigin: true,
      marketState: {
        streamId: CHECKPOINT.streamId,
        eventId: CHECKPOINT.eventId,
        sequence: CHECKPOINT.sequence,
        referencePrice: '100',
        occurredAt: '2026-07-29T17:10:02.000Z',
      },
    });

    expect(result.outcome).toBe('filled');
    expect(result.order.status).toBe(OrderStatus.FILLED);
    expect(result.order.intent.origin).toBe('strategy');
    expect(result.order.intent.signalIntentId).toBe(signal.id);
    expect(result.order.intent.signalIntentHash).toBe(signal.intentHash);
    expect(result.riskDecision?.status).toBe(RiskDecisionStatus.APPROVED);
    expect(result.riskDecision?.intentHash).toBe(proposed!.intent.intentHash);
    expect(result.execution?.fill).not.toBeNull();

    const fills = await prisma.paperFill.findMany({
      where: { workspaceId: WS, orderId: proposed!.id },
    });
    expect(fills).toHaveLength(1);
  });

  it('duplicate canonical execution is idempotent (no second Fill)', async () => {
    const { account, session } = await runningAccountAndSession();
    const signal = createSignalIntent({
      workspaceId: WS,
      deploymentId: 'deployment-us222-dup',
      sessionId: session.id,
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1m',
      direction: SignalIntentDirection.BUY,
      marketCheckpoint: { ...CHECKPOINT, sequence: 43, eventId: 'market-event-us222-dup' },
      generatedAt: '2026-07-29T17:10:02.000Z',
      recordedAt: '2026-07-29T17:10:02.100Z',
      actorId: 'runtime-1',
    });
    const proposed = await orders.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      quantity: '0.5',
      recordedAt: '2026-07-29T17:10:03.000Z',
      eligibilityCheckedAt: '2026-07-29T17:10:03.000Z',
    });
    const command = {
      workspaceId: WS,
      orderId: proposed!.id,
      actorId: 'canonical-path',
      evaluatedAt: '2026-07-29T17:10:04.000Z',
      recordedAt: '2026-07-29T17:10:04.100Z',
      occurredAt: '2026-07-29T17:10:04.000Z',
      risk: {
        ...riskContext(account.id, session.id, session.lease!.fencingToken),
        market: {
          ...riskContext(account.id, session.id, session.lease!.fencingToken).market!,
          sequence: 43,
          eventId: 'market-event-us222-dup',
        },
      },
      reservation: { currency: 'USDT', amount: '55' },
      requireStrategyOrigin: true as const,
      marketState: {
        streamId: CHECKPOINT.streamId,
        eventId: 'market-event-us222-dup',
        sequence: 43,
        referencePrice: '100',
        occurredAt: '2026-07-29T17:10:02.000Z',
      },
    };

    const first = await path.runCanonicalPath(command);
    const second = await path.runCanonicalPath(command);

    expect(first.outcome).toBe('filled');
    expect(second.outcome).toBe('already_executed');
    expect(second.order.id).toBe(first.order.id);
    expect(second.order.intent.signalIntentHash).toBe(signal.intentHash);
    expect(
      await prisma.paperFill.count({ where: { workspaceId: WS, orderId: proposed!.id } }),
    ).toBe(1);
  });

  it('manual Orders still use the same canonical path (regression)', async () => {
    const { account, session } = await runningAccountAndSession();
    const manual = await orders.create({
      clientOrderId: 'manual-us222',
      idempotencyKey: 'manual-us222',
      workspaceId: WS,
      paperAccountId: account.id,
      tradingSessionId: session.id,
      sessionFencingToken: session.lease!.fencingToken,
      mode: 'paper',
      origin: 'manual',
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: '1',
      marketCheckpoint: CHECKPOINT,
      actorId: 'trader-1',
      occurredAt: '2026-07-29T17:10:03.000Z',
      recordedAt: '2026-07-29T17:10:03.000Z',
      eligibilityCheckedAt: '2026-07-29T17:10:03.000Z',
    });

    const result = await path.runCanonicalPath({
      workspaceId: WS,
      orderId: manual.id,
      actorId: 'canonical-path',
      evaluatedAt: '2026-07-29T17:10:04.000Z',
      recordedAt: '2026-07-29T17:10:04.100Z',
      occurredAt: '2026-07-29T17:10:04.000Z',
      risk: riskContext(account.id, session.id, session.lease!.fencingToken),
      reservation: { currency: 'USDT', amount: '110' },
      requireStrategyOrigin: false,
      marketState: {
        streamId: CHECKPOINT.streamId,
        eventId: CHECKPOINT.eventId,
        sequence: CHECKPOINT.sequence,
        referencePrice: '100',
        occurredAt: '2026-07-29T17:10:02.000Z',
      },
    });

    expect(result.outcome).toBe('filled');
    expect(result.order.intent.origin).toBe('manual');
    expect(result.order.intent.signalIntentId).toBeNull();
  });
});
