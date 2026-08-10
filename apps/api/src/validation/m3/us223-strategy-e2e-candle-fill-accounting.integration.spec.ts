import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CanonicalOrderPathService } from '../../modules/canonical-order-path';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
} from '../../modules/event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import { ExecutionEngineService, PrismaFillRepository } from '../../modules/execution-engine';
import { PrismaCashReservationAdapter } from '../../modules/ledger/adapters/prisma-cash-reservation.adapter';
import { LedgerCauseType, LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  FILL_ACCOUNTING_CONSUMER_ID,
  PositionAccountingConsumer,
  PositionSide,
  PrismaPositionRepository,
} from '../../modules/positions';
import {
  M2_BASELINE_RISK_POLICY,
  RiskDecisionService,
  RiskDecisionStatus,
} from '../../modules/risk';
import { PrismaRiskDecisionRepository } from '../../modules/risk/persistence/prisma-risk-decision.repository';
import {
  approveStrategyDeployment,
  createStrategyDeployment,
  withEnforcementAuthorization,
} from '../../modules/strategy-deployment';
import { PrismaStrategyDeploymentRepository } from '../../modules/strategy-deployment/persistence/prisma-strategy-deployment.repository';
import { StrategyDeploymentService } from '../../modules/strategy-deployment/strategy-deployment.service';
import { StrategyTradingPipelineService } from '../../modules/strategy-trading-pipeline';
import { PrismaSignalIntentRepository } from '../../modules/strategy-runtime/persistence/prisma-signal-intent.repository';
import { PrismaStrategyCheckpointRepository } from '../../modules/strategy-runtime/persistence/prisma-strategy-checkpoint.repository';
import { RuntimeEvaluationService } from '../../modules/strategy-runtime/runtime-evaluation.service';
import { RuntimeLifecycleCoordinator } from '../../modules/strategy-runtime/runtime-lifecycle.coordinator';
import { SignalIntentService } from '../../modules/strategy-runtime/signal-intent.service';
import { StrategyCheckpointService } from '../../modules/strategy-runtime/strategy-checkpoint.service';
import { StrategyRuntimeService } from '../../modules/strategy-runtime/strategy-runtime.service';
import { PrismaTradingSessionRepository } from '../../modules/trading-session/persistence/prisma-trading-session.repository';
import { TradingSessionService } from '../../modules/trading-session/trading-session.service';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us223';
const t0 = '2026-07-29T18:20:00.000Z';
const STREAM = 'binance:BTCUSDT:1m';

