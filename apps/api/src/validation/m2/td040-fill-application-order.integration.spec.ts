/**
 * TD-040 — durable per-Position Fill application ordering (ADR-015 / RC-16).
 */
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
  toDurableEventId,
  type DurableEventEnvelope,
} from '../../modules/event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PrismaCashReservationAdapter } from '../../modules/ledger/adapters/prisma-cash-reservation.adapter';
import { LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  FILL_ACCOUNTING_CONSUMER_ID,
  PositionAccountingConsumer,
  PrismaPositionRepository,
  rebuildPositions,
} from '../../modules/positions';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-td040';
const t0 = '2026-07-18T22:00:00.000Z';

describe('TD-040 — Position Fill application ordering', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accounts = new PaperAccountService(
    new PrismaPaperAccountRepository(prisma),
    transactions,
    outbox,
  );
  const ledger = new LedgerService(
    new PrismaLedgerRepository(prisma),
    accounts,
    transactions,
    outbox,
  );
  const reservations = new PrismaCashReservationAdapter(prisma, transactions, outbox, ledger);
  const positions = new PrismaPositionRepository(prisma);
  const consumer = new PositionAccountingConsumer(
    positions,
    ledger,
    accounts,
    transactions,
    new TransactionalConsumerProgress(),
    outbox,
    M2_PAPER_FILL_CONFIGURATION,
  );
  let accountId: string;

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await cleanup();
    const account = await accounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '10000',
      idempotencyKey: 'account-td040',
      actorId: 'admin-td040',
      openedAt: t0,
      recordedAt: t0,
    });
    accountId = account.id;
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-td040',
      actorId: 'ledger-td040',
      recordedAt: '2026-07-18T22:00:00.100Z',
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('persists application order for multiple Orders on one Position under interleaved arrival', async () => {
    // Fill B occurs earlier by timestamp but arrives later; Fill A arrives first.
    const laterOccurred = fillEvent('order-a', {
      occurredAt: '2026-07-18T22:00:10.000Z',
      recordedAt: '2026-07-18T22:00:10.100Z',
      price: '100',
      quantity: '1',
      grossNotional: '100',
      fee: '0.1',
    });
    const earlierOccurred = fillEvent('order-b', {
      occurredAt: '2026-07-18T22:00:05.000Z',
      recordedAt: '2026-07-18T22:00:05.100Z',
      price: '110',
      quantity: '1',
      grossNotional: '110',
      fee: '0.11',
    });

    await reserve('order-order-a', '200');
    await reserve('order-order-b', '200');
    await persistFill(laterOccurred);
    await persistFill(earlierOccurred);

    const first = await consumer.process(laterOccurred, '2026-07-18T22:00:11.000Z');
    const second = await consumer.process(earlierOccurred, '2026-07-18T22:00:12.000Z');

    expect(first.outcome).toBe('applied');
    expect(second.outcome).toBe('applied');
    expect(second.position).toMatchObject({
      quantity: '2',
      costBasis: '210',
      averageEntryPrice: '105',
      lastAppliedFillSequence: 2,
      lastAppliedFillId: 'fill-td040-order-b',
    });

    const applications = await positions.listFillApplications(WS, accountId);
    expect(applications).toEqual([
      {
        positionId: second.position.id,
        fillId: 'fill-td040-order-a',
        applicationSequence: 1,
        appliedAt: '2026-07-18T22:00:11.000Z',
      },
      {
        positionId: second.position.id,
        fillId: 'fill-td040-order-b',
        applicationSequence: 2,
        appliedAt: '2026-07-18T22:00:12.000Z',
      },
    ]);
  });

  it('reproduces identical Position state on rebuild and after repository restart', async () => {
    const buy = fillEvent('replay-buy', {
      occurredAt: '2026-07-18T22:01:10.000Z',
      recordedAt: '2026-07-18T22:01:10.100Z',
      side: 'buy',
      price: '100',
      quantity: '2',
      grossNotional: '200',
      fee: '0.2',
    });
    // Sell occurred earlier by timestamp but is applied second (after the buy).
    const sell = fillEvent('replay-sell', {
      occurredAt: '2026-07-18T22:01:05.000Z',
      recordedAt: '2026-07-18T22:01:05.100Z',
      side: 'sell',
      price: '150',
      quantity: '1',
      grossNotional: '150',
      fee: '0.15',
    });
    await reserve('order-replay-buy', '300');
    await persistFill(buy);
    await persistFill(sell);
    await consumer.process(buy, '2026-07-18T22:01:11.000Z');
    const live = await consumer.process(sell, '2026-07-18T22:01:12.000Z');

    expect(live.position).toMatchObject({
      quantity: '1',
      costBasis: '100',
      realizedPnl: '50',
      lastAppliedFillId: 'fill-td040-replay-sell',
      lastAppliedFillSequence: 2,
    });

    const fills = await prisma.paperFill.findMany({
      where: { workspaceId: WS, paperAccountId: accountId },
    });
    const paperFills = fills.map((row) =>
      Object.freeze({
        id: row.id,
        workspaceId: row.workspaceId,
        orderId: row.orderId,
        paperAccountId: row.paperAccountId,
        tradingSessionId: row.tradingSessionId,
        adapterOrderId: row.adapterOrderId,
        adapterFillId: row.adapterFillId,
        sequence: row.sequence,
        instrument: row.instrument,
        side: row.side as 'buy' | 'sell',
        price: row.price.toFixed(),
        quantity: row.quantity.toFixed(),
        grossNotional: row.grossNotional.toFixed(),
        fee: row.fee.toFixed(),
        executionContextHash: row.executionContextHash,
        configurationId: row.configurationId,
        configurationVersion: row.configurationVersion,
        configurationHash: row.configurationHash,
        occurredAt: row.occurredAt.toISOString(),
        recordedAt: row.recordedAt.toISOString(),
      }),
    );

    const applications = await positions.listFillApplications(WS, accountId);
    const rebuilt = rebuildPositions(
      paperFills,
      M2_PAPER_FILL_CONFIGURATION,
      '2026-07-18T22:01:13.000Z',
      applications,
    )[0]!;

    expect(positionSemantic(rebuilt)).toEqual(positionSemantic(live.position));

    // Timestamp-only rebuild applies the earlier sell first and cannot open a short.
    expect(() =>
      rebuildPositions(paperFills, M2_PAPER_FILL_CONFIGURATION, '2026-07-18T22:01:13.000Z'),
    ).toThrow();

    const restarted = new PrismaPositionRepository(prisma);
    expect(await restarted.listFillApplications(WS, accountId)).toEqual(applications);
  });

  it('keeps application ordering unchanged under duplicate Fill delivery', async () => {
    const event = fillEvent('dup', {
      occurredAt: '2026-07-18T22:02:00.000Z',
      recordedAt: '2026-07-18T22:02:00.100Z',
      price: '100',
      quantity: '1',
      grossNotional: '100',
      fee: '0.1',
    });
    await reserve('order-dup', '200');
    await persistFill(event);

    const first = await consumer.process(event, '2026-07-18T22:02:01.000Z');
    const duplicate = await consumer.process(event, '2026-07-18T22:02:02.000Z');
    const applications = await positions.listFillApplications(WS, accountId);

    expect(first.outcome).toBe('applied');
    expect(duplicate.outcome).toBe('duplicate');
    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      fillId: 'fill-td040-dup',
      applicationSequence: 1,
      appliedAt: '2026-07-18T22:02:01.000Z',
    });

    await expect(
      transactions.run((transaction) =>
        positions.recordFillApplication(
          {
            positionId: first.position.id,
            fillId: 'fill-td040-dup',
            applicationSequence: 2,
          },
          '2026-07-18T22:02:03.000Z',
          transaction,
        ),
      ),
    ).rejects.toThrow();
    expect(await positions.listFillApplications(WS, accountId)).toEqual(applications);
  });

  async function reserve(orderId: string, amount: string) {
    return reservations.reserveCash({
      workspaceId: WS,
      paperAccountId: accountId,
      orderId,
      idempotencyKey: `reserve-${orderId}`,
      currency: 'USDT',
      amount,
      actorId: 'orders-td040',
      recordedAt: '2026-07-18T22:00:01.000Z',
    });
  }

  async function persistFill(event: DurableEventEnvelope): Promise<void> {
    const payload = event.payload;
    await prisma.paperFill.create({
      data: {
        id: String(payload.fillId),
        workspaceId: WS,
        orderId: String(payload.orderId),
        paperAccountId: accountId,
        tradingSessionId: String(payload.tradingSessionId),
        adapterOrderId: String(payload.adapterOrderId),
        adapterFillId: String(payload.adapterFillId),
        sequence: Number(payload.sequence),
        instrument: String(payload.instrument),
        side: String(payload.side),
        price: String(payload.price),
        quantity: String(payload.quantity),
        grossNotional: String(payload.grossNotional),
        fee: String(payload.fee),
        executionContextHash: String(payload.executionContextHash),
        configurationId: String(payload.configurationId),
        configurationVersion: Number(payload.configurationVersion),
        configurationHash: String(payload.configurationHash),
        occurredAt: new Date(event.occurredAt),
        recordedAt: new Date(event.recordedAt),
      },
    });
  }

  function fillEvent(
    suffix: string,
    values: {
      occurredAt: string;
      recordedAt: string;
      side?: 'buy' | 'sell';
      price: string;
      quantity: string;
      grossNotional: string;
      fee: string;
    },
  ): DurableEventEnvelope {
    const fillId = `fill-td040-${suffix}`;
    return Object.freeze({
      eventId: toDurableEventId(`fill:${fillId}`),
      eventType: 'OrderFillRecorded',
      schemaVersion: 1,
      aggregateType: 'Fill',
      aggregateId: fillId,
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: values.occurredAt,
      recordedAt: values.recordedAt,
      actorId: 'execution-engine',
      payload: Object.freeze({
        fillId,
        orderId: `order-${suffix}`,
        paperAccountId: accountId,
        tradingSessionId: 'session-td040',
        adapterOrderId: `adapter-order-${suffix}`,
        adapterFillId: `adapter-fill-${suffix}`,
        sequence: 1,
        instrument: 'BTCUSDT',
        side: values.side ?? 'buy',
        price: values.price,
        quantity: values.quantity,
        grossNotional: values.grossNotional,
        fee: values.fee,
        executionContextHash: 'execution-context-td040',
        configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
        configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
        configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
      }),
    });
  }

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: {
        consumerId: FILL_ACCOUNTING_CONSUMER_ID,
        eventId: { startsWith: 'fill:fill-td040-' },
      },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.positionFillApplication.deleteMany({
      where: { position: { workspaceId: WS } },
    });
    await prisma.paperPosition.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashReservation.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }
});

function positionSemantic(position: {
  instrument: string;
  side: string;
  quantity: string;
  averageEntryPrice: string;
  costBasis: string;
  realizedPnl: string;
  lastAppliedFillId: string;
  lastAppliedFillSequence: number;
}) {
  return {
    instrument: position.instrument,
    side: position.side,
    quantity: position.quantity,
    averageEntryPrice: position.averageEntryPrice,
    costBasis: position.costBasis,
    realizedPnl: position.realizedPnl,
    lastAppliedFillId: position.lastAppliedFillId,
    lastAppliedFillSequence: position.lastAppliedFillSequence,
  };
}
