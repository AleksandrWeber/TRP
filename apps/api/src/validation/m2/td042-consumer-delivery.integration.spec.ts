/**
 * TD-042 — durable Outbox consumer delivery acknowledgements (ADR-013 / RC-16).
 */
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  OutboxDispatcher,
  OutboxStatus,
  PrismaOutboxRepository,
  toDurableEventId,
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
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

const WS = 'ws-td042';
const EVENT_ID = toDurableEventId('evt-td042-fanout');
const t0 = '2026-07-18T23:00:00.000Z';

describe('TD-042 — durable consumer delivery acknowledgements', () => {
  const prisma = new PrismaClient();
  const outbox = new PrismaOutboxRepository(prisma);

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await cleanup();
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('persists consumer acknowledgement and ignores duplicates after repository restart', async () => {
    await outbox.insert(envelope(), t0);
    await outbox.recordConsumerDelivery(EVENT_ID, 'consumer-a', t0);
    await outbox.recordConsumerDelivery(EVENT_ID, 'consumer-a', '2026-07-18T23:00:01.000Z');
    await outbox.recordConsumerDelivery(EVENT_ID, 'consumer-b', '2026-07-18T23:00:02.000Z');

    expect(await outbox.listDeliveredConsumerIds(EVENT_ID)).toEqual(['consumer-a', 'consumer-b']);

    const restarted = new PrismaOutboxRepository(prisma);
    expect(await restarted.listDeliveredConsumerIds(EVENT_ID)).toEqual([
      'consumer-a',
      'consumer-b',
    ]);
  });

  it('skips already-delivered consumers before and after dispatcher restart', async () => {
    await outbox.insert(envelope(), t0);
    const seen: string[] = [];
    let failOnce = true;

    const firstDispatcher = new OutboxDispatcher(outbox, {
      policy: { maxAttempts: 5, baseDelayMs: 1000 },
    });
    firstDispatcher.start();
    firstDispatcher.register({
      consumerId: 'consumer-a',
      handle: async () => {
        seen.push('a');
      },
    });
    firstDispatcher.register({
      consumerId: 'consumer-b',
      handle: async () => {
        seen.push('b');
        if (failOnce) {
          failOnce = false;
          throw new Error('injected failure before restart');
        }
      },
    });

    expect((await firstDispatcher.dispatchOnce(t0, 100, WS)).retried).toBe(1);
    expect(seen).toEqual(['a', 'b']);
    expect(await outbox.listDeliveredConsumerIds(EVENT_ID)).toEqual(['consumer-a']);

    await firstDispatcher.stop();
    const restarted = new OutboxDispatcher(new PrismaOutboxRepository(prisma), {
      policy: { maxAttempts: 5, baseDelayMs: 1000 },
    });
    restarted.start();
    restarted.register({
      consumerId: 'consumer-a',
      handle: async () => {
        seen.push('a');
      },
    });
    restarted.register({
      consumerId: 'consumer-b',
      handle: async () => {
        seen.push('b');
      },
    });

    const afterRestart = await restarted.dispatchOnce('2026-07-18T23:00:01.000Z', 100, WS);
    expect(afterRestart.published).toBe(1);
    expect(seen).toEqual(['a', 'b', 'b']);
    expect(await outbox.listDeliveredConsumerIds(EVENT_ID)).toEqual(['consumer-a', 'consumer-b']);
    expect((await outbox.findByEventId(EVENT_ID))?.status).toBe(OutboxStatus.PUBLISHED);
  });

  it('keeps Position accounting deterministic under duplicate delivery after restart', async () => {
    const transactions = new PrismaTransactionService(prisma);
    const appender = new TransactionalOutboxAppender();
    const accounts = new PaperAccountService(
      new PrismaPaperAccountRepository(prisma),
      transactions,
      appender,
    );
    const ledger = new LedgerService(
      new PrismaLedgerRepository(prisma),
      accounts,
      transactions,
      appender,
    );
    const reservations = new PrismaCashReservationAdapter(prisma, transactions, appender, ledger);
    const positions = new PrismaPositionRepository(prisma);
    const consumer = new PositionAccountingConsumer(
      positions,
      ledger,
      accounts,
      transactions,
      new TransactionalConsumerProgress(),
      appender,
      M2_PAPER_FILL_CONFIGURATION,
    );

    const account = await accounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'account-td042',
      actorId: 'admin-td042',
      openedAt: t0,
      recordedAt: t0,
    });
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-td042',
      actorId: 'ledger-td042',
      recordedAt: '2026-07-18T23:00:00.100Z',
    });
    await reservations.reserveCash({
      workspaceId: WS,
      paperAccountId: account.id,
      orderId: 'order-td042',
      idempotencyKey: 'reserve-td042',
      currency: 'USDT',
      amount: '250',
      actorId: 'orders-td042',
      recordedAt: '2026-07-18T23:00:01.000Z',
    });

    const fillEvent = fillEnvelope(account.id);
    await prisma.paperFill.create({
      data: {
        id: 'fill-td042',
        workspaceId: WS,
        orderId: 'order-td042',
        paperAccountId: account.id,
        tradingSessionId: 'session-td042',
        adapterOrderId: 'adapter-order-td042',
        adapterFillId: 'adapter-fill-td042',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '2',
        grossNotional: '200',
        fee: '0.2',
        executionContextHash: 'execution-context-td042',
        configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
        configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
        configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
        occurredAt: new Date(fillEvent.occurredAt),
        recordedAt: new Date(fillEvent.recordedAt),
      },
    });

    const first = await consumer.process(fillEvent, '2026-07-18T23:00:02.000Z');
    const duplicateBeforeRestart = await consumer.process(fillEvent, '2026-07-18T23:00:02.500Z');
    expect(first.outcome).toBe('applied');
    expect(duplicateBeforeRestart.outcome).toBe('duplicate');

    await outbox.insert(fillEvent, '2026-07-18T23:00:02.000Z');
    await outbox.recordConsumerDelivery(
      fillEvent.eventId,
      'm2-position-accounting-runtime',
      '2026-07-18T23:00:02.000Z',
    );

    const restartedConsumer = new PositionAccountingConsumer(
      new PrismaPositionRepository(prisma),
      ledger,
      accounts,
      new PrismaTransactionService(prisma),
      new TransactionalConsumerProgress(),
      new TransactionalOutboxAppender(),
      M2_PAPER_FILL_CONFIGURATION,
    );
    const duplicateAfterRestart = await restartedConsumer.process(
      fillEvent,
      '2026-07-18T23:00:03.000Z',
    );
    expect(duplicateAfterRestart.outcome).toBe('duplicate');
    expect(duplicateAfterRestart.position).toMatchObject({
      quantity: '2',
      costBasis: '200',
      version: 1,
      lastAppliedFillSequence: 1,
    });

    const applications = await positions.listFillApplications(WS, account.id);
    const fills = await prisma.paperFill.findMany({ where: { workspaceId: WS } });
    const rebuilt = rebuildPositions(
      fills.map((row) =>
        Object.freeze({
          id: row.id,
          workspaceId: row.workspaceId,
          exchangeScopeId: row.exchangeScopeId,
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
      ),
      M2_PAPER_FILL_CONFIGURATION,
      '2026-07-18T23:00:04.000Z',
      applications,
    )[0]!;

    expect(rebuilt).toMatchObject({
      quantity: '2',
      costBasis: '200',
      lastAppliedFillSequence: 1,
    });
    expect(await prisma.positionFillApplication.count({ where: { fillId: 'fill-td042' } })).toBe(1);
    expect(await outbox.listDeliveredConsumerIds(fillEvent.eventId)).toEqual([
      'm2-position-accounting-runtime',
    ]);
  });

  function envelope(): DurableEventEnvelope {
    return Object.freeze({
      eventId: EVENT_ID,
      eventType: 'Td042Validation',
      schemaVersion: 1,
      aggregateType: 'Validation',
      aggregateId: 'td042',
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: t0,
      recordedAt: t0,
      payload: Object.freeze({}),
    });
  }

  function fillEnvelope(paperAccountId: string): DurableEventEnvelope {
    return Object.freeze({
      eventId: toDurableEventId('fill:fill-td042'),
      eventType: 'OrderFillRecorded',
      schemaVersion: 1,
      aggregateType: 'Fill',
      aggregateId: 'fill-td042',
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: '2026-07-18T23:00:02.000Z',
      recordedAt: '2026-07-18T23:00:02.100Z',
      actorId: 'execution-engine',
      payload: Object.freeze({
        fillId: 'fill-td042',
        orderId: 'order-td042',
        paperAccountId,
        tradingSessionId: 'session-td042',
        adapterOrderId: 'adapter-order-td042',
        adapterFillId: 'adapter-fill-td042',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '2',
        grossNotional: '200',
        fee: '0.2',
        executionContextHash: 'execution-context-td042',
        configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
        configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
        configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
      }),
    });
  }

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: {
        OR: [
          { consumerId: FILL_ACCOUNTING_CONSUMER_ID, eventId: { startsWith: 'fill:fill-td042' } },
          { eventId: String(EVENT_ID) },
        ],
      },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
    });
    await prisma.outboxConsumerDelivery.deleteMany({
      where: {
        OR: [{ eventId: String(EVENT_ID) }, { eventId: 'fill:fill-td042' }],
      },
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
