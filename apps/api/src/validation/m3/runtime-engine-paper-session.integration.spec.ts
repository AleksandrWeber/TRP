import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CanonicalOrderPathService } from '../../modules/canonical-order-path';
import {
  OutboxDispatcher,
  PrismaOutboxRepository,
  PrismaTransactionalOutboxWriter,
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
} from '../../modules/event-processing';
import { PrismaInboxRepository } from '../../modules/event-processing/repositories/prisma-inbox.repository';
import { PrismaConsumerCheckpointRepository } from '../../modules/event-processing/repositories/prisma-consumer-checkpoint.repository';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import { ExecutionEngineService, PrismaFillRepository } from '../../modules/execution-engine';
import { PrismaCashReservationAdapter } from '../../modules/ledger/adapters/prisma-cash-reservation.adapter';
import { LedgerCauseType, LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { createClosedCandleEvent } from '../../modules/live-market-data/domain/closed-candle-event';
import { ClosedCandleIngestService } from '../../modules/live-market-data/ingest/closed-candle-ingest.service';
import { MarketStreamIntegrityController } from '../../modules/live-market-data/integrity/market-stream-integrity-controller';
import { MarketDataValidator } from '../../modules/live-market-data/normalization/market-data-validator';
import { PrismaMarketCheckpointPersistence } from '../../modules/live-market-data/checkpoints/prisma-market-checkpoint.persistence';
import { MarketCheckpointStore } from '../../modules/live-market-data/checkpoints/market-checkpoint-store';
import { LatestMarketStateProjection } from '../../modules/live-market-data/projection/latest-market-state-projection';
import { LiveMarketConnectorRegistry } from '../../modules/live-market-data/ports/live-market-connector-registry';
import { InMemoryMarketSubscriptionPersistence } from '../../modules/live-market-data/subscriptions/in-memory-market-subscription.persistence';
import { MarketSubscriptionRegistry } from '../../modules/live-market-data/subscriptions/market-subscription-registry';
import { Timeframe } from '../../modules/market-data/timeframe';
import { OrderService } from '../../modules/orders/order.service';
import { PrismaOrderRepository } from '../../modules/orders/persistence/prisma-order.repository';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  PositionAccountingConsumer,
  PositionSide,
  PrismaPositionRepository,
} from '../../modules/positions';
import { InMemoryReportingStore } from '../../modules/reporting/adapters/in-memory-reporting-store';
import { ReportingGenerationService } from '../../modules/reporting/reporting-generation.service';
import { ReportingKnowledgeLakeReadService } from '../../modules/reporting/reporting-knowledge-lake-read.service';
import { ReportingQueryService } from '../../modules/reporting/reporting-query.service';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { AiAnalyticsService } from '../../modules/ai-analytics/ai-analytics.service';
import { InMemoryNotificationStore } from '../../modules/notification-delivery/adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from '../../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { NotificationDeliveryService } from '../../modules/notification-delivery/notification-delivery.service';
import { ReportNarrativeConsumerService } from '../../modules/product-flow/report-narrative-consumer.service';
import { ReportNotificationConsumerService } from '../../modules/product-flow/report-notification-consumer.service';
import { M2_BASELINE_RISK_POLICY, RiskDecisionService } from '../../modules/risk';
import { PrismaRiskDecisionRepository } from '../../modules/risk/persistence/prisma-risk-decision.repository';
import {
  approveStrategyDeployment,
  createStrategyDeployment,
  withEnforcementAuthorization,
} from '../../modules/strategy-deployment';
import { PrismaStrategyDeploymentRepository } from '../../modules/strategy-deployment/persistence/prisma-strategy-deployment.repository';
import { StrategyDeploymentService } from '../../modules/strategy-deployment/strategy-deployment.service';
import { PipelineCommandAssembler } from '../../modules/strategy-trading-pipeline/pipeline-command.assembler';
import { StrategyTradingPipelineService } from '../../modules/strategy-trading-pipeline';
import { TradingSessionRuntimeWorker } from '../../modules/strategy-trading-pipeline/trading-session-runtime.worker';
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

const WS = 'ws-runtime-engine';
const t0 = '2026-07-29T18:20:00.000Z';

