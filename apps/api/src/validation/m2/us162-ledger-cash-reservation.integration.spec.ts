import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing';
import { PrismaCashReservationAdapter } from '../../modules/ledger/adapters/prisma-cash-reservation.adapter';
import { CashReservationStatus } from '../../modules/ledger';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us162';
const ACCOUNT = 'paper-account-us162';
const ORDER = 'paper-order-us162';
const t0 = '2026-07-18T17:55:00.000Z';

describe('US162 — Ledger-owned durable cash reservation', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const reservations = new PrismaCashReservationAdapter(prisma, transactions, outbox);

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await cleanup();
    await prisma.ledgerCashBalance.create({
      data: {
        id: 'ledger-balance-us162',
        workspaceId: WS,
        paperAccountId: ACCOUNT,
        currency: 'USDT',
        postedCash: '1000',
        reservedCash: '0',
        updatedAt: new Date(t0),
      },
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashReservation.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
  }

  const reserveCommand = {
    workspaceId: WS,
    paperAccountId: ACCOUNT,
    orderId: ORDER,
    idempotencyKey: 'reserve-order-us162',
    currency: 'USDT',
    amount: '250.125',
    actorId: 'risk-engine',
    correlationId: 'corr-us162',
    recordedAt: t0,
  } as const;

  it('atomically reserves available cash through the Ledger port and emits an Outbox event', async () => {
    const reserved = await reservations.reserveCash(reserveCommand);
    expect(reserved.status).toBe(CashReservationStatus.ACTIVE);
    expect(reserved.amount).toBe('250.125');

    const balance = await prisma.ledgerCashBalance.findUniqueOrThrow({
      where: { id: 'ledger-balance-us162' },
    });
    expect(balance.reservedCash.toString()).toBe('250.125');
    expect(
      await prisma.outboxEvent.count({
        where: { workspaceId: WS, eventType: 'CashReserved' },
      }),
    ).toBe(1);
  });

  it('is idempotent and rejects conflicts or insufficient cash without changing balances', async () => {
    const first = await reservations.reserveCash(reserveCommand);
    const duplicate = await reservations.reserveCash(reserveCommand);
    expect(duplicate).toEqual(first);
    expect(await prisma.ledgerCashReservation.count({ where: { workspaceId: WS } })).toBe(1);

    await expect(
      reservations.reserveCash({
        ...reserveCommand,
        orderId: 'other-order',
        idempotencyKey: 'other-reservation',
        amount: '800',
      }),
    ).rejects.toThrow(/insufficient available cash/);
    const balance = await prisma.ledgerCashBalance.findUniqueOrThrow({
      where: { id: 'ledger-balance-us162' },
    });
    expect(balance.reservedCash.toString()).toBe('250.125');
  });

  it('releases exactly once and treats missing or duplicate release as an idempotent no-op', async () => {
    await reservations.reserveCash(reserveCommand);
    const command = {
      workspaceId: WS,
      orderId: ORDER,
      idempotencyKey: 'release-order-us162',
      actorId: 'orders',
      recordedAt: '2026-07-18T17:55:01.000Z',
    } as const;

    const released = await reservations.releaseCash(command);
    const duplicate = await reservations.releaseCash(command);
    expect(released?.status).toBe(CashReservationStatus.RELEASED);
    expect(duplicate).toEqual(released);
    expect(
      await reservations.releaseCash({
        ...command,
        orderId: 'missing-order',
        idempotencyKey: 'missing-release',
      }),
    ).toBeNull();

    const balance = await prisma.ledgerCashBalance.findUniqueOrThrow({
      where: { id: 'ledger-balance-us162' },
    });
    expect(balance.reservedCash.toString()).toBe('0');
    expect(
      await prisma.outboxEvent.count({
        where: { workspaceId: WS, eventType: 'CashReservationReleased' },
      }),
    ).toBe(1);
  });
});