describe('US223 — end-to-end closed candle → Fill → accounting', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accountRepo = new PrismaPaperAccountRepository(prisma);
  const sessionRepo = new PrismaTradingSessionRepository(prisma);
  const orderRepo = new PrismaOrderRepository(prisma);
  const fillRepo = new PrismaFillRepository(prisma);
  const deploymentRepo = new PrismaStrategyDeploymentRepository(prisma);
  const intentRepo = new PrismaSignalIntentRepository(prisma);
  const checkpointRepo = new PrismaStrategyCheckpointRepository(prisma);
  const positionRepo = new PrismaPositionRepository(prisma);

  const accountService = new PaperAccountService(accountRepo, transactions, outbox);
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
  const accounting = new PositionAccountingConsumer(
    positionRepo,
    ledger,
    accountService,
    transactions,
    new TransactionalConsumerProgress(),
    outbox,
    M2_PAPER_FILL_CONFIGURATION,
  );

  const deploymentService = {
    get: (workspaceId: string, deploymentId: string) =>
      deploymentRepo.findById(workspaceId, deploymentId),
  } as unknown as StrategyDeploymentService;

  const signalIntents = new SignalIntentService(intentRepo, transactions, outbox);
  const checkpoints = new StrategyCheckpointService(checkpointRepo, transactions, outbox);
  const lifecycle = new RuntimeLifecycleCoordinator();
  const evaluations = new RuntimeEvaluationService(
    deploymentService,
    intentRepo,
    checkpointRepo,
    transactions,
    outbox,
  );
  const runtime = new StrategyRuntimeService(
    deploymentService,
    signalIntents,
    checkpoints,
    evaluations,
    lifecycle,
  );
  const sessions = new TradingSessionService(
    sessionRepo,
    accountRepo,
    transactions,
    outbox,
    deploymentService,
    runtime,
  );
  const pipeline = new StrategyTradingPipelineService(runtime, orders, path, accounting);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, eventId: { startsWith: 'fill:' } },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.positionFillApplication.deleteMany({
      where: { position: { workspaceId: WS } },
    });
    await prisma.paperPosition.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.riskDecision.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperOrder.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashReservation.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.signalIntent.deleteMany({ where: { workspaceId: WS } });
    await prisma.strategyCheckpoint.deleteMany({ where: { workspaceId: WS } });
    await prisma.tradingSession.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperStrategyDeployment.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }

  async function seedApprovedDeployment() {
    const draft = createStrategyDeployment({
      id: 'deployment-us223',
      workspaceId: WS,
      strategyId: 'strategy-us223',
      strategyVersion: '1.0.0',
      parameters: { action: 'buy', confidence: 0.8 },
      instrument: 'BTCUSDT',
      timeframe: '1m',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      createdAt: t0,
      recordedAt: t0,
      actorId: 'trader-1',
      idempotencyKey: 'deployment-us223',
    });
    const approved = withEnforcementAuthorization(
      approveStrategyDeployment(draft, {
        approvedAt: t0,
        approvedByActorId: 'admin-1',
        recordedAt: t0,
      }),
      {
        outcome: 'pass',
        validation: 'VALID',
        purpose: 'deployment_bind',
        libraryEntryId: 'lib-entry-us223',
        certificationStatus: 'active',
        eligibilityOutcome: 'eligible',
        checkedAt: t0,
        reasons: Object.freeze([]),
      },
    );
    await transactions.run((tx) => deploymentRepo.create(approved, tx));
    return approved;
  }

  async function seedRunningStrategySession() {
    const deployment = await seedApprovedDeployment();
    const account = await accountService.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '100000',
      idempotencyKey: 'account-us223',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us223',
      actorId: 'ledger-1',
      recordedAt: '2026-07-29T18:20:00.100Z',
    });
    const created = await sessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: deployment.id,
      origin: 'strategy',
      idempotencyKey: 'session-us223',
      actorId: 'trader-1',
      createdAt: t0,
      recordedAt: t0,
    });
    const session = await sessions.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-29T18:20:01.000Z',
      nowIso: '2026-07-29T18:20:01.000Z',
      leaseTtlMs: 60_000,
    });
    return { account, session, deployment };
  }

  function candle(sequence: number, eventId: string) {
    return {
      eventType: 'MarketClosedCandle' as const,
      eventId,
      workspaceId: WS,
      streamId: STREAM,
      sequence,
      openTime: '2026-07-29T18:19:00.000Z',
      closeTime: '2026-07-29T18:19:59.999Z',
      instrument: 'BTCUSDT',
      timeframe: '1m',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 12,
    };
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
        checkpointId: 'portfolio-us223-v1',
        version: 1,
        reconciled: true,
      },
      duplicateIntent: false,
      unresolvedReconciliation: false,
    };
  }

  it('propagates closed candle through Runtime → Order → Risk → Execution → Fill → accounting', async () => {
    const { account, session, deployment } = await seedRunningStrategySession();
    const event = candle(1, 'market-event-us223-1');

    const result = await pipeline.run({
      workspaceId: WS,
      sessionId: session.id,
      deploymentId: deployment.id,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      lease: {
        sessionId: session.id,
        fencingToken: session.lease!.fencingToken,
        ownerId: session.lease!.ownerId,
        expiresAt: session.lease!.expiresAt,
        sessionStatus: 'RUNNING',
      },
      event,
      quantity: '1',
      reservation: { currency: 'USDT', amount: '120' },
      risk: riskContext(account.id, session.id, session.lease!.fencingToken),
      referencePrice: '105',
      nowIso: '2026-07-29T18:20:02.000Z',
      recordedAt: '2026-07-29T18:20:02.100Z',
      actorId: 'pipeline-us223',
      correlationId: 'corr-us223',
    });

    expect(result.outcome).toBe('filled');
    expect(result.signalIntent?.direction).toBe('buy');
    expect(result.order?.intent.origin).toBe('strategy');
    expect(result.order?.intent.signalIntentId).toBe(result.signalIntent?.id);
    expect(result.riskDecision?.status).toBe(RiskDecisionStatus.APPROVED);
    expect(result.fill).not.toBeNull();
    expect(result.accounting).toMatchObject({
      outcome: 'applied',
      position: {
        side: PositionSide.LONG,
        quantity: '1',
        averageEntryPrice: '105.0525',
      },
      ledgerTransaction: { causeType: LedgerCauseType.FILL },
    });

    expect(await prisma.paperFill.count({ where: { workspaceId: WS } })).toBe(1);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(1);
    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(1);
  });

  it('replay of the same candle is idempotent (no duplicate Fill or accounting)', async () => {
    const { account, session, deployment } = await seedRunningStrategySession();
    const event = candle(2, 'market-event-us223-2');
    const command = {
      workspaceId: WS,
      sessionId: session.id,
      deploymentId: deployment.id,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      lease: {
        sessionId: session.id,
        fencingToken: session.lease!.fencingToken,
        ownerId: session.lease!.ownerId,
        expiresAt: session.lease!.expiresAt,
        sessionStatus: 'RUNNING' as const,
      },
      event,
      quantity: '0.5',
      reservation: { currency: 'USDT', amount: '60' },
      risk: riskContext(account.id, session.id, session.lease!.fencingToken),
      referencePrice: '105',
      nowIso: '2026-07-29T18:20:02.000Z',
      recordedAt: '2026-07-29T18:20:02.100Z',
      actorId: 'pipeline-us223',
    };

    const first = await pipeline.run(command);
    const second = await pipeline.run(command);

    expect(first.outcome).toBe('filled');
    expect(second.outcome).toBe('already_processed');
    expect(await prisma.paperFill.count({ where: { workspaceId: WS } })).toBe(1);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(1);
    expect(
      await prisma.inboxRecord.count({
        where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID },
      }),
    ).toBe(1);
  });

  it('NO_ACTION candle produces no Order, Fill, or Position', async () => {
    const draft = createStrategyDeployment({
      id: 'deployment-us223-hold',
      workspaceId: WS,
      strategyId: 'strategy-us223-hold',
      strategyVersion: '1.0.0',
      parameters: { action: 'hold' },
      instrument: 'BTCUSDT',
      timeframe: '1m',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      createdAt: t0,
      recordedAt: t0,
      actorId: 'trader-1',
      idempotencyKey: 'deployment-us223-hold',
    });
    const approved = withEnforcementAuthorization(
      approveStrategyDeployment(draft, {
        approvedAt: t0,
        approvedByActorId: 'admin-1',
        recordedAt: t0,
      }),
      {
        outcome: 'pass',
        validation: 'VALID',
        purpose: 'deployment_bind',
        libraryEntryId: 'lib-entry-us223-hold',
        certificationStatus: 'active',
        eligibilityOutcome: 'eligible',
        checkedAt: t0,
        reasons: Object.freeze([]),
      },
    );
    await transactions.run((tx) => deploymentRepo.create(approved, tx));

    const account = await accountService.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '100000',
      idempotencyKey: 'account-us223-hold',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us223-hold',
      actorId: 'ledger-1',
      recordedAt: '2026-07-29T18:20:00.100Z',
    });
    const created = await sessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: approved.id,
      origin: 'strategy',
      idempotencyKey: 'session-us223-hold',
      actorId: 'trader-1',
      createdAt: t0,
      recordedAt: t0,
    });
    const session = await sessions.start({
      workspaceId: WS,
      sessionId: created.id,
      actorId: 'trader-1',
      ownerId: 'worker-1',
      recordedAt: '2026-07-29T18:20:01.000Z',
      nowIso: '2026-07-29T18:20:01.000Z',
      leaseTtlMs: 60_000,
    });

    const result = await pipeline.run({
      workspaceId: WS,
      sessionId: session.id,
      deploymentId: approved.id,
      paperAccountId: account.id,
      sessionFencingToken: session.lease!.fencingToken,
      lease: {
        sessionId: session.id,
        fencingToken: session.lease!.fencingToken,
        ownerId: session.lease!.ownerId,
        expiresAt: session.lease!.expiresAt,
        sessionStatus: 'RUNNING',
      },
      event: candle(3, 'market-event-us223-hold'),
      quantity: '1',
      reservation: { currency: 'USDT', amount: '120' },
      risk: riskContext(account.id, session.id, session.lease!.fencingToken),
      referencePrice: '105',
      nowIso: '2026-07-29T18:20:02.000Z',
      recordedAt: '2026-07-29T18:20:02.100Z',
      actorId: 'pipeline-us223',
    });

    expect(result.outcome).toBe('no_action');
    expect(result.order).toBeNull();
    expect(result.fill).toBeNull();
    expect(await prisma.paperOrder.count({ where: { workspaceId: WS } })).toBe(0);
    expect(await prisma.paperFill.count({ where: { workspaceId: WS } })).toBe(0);
    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(0);
  });
});