describe('Runtime Engine — Start Session → closed candle → automatic paper order', () => {
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
  const assembler = new PipelineCommandAssembler(
    sessionRepo,
    deploymentService,
    accountService,
    ledger,
    positionRepo,
    runtime,
  );

  const lake = new InMemoryKnowledgeLakeIngestionAdapter();
  const reportingStore = new InMemoryReportingStore();
  const reporting = new ReportingGenerationService(
    new ReportingKnowledgeLakeReadService(lake),
    reportingStore,
  );
  const reportingQuery = new ReportingQueryService(reportingStore);
  const narratives = new ReportNarrativeConsumerService(
    reporting,
    reportingQuery,
    new AiAnalyticsService(reportingQuery),
  );
  const notificationStore = new InMemoryNotificationStore();
  const notifications = new NotificationDeliveryService(
    notificationStore,
    new InMemoryTelegramAdapter(),
  );
  const deliveries = new ReportNotificationConsumerService(
    reporting,
    reportingQuery,
    notifications,
  );

  const outboxRepo = new PrismaOutboxRepository(prisma);
  const dispatcher = new OutboxDispatcher(outboxRepo);
  const ingest = new ClosedCandleIngestService(
    new MarketDataValidator(),
    new MarketStreamIntegrityController(),
    new PrismaTransactionalOutboxWriter(prisma),
    new LatestMarketStateProjection(
      new PrismaInboxRepository(prisma),
      new PrismaConsumerCheckpointRepository(prisma),
      new MarketCheckpointStore(new PrismaMarketCheckpointPersistence(prisma)),
      null,
    ),
    new MarketCheckpointStore(new PrismaMarketCheckpointPersistence(prisma)),
  );
  const worker = new TradingSessionRuntimeWorker(
    dispatcher,
    assembler,
    pipeline,
    new MarketSubscriptionRegistry(new InMemoryMarketSubscriptionPersistence()),
    new LiveMarketConnectorRegistry(),
    narratives,
    deliveries,
  );

  beforeAll(async () => {
    await prisma.$connect();
    dispatcher.start();
    worker.onModuleInit();
  });
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await dispatcher.stop();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    const fills = await prisma.paperFill.findMany({
      where: { workspaceId: WS },
      select: { id: true },
    });
    await prisma.inboxRecord.deleteMany({
      where: {
        OR: [
          { eventId: { contains: 'runtime-engine' } },
          { eventId: { in: fills.map((row) => `fill:${row.id}`) } },
        ],
      },
    });
    await prisma.consumerCheckpointRecord.deleteMany({ where: { workspaceId: WS } });
    await prisma.marketStreamCheckpointRecord.deleteMany({ where: { workspaceId: WS } });
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
    reportingStore.clear();
  }

  async function seedRunningStrategySession() {
    const draft = createStrategyDeployment({
      id: 'deployment-runtime-engine',
      workspaceId: WS,
      strategyId: 'strategy-runtime-engine',
      strategyVersion: '1.0.0',
      parameters: { action: 'buy', quantity: '1' },
      instrument: 'BTCUSDT',
      timeframe: '1m',
      marketDataSourceId: 'binance-spot',
      paperExecutionConfigurationId: 'paper-config',
      riskPolicyId: 'm2-baseline-paper-risk',
      riskPolicyVersion: 1,
      createdAt: t0,
      recordedAt: t0,
      actorId: 'trader-1',
      idempotencyKey: 'deployment-runtime-engine',
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
        libraryEntryId: 'lib-entry-runtime-engine',
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
      idempotencyKey: 'account-runtime-engine',
      actorId: 'trader-1',
      openedAt: t0,
      recordedAt: t0,
    });
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-runtime-engine',
      actorId: 'ledger-1',
      recordedAt: '2026-07-29T18:20:00.100Z',
    });
    const created = await sessions.create({
      workspaceId: WS,
      paperAccountId: account.id,
      deploymentId: approved.id,
      origin: 'strategy',
      idempotencyKey: 'session-runtime-engine',
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
    return { account, session, deployment: approved };
  }

  it('creates a paper order, portfolio, report, notification, and AI narrative without calling pipeline.run from the test', async () => {
    const { session } = await seedRunningStrategySession();
    const event = createClosedCandleEvent({
      eventId: 'market-event-runtime-engine-1',
      workspaceId: WS,
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      sequence: 1,
      timeframe: Timeframe.M1,
      openTime: '2026-07-29T18:19:00.000Z',
      closeTime: '2026-07-29T18:19:59.999Z',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 12,
      exchangeOccurredAt: '2026-07-29T18:19:00.000Z',
      occurredAt: '2026-07-29T18:19:00.000Z',
      receivedAt: '2026-07-29T18:20:02.000Z',
      processedAt: '2026-07-29T18:20:02.000Z',
      recordedAt: '2026-07-29T18:20:02.000Z',
    });

    const published = await ingest.publish(event);
    expect(published.outcome).toBe('published');

    await dispatcher.dispatchOnce('2026-07-29T18:20:03.000Z', 100, WS);

    expect(await prisma.paperOrder.count({ where: { workspaceId: WS } })).toBe(1);
    expect(await prisma.paperFill.count({ where: { workspaceId: WS } })).toBe(1);
    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(1);
    const position = await prisma.paperPosition.findFirst({ where: { workspaceId: WS } });
    expect(position?.side).toBe(PositionSide.LONG);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(1);

    const runs = reportingQuery.listRuns({ workspaceId: WS });
    expect(runs.items.length).toBeGreaterThan(0);
    const reportRunId = runs.items[0]!.reportRunId;
    const narrative = narratives.getAttachedNarrative({
      workspaceId: WS,
      reportRunId,
    });
    expect(narrative.attached).toBe(true);
    expect(notifications.listDeliveries({ workspaceId: WS }).length).toBeGreaterThan(0);
    expect(session.status).toBe('running');
  });
});
