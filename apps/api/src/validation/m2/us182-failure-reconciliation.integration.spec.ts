/**
 * US182 — failure injection, restart recovery, and reconciliation validation.
 */
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
} from '../../modules/event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import {
  AccountingReconciliationService,
  PositionValuationService,
  PrismaPositionRepository,
} from '../../modules/positions';
import { PrismaPositionValuationRepository } from '../../modules/positions/persistence/prisma-position-valuation.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us182';
const ACCOUNT = 'account-us182';
const POSITION = 'position-us182';
const t0 = '2026-07-18T21:00:00.000Z';

describe('US182 — failure injection and reconciliation recovery', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const positions = new PrismaPositionRepository(prisma);
  const valuationRepository = new PrismaPositionValuationRepository(prisma);
  const progress = new TransactionalConsumerProgress();

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await cleanup();
    await prisma.paperPosition.create({
      data: {
        id: POSITION,
        workspaceId: WS,
        paperAccountId: ACCOUNT,
        instrument: 'BTCUSDT',
        side: 'long',
        quantity: '2',
        averageEntryPrice: '100',
        costBasis: '200',
        realizedPnl: '0',
        version: 1,
        lastAppliedFillId: 'fill-us182',
        lastAppliedFillSequence: 1,
        occurredAt: new Date(t0),
        recordedAt: new Date(t0),
      },
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('rolls back a crashed valuation transaction and a restarted consumer retries once', async () => {
    const failing = new PositionValuationService(
      positions,
      valuationRepository,
      M2_PAPER_FILL_CONFIGURATION,
      transactions,
      progress,
      {
        append: () => Promise.reject(new Error('injected valuation Outbox crash')),
      } as TransactionalOutboxAppender,
    );

    await expect(failing.applyMark(mark())).rejects.toThrow('injected valuation Outbox crash');
    expect(await prisma.positionValuation.count({ where: { workspaceId: WS } })).toBe(0);
    expect(
      await prisma.inboxRecord.count({
        where: {
          consumerId: 'm2-position-valuation',
          eventId: 'mark-event-us182',
        },
      }),
    ).toBe(0);
    expect(
      await prisma.consumerCheckpointRecord.count({
        where: { consumerId: 'm2-position-valuation', workspaceId: WS },
      }),
    ).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { workspaceId: WS } })).toBe(0);

    const restarted = new PositionValuationService(
      new PrismaPositionRepository(prisma),
      new PrismaPositionValuationRepository(prisma),
      M2_PAPER_FILL_CONFIGURATION,
      new PrismaTransactionService(prisma),
      new TransactionalConsumerProgress(),
      new TransactionalOutboxAppender(),
    );
    const applied = await restarted.applyMark(mark());
    const duplicate = await restarted.applyMark(mark());

    expect(applied.outcome).toBe('applied');
    expect(duplicate.outcome).toBe('duplicate');
    expect(await prisma.positionValuation.count({ where: { workspaceId: WS } })).toBe(1);
    expect(await prisma.outboxEvent.count({ where: { workspaceId: WS } })).toBe(1);
  });

  it('persists ambiguity across restart, blocks execution, and recovers only after a match', async () => {
    const first = new AccountingReconciliationService(prisma);
    const mismatch = await first.record(
      WS,
      ACCOUNT,
      'live-hash',
      'rebuilt-hash',
      'injected projection corruption',
      '2026-07-18T21:02:00.000Z',
    );
    expect(mismatch.status).toBe('mismatch');

    const restarted = new AccountingReconciliationService(prisma);
    await expect(restarted.assertExecutionEligible(WS, ACCOUNT)).rejects.toThrow(
      /execution blocked/,
    );

    const recovered = await restarted.record(
      WS,
      ACCOUNT,
      'reconciled-hash',
      'reconciled-hash',
      null,
      '2026-07-18T21:03:00.000Z',
    );
    expect(recovered.status).toBe('consistent');
    await expect(
      new AccountingReconciliationService(prisma).assertExecutionEligible(WS, ACCOUNT),
    ).resolves.toBeUndefined();
  });

  it('keeps uncertain adapter acknowledgement in reconciliation instead of blind retry', async () => {
    const result = await new PaperExecutionAdapter().query({
      mode: 'paper',
      workspaceId: WS,
      adapterOrderId: 'adapter-order-us182',
    });
    expect(result).toEqual({
      outcome: 'unknown',
      mode: 'paper',
      adapterOrderId: 'adapter-order-us182',
      reconciliationRequired: true,
    });
  });

  function mark() {
    return {
      workspaceId: WS,
      instrument: 'BTCUSDT',
      marketStreamId: 'mark-stream-us182',
      marketEventId: 'mark-event-us182',
      marketSequence: 1,
      markPrice: '110',
      occurredAt: '2026-07-18T21:01:00.000Z',
      recordedAt: '2026-07-18T21:01:00.100Z',
    };
  }

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: {
        consumerId: 'm2-position-valuation',
        eventId: 'mark-event-us182',
      },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: 'm2-position-valuation', workspaceId: WS },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.accountingReconciliation.deleteMany({ where: { workspaceId: WS } });
    await prisma.positionValuation.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperPosition.deleteMany({ where: { workspaceId: WS } });
  }
});
