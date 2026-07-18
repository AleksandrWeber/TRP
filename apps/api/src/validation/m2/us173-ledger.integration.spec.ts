import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionalOutboxAppender } from '../../modules/event-processing';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerService,
  PrismaLedgerRepository,
} from '../../modules/ledger';
import { PaperAccountStatus } from '../../modules/paper-account';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us173';
const t0 = '2026-07-18T19:10:00.000Z';

describe('US173 — append-only balanced Ledger integration', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accountRepository = new PrismaPaperAccountRepository(prisma);
  const accounts = new PaperAccountService(accountRepository, transactions, outbox);
  const ledger = new LedgerService(
    new PrismaLedgerRepository(prisma),
    accounts,
    transactions,
    outbox,
  );

  beforeAll(() => prisma.$connect());
  beforeEach(() => cleanup());
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }

  it('turns opening capital into one balanced transaction, cash projection, and active account', async () => {
    const account = await accounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000.125',
      idempotencyKey: 'account-us173',
      actorId: 'admin-us173',
      openedAt: t0,
      recordedAt: t0,
    });

    const opened = await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us173',
      actorId: 'ledger-us173',
      recordedAt: '2026-07-18T19:10:00.100Z',
    });
    const duplicate = await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: account.id,
      idempotencyKey: 'opening-us173',
      actorId: 'ledger-us173',
      recordedAt: '2026-07-18T19:10:00.100Z',
    });

    expect(duplicate).toEqual(opened);
    expect(opened.causeType).toBe(LedgerCauseType.OPENING_CAPITAL);
    expect(opened.entries.map((entry) => entry.account)).toEqual([
      LedgerAccount.AVAILABLE_CASH,
      LedgerAccount.ADJUSTMENT_COMPENSATION,
    ]);
    expect(await prisma.ledgerTransaction.count({ where: { workspaceId: WS } })).toBe(1);
    expect(await prisma.ledgerEntry.count({ where: { workspaceId: WS } })).toBe(2);

    const balance = await prisma.ledgerCashBalance.findUniqueOrThrow({
      where: {
        workspaceId_paperAccountId_currency: {
          workspaceId: WS,
          paperAccountId: account.id,
          currency: 'USDT',
        },
      },
    });
    expect(balance.postedCash.toFixed()).toBe('1000.125');
    expect(balance.reservedCash.toFixed()).toBe('0');

    const activated = await accounts.get(WS, account.id);
    expect(activated).toMatchObject({
      status: PaperAccountStatus.ACTIVE,
      openingLedgerTransactionId: opened.id,
      version: 2,
    });
    expect(
      await prisma.outboxEvent.count({
        where: { workspaceId: WS, eventType: 'LedgerTransactionPosted' },
      }),
    ).toBe(1);
  });
});
