import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing';
import { createOrderIntent, OrderSide, OrderType } from '../../modules/orders';
import {
  M2_BASELINE_RISK_POLICY,
  RiskDecisionService,
  RiskDecisionStatus,
  type BaselineRiskEvaluationInput,
} from '../../modules/risk';
import { PrismaRiskDecisionRepository } from '../../modules/risk/persistence/prisma-risk-decision.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'workspace-us165-integration';

describe('US165 — durable Risk Decision and Outbox', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const repository = new PrismaRiskDecisionRepository(prisma);
  const service = new RiskDecisionService(
    M2_BASELINE_RISK_POLICY,
    repository,
    transactions,
    new TransactionalOutboxAppender(),
  );

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.riskDecision.deleteMany({ where: { workspaceId: WS } });
  }

  function evaluation(): BaselineRiskEvaluationInput {
    const intent = createOrderIntent({
      clientOrderId: 'client-us165-integration',
      idempotencyKey: 'order-us165-integration',
      workspaceId: WS,
      paperAccountId: 'account-us165-integration',
      tradingSessionId: 'session-us165-integration',
      sessionFencingToken: 5,
      mode: 'paper',
      origin: 'manual',
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      quantity: '1',
      limitPrice: '50000',
      marketCheckpoint: {
        streamId: 'mark:BTCUSDT',
        sequence: 50,
        eventId: 'market-event-us165-integration',
      },
      actorId: 'trader-us165',
      occurredAt: '2026-07-18T18:40:00.000Z',
      recordedAt: '2026-07-18T18:40:00.100Z',
    });
    return {
      orderId: intent.orderId,
      intent,
      account: {
        id: intent.paperAccountId,
        workspaceId: WS,
        mode: 'paper',
        status: 'active',
        version: 1,
      },
      session: {
        id: intent.tradingSessionId,
        workspaceId: WS,
        paperAccountId: intent.paperAccountId,
        status: 'running',
        version: 5,
        fencingToken: 5,
        reconciled: true,
      },
      market: {
        workspaceId: WS,
        streamId: intent.marketCheckpoint.streamId,
        eventId: intent.marketCheckpoint.eventId,
        sequence: intent.marketCheckpoint.sequence,
        instrument: intent.instrument,
        health: 'healthy',
        referencePrice: '49999',
        occurredAt: '2026-07-18T18:40:00.000Z',
        projectionVersion: 50,
      },
      cash: {
        workspaceId: WS,
        paperAccountId: intent.paperAccountId,
        currency: 'USDT',
        availableCash: '60000',
        version: 2,
        reconciled: true,
      },
      reservation: null,
      position: null,
      portfolio: {
        workspaceId: WS,
        paperAccountId: intent.paperAccountId,
        checkpointId: 'portfolio-us165-integration-v2',
        version: 2,
        reconciled: true,
      },
      duplicateIntent: false,
      unresolvedReconciliation: false,
      evaluatedAt: '2026-07-18T18:40:04.000Z',
      recordedAt: '2026-07-18T18:40:04.100Z',
      actorId: 'risk-engine',
      correlationId: 'correlation-us165',
    };
  }

  it('atomically persists an immutable explainable decision and Outbox event', async () => {
    const decision = await service.evaluate(evaluation());
    expect(decision.status).toBe(RiskDecisionStatus.APPROVED);
    expect(await service.get(WS, decision.id)).toEqual(decision);
    expect(
      await prisma.outboxEvent.count({
        where: { workspaceId: WS, eventType: 'RiskDecisionApproved' },
      }),
    ).toBe(1);
  });

  it('deduplicates semantic replay and durably records fail-closed rejection', async () => {
    const first = await service.evaluate(evaluation());
    const duplicate = await service.evaluate({
      ...evaluation(),
      recordedAt: '2026-07-18T18:40:04.200Z',
    });
    expect(duplicate.id).toBe(first.id);
    expect(await prisma.riskDecision.count({ where: { workspaceId: WS } })).toBe(1);

    const rejected = await service.evaluate({
      ...evaluation(),
      market: null,
      evaluatedAt: '2026-07-18T18:40:05.000Z',
    });
    expect(rejected.status).toBe(RiskDecisionStatus.REJECTED);
    expect(rejected.reasons.length).toBeGreaterThan(0);
    expect(
      await prisma.outboxEvent.count({
        where: { workspaceId: WS, eventType: 'RiskDecisionRejected' },
      }),
    ).toBe(1);
  });
});
