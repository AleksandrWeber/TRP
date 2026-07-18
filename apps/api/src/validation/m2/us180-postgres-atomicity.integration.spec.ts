/**
 * US180 — PostgreSQL transaction, concurrency, Outbox/Inbox, and idempotency validation.
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
import { LedgerCauseType, LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { PaperAccountService } from '../../modules/paper-account';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  FILL_ACCOUNTING_CONSUMER_ID,
  PositionAccountingConsumer,
  PrismaPositionRepository,
} from '../../modules/positions';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us180';
const t0 = '2026-07-18T20:40:00.000Z';

describe('US180 — PostgreSQL atomicity, concurrency, and idempotency', () => {
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
  const progress = new TransactionalConsumerProgress();
  const consumer = new PositionAccountingConsumer(
    positions,
    ledger,
    accounts,
    transactions,
    progress,
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
      openingCapital: '1000',
      idempotencyKey: 'account-us180',
      actorId: 'admin-us180',
      openedAt: t0,
      recordedAt: t0,
    });
    accountId = account.id;
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: accountId,
      idempotencyKey: 'opening-us180',
      actorId: 'ledger-us180',
      recordedAt: '2026-07-18T20:40:00.100Z',
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('serializes competing reservations so concurrent commands cannot overspend', async () => {
    const results = await Promise.allSettled([
      reserve('order-a', '700'),
      reserve('order-b', '700'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await prisma.ledgerCashReservation.count({ where: { workspaceId: WS } })).toBe(1);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.RESERVATION },
      }),
    ).toBe(1);
    const balance = await prisma.ledgerCashBalance.findFirstOrThrow({
      where: { workspaceId: WS, paperAccountId: accountId },
    });
    expect(balance.postedCash.toFixed()).toBe('1000');
    expect(balance.reservedCash.toFixed()).toBe('700');
  });

  it('gives concurrent duplicate Fill delivery exactly one financial effect', async () => {
    await reserve('order-concurrent', '250');
    const event = fillEvent('concurrent');
    const results = await Promise.all([
      consumer.process(event, '2026-07-18T20:40:02.200Z'),
      consumer.process(event, '2026-07-18T20:40:02.300Z'),
    ]);

    expect(results.map((result) => result.outcome).sort()).toEqual(['applied', 'duplicate']);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(1);
    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(1);
    expect(
      await prisma.inboxRecord.count({
        where: {
          consumerId: FILL_ACCOUNTING_CONSUMER_ID,
          eventId: 'fill:fill-us180-concurrent',
        },
      }),
    ).toBe(1);
    expect(
      await prisma.consumerCheckpointRecord.count({
        where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
      }),
    ).toBe(1);
  });

  it('rolls back Position, Ledger, Outbox, Inbox, and checkpoint when progress fails', async () => {
    await reserve('order-rollback', '250');
    const baselineOutbox = await prisma.outboxEvent.count({ where: { workspaceId: WS } });
    const failing = new PositionAccountingConsumer(
      positions,
      ledger,
      accounts,
      transactions,
      {
        hasProcessed: () => Promise.resolve(false),
        recordApplied: () => Promise.reject(new Error('injected checkpoint failure')),
      } as TransactionalConsumerProgress,
      outbox,
      M2_PAPER_FILL_CONFIGURATION,
    );

    await expect(
      failing.process(fillEvent('rollback'), '2026-07-18T20:40:02.200Z'),
    ).rejects.toThrow('injected checkpoint failure');

    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(0);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(0);
    expect(
      await prisma.inboxRecord.count({
        where: {
          consumerId: FILL_ACCOUNTING_CONSUMER_ID,
          eventId: 'fill:fill-us180-rollback',
        },
      }),
    ).toBe(0);
    expect(
      await prisma.consumerCheckpointRecord.count({
        where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
      }),
    ).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { workspaceId: WS } })).toBe(baselineOutbox);
  });

  function reserve(orderId: string, amount: string) {
    return reservations.reserveCash({
      workspaceId: WS,
      paperAccountId: accountId,
      orderId,
      idempotencyKey: `reserve-${orderId}`,
      currency: 'USDT',
      amount,
      actorId: 'orders-us180',
      recordedAt: '2026-07-18T20:40:01.000Z',
    });
  }

  function fillEvent(suffix: string): DurableEventEnvelope {
    const fillId = `fill-us180-${suffix}`;
    return Object.freeze({
      eventId: toDurableEventId(`fill:${fillId}`),
      eventType: 'OrderFillRecorded',
      schemaVersion: 1,
      aggregateType: 'Fill',
      aggregateId: fillId,
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: '2026-07-18T20:40:02.000Z',
      recordedAt: '2026-07-18T20:40:02.100Z',
      actorId: 'execution-engine',
      payload: Object.freeze({
        fillId,
        orderId: `order-${suffix}`,
        paperAccountId: accountId,
        tradingSessionId: 'session-us180',
        adapterOrderId: `adapter-order-${suffix}`,
        adapterFillId: `adapter-fill-${suffix}`,
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '2',
        grossNotional: '200',
        fee: '0.2',
        executionContextHash: 'execution-context-us180',
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
        eventId: { startsWith: 'fill:fill-us180-' },
      },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperPosition.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashReservation.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }
});
