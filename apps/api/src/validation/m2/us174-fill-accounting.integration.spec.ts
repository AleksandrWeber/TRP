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
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  FILL_ACCOUNTING_CONSUMER_ID,
  PositionAccountingConsumer,
  PositionSide,
  PrismaPositionRepository,
} from '../../modules/positions';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us174';
const t0 = '2026-07-18T19:20:00.000Z';

describe('US174 — atomic idempotent Fill accounting', () => {
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
      openingCapital: '1000',
      idempotencyKey: 'account-us174',
      actorId: 'admin-us174',
      openedAt: t0,
      recordedAt: t0,
    });
    accountId = account.id;
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us174',
      actorId: 'ledger-us174',
      recordedAt: '2026-07-18T19:20:00.100Z',
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: {
        consumerId: FILL_ACCOUNTING_CONSUMER_ID,
        eventId: { startsWith: 'fill:fill-us174-' },
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

  async function reserve(orderId: string, amount = '250') {
    return reservations.reserveCash({
      workspaceId: WS,
      paperAccountId: accountId,
      orderId,
      idempotencyKey: `reserve-${orderId}`,
      currency: 'USDT',
      amount,
      actorId: 'orders-us174',
      recordedAt: '2026-07-18T19:20:01.000Z',
    });
  }

  function fillEvent(
    suffix: string,
    values: {
      side?: 'buy' | 'sell';
      quantity?: string;
      price?: string;
      grossNotional?: string;
      fee?: string;
    } = {},
  ): DurableEventEnvelope {
    const fillId = `fill-us174-${suffix}`;
    return Object.freeze({
      eventId: toDurableEventId(`fill:${fillId}`),
      eventType: 'OrderFillRecorded',
      schemaVersion: 1,
      aggregateType: 'Fill',
      aggregateId: fillId,
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: '2026-07-18T19:20:02.000Z',
      recordedAt: '2026-07-18T19:20:02.100Z',
      actorId: 'execution-engine',
      payload: Object.freeze({
        fillId,
        orderId: `order-${suffix}`,
        paperAccountId: accountId,
        tradingSessionId: 'session-us174',
        adapterOrderId: `adapter-order-${suffix}`,
        adapterFillId: `adapter-fill-${suffix}`,
        sequence: 1,
        instrument: 'BTCUSDT',
        side: values.side ?? 'buy',
        price: values.price ?? '100',
        quantity: values.quantity ?? '2',
        grossNotional: values.grossNotional ?? '200',
        fee: values.fee ?? '0.2',
        executionContextHash: 'execution-context-us174',
        configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
        configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
        configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
      }),
    });
  }

  it('commits Inbox, Position, balanced Ledger, Outbox, and checkpoint once', async () => {
    const event = fillEvent('atomic');
    await reserve('order-atomic');

    const first = await consumer.process(event, '2026-07-18T19:20:02.200Z');
    const duplicate = await consumer.process(event, '2026-07-18T19:20:02.300Z');

    expect(first).toMatchObject({
      outcome: 'applied',
      position: {
        side: PositionSide.LONG,
        quantity: '2',
        averageEntryPrice: '100',
        costBasis: '200',
        version: 1,
        lastAppliedFillSequence: 1,
      },
      ledgerTransaction: { causeType: LedgerCauseType.FILL },
    });
    expect(duplicate).toMatchObject({
      outcome: 'duplicate',
      position: { version: 1, quantity: '2' },
      ledgerTransaction: null,
    });
    expect(
      await prisma.inboxRecord.count({
        where: {
          consumerId: FILL_ACCOUNTING_CONSUMER_ID,
          eventId: 'fill:fill-us174-atomic',
        },
      }),
    ).toBe(1);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: {
          workspaceId: WS,
          eventType: { in: ['LedgerTransactionPosted', 'PositionUpdatedFromFill'] },
        },
      }),
    ).toBe(4); // opening Ledger, reservation Ledger, Fill Ledger, Position
    const checkpoint = await prisma.consumerCheckpointRecord.findFirstOrThrow({
      where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
    });
    expect(checkpoint.lastAppliedSequence).toBe(1);

    const balance = await prisma.ledgerCashBalance.findUniqueOrThrow({
      where: {
        workspaceId_paperAccountId_currency: {
          workspaceId: WS,
          paperAccountId: accountId,
          currency: 'USDT',
        },
      },
    });
    expect(balance.postedCash.toFixed()).toBe('799.8');
    expect(balance.reservedCash.toFixed()).toBe('0');
  });

  it('rolls back every accounting effect on failure and remains retryable', async () => {
    const event = fillEvent('retry');
    const baselineOutbox = await prisma.outboxEvent.count({ where: { workspaceId: WS } });

    await expect(consumer.process(event, '2026-07-18T19:20:02.200Z')).rejects.toThrow(
      /active Ledger cash reservation/,
    );

    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(0);
    expect(
      await prisma.inboxRecord.count({
        where: {
          consumerId: FILL_ACCOUNTING_CONSUMER_ID,
          eventId: 'fill:fill-us174-retry',
        },
      }),
    ).toBe(0);
    expect(
      await prisma.consumerCheckpointRecord.count({
        where: { consumerId: FILL_ACCOUNTING_CONSUMER_ID, workspaceId: WS },
      }),
    ).toBe(0);
    expect(
      await prisma.ledgerTransaction.count({
        where: { workspaceId: WS, causeType: LedgerCauseType.FILL },
      }),
    ).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { workspaceId: WS } })).toBe(baselineOutbox);

    await reserve('order-retry');
    const retry = await consumer.process(event, '2026-07-18T19:20:03.000Z');
    expect(retry.outcome).toBe('applied');
    expect(retry.position.quantity).toBe('2');
  });

  it('applies sell proceeds, cost release, fees, and realized PnL as one balanced transaction', async () => {
    const buy = fillEvent('buy-before-sell');
    await reserve('order-buy-before-sell');
    await consumer.process(buy, '2026-07-18T19:20:02.200Z');

    const sell = fillEvent('sell', {
      side: 'sell',
      quantity: '1',
      price: '120',
      grossNotional: '120',
      fee: '0.12',
    });
    const result = await consumer.process(sell, '2026-07-18T19:20:03.000Z');

    expect(result).toMatchObject({
      outcome: 'applied',
      position: {
        side: PositionSide.LONG,
        quantity: '1',
        costBasis: '100',
        realizedPnl: '20',
        version: 2,
        lastAppliedFillSequence: 2,
      },
    });
    expect(result.ledgerTransaction?.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ account: 'available_cash', amount: '119.88' }),
        expect.objectContaining({ account: 'fees', amount: '0.12' }),
        expect.objectContaining({ account: 'position_cost', amount: '100' }),
        expect.objectContaining({ account: 'realized_pnl', amount: '20' }),
      ]),
    );
  });
});
