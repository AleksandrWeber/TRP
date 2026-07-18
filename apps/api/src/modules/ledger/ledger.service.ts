import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import {
  PrismaTransactionService,
  prismaClientForTransaction,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import {
  toDurableEventId,
  TransactionalOutboxAppender,
  type DurableEventEnvelope,
} from '../event-processing';
import { FinancialDecimal } from '../financial';
import type { PaperFill } from '../execution-engine';
import { PaperAccountService } from '../paper-account';
import { PaperAccountStatus } from '../paper-account/domain/paper-account';
import type { PositionAccountingTransition } from '../positions/domain/position';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  LEDGER_TRANSACTION_SCHEMA_VERSION,
  createLedgerTransaction,
  type CreateLedgerTransactionInput,
  type LedgerTransaction,
} from './domain/ledger-transaction';
import { summarizeLedger, type LedgerAccountSummary } from './domain/ledger-account-summary';
import { LEDGER_REPOSITORY, type LedgerRepository } from './persistence/ledger.repository';

export type OpenPaperAccountLedgerCommand = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  recordedAt: string;
}>;

export type LedgerReservationMovement = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  reservationId: string;
  idempotencyKey: string;
  currency: string;
  amount: string;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

export type FillLedgerAccounting = Readonly<{
  fill: PaperFill;
  currency: string;
  transition: PositionAccountingTransition;
  actorId: string;
  correlationId?: string;
  recordedAt: string;
}>;

@Injectable()
export class LedgerService {
  constructor(
    @Inject(LEDGER_REPOSITORY)
    private readonly ledger: LedgerRepository,
    @Inject(PaperAccountService)
    private readonly accounts: PaperAccountService,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  /**
   * Converts the immutable Paper Account opening instruction into the first
   * balanced Ledger transaction and its cash-balance projection (US173).
   */
  async openPaperAccount(command: OpenPaperAccountLedgerCommand): Promise<LedgerTransaction> {
    const account = await this.accounts.get(command.workspaceId, command.paperAccountId);
    if (!account) throw new Error('paper account not found in workspace');
    if (account.openingLedgerTransactionId) {
      const existing = await this.ledger.findByCause(
        account.workspaceId,
        LedgerCauseType.OPENING_CAPITAL,
        account.id,
      );
      if (!existing) throw new Error('paper account opening Ledger reference is missing');
      return existing;
    }
    if (account.status !== PaperAccountStatus.PENDING_OPENING_LEDGER) {
      throw new Error(`paper account cannot open Ledger from ${account.status}`);
    }

    const ledgerTransaction = createLedgerTransaction({
      workspaceId: account.workspaceId,
      paperAccountId: account.id,
      idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
      causeType: LedgerCauseType.OPENING_CAPITAL,
      causeId: account.id,
      currency: account.currency,
      occurredAt: account.openedAt,
      recordedAt: command.recordedAt,
      actorId: command.actorId,
      correlationId: command.correlationId,
      entries: [
        debit(LedgerAccount.AVAILABLE_CASH, account.openingCapital),
        credit(LedgerAccount.ADJUSTMENT_COMPENSATION, account.openingCapital),
      ],
    });

    try {
      return await this.transactions.run(async (transaction) => {
        const client = prismaClientForTransaction(transaction);
        await this.ledger.append(ledgerTransaction, transaction);
        await client.ledgerCashBalance.create({
          data: {
            id: cashBalanceId(account.workspaceId, account.id, account.currency),
            workspaceId: account.workspaceId,
            paperAccountId: account.id,
            currency: account.currency,
            postedCash: account.openingCapital,
            reservedCash: '0',
            version: 1,
            updatedAt: new Date(command.recordedAt),
          },
        });
        await this.accounts.activateOpeningLedger(
          account,
          ledgerTransaction.id,
          command.recordedAt,
          transaction,
        );
        await this.appendEvent(transaction, ledgerTransaction);
        return ledgerTransaction;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const existing = await this.ledger.findByCause(
          account.workspaceId,
          LedgerCauseType.OPENING_CAPITAL,
          account.id,
        );
        if (existing) return existing;
      }
      throw error;
    }
  }

  findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<LedgerTransaction | null> {
    return this.ledger.findByIdempotencyKey(workspaceId, idempotencyKey);
  }

  listByAccount(workspaceId: string, paperAccountId: string): Promise<LedgerTransaction[]> {
    return this.ledger.listByAccount(workspaceId, paperAccountId);
  }

  async summarizeAccount(
    workspaceId: string,
    paperAccountId: string,
  ): Promise<LedgerAccountSummary> {
    return summarizeLedger(
      workspaceId,
      paperAccountId,
      await this.ledger.listByAccount(workspaceId, paperAccountId),
    );
  }

  async recordReservation(
    transaction: TransactionContext,
    movement: LedgerReservationMovement,
  ): Promise<LedgerTransaction> {
    return this.appendInTransaction(
      transaction,
      createLedgerTransaction({
        ...movement,
        paperAccountId: movement.paperAccountId,
        causeType: LedgerCauseType.RESERVATION,
        causeId: movement.reservationId,
        entries: [
          debit(LedgerAccount.RESERVED_CASH, movement.amount),
          credit(LedgerAccount.AVAILABLE_CASH, movement.amount),
        ],
      }),
    );
  }

  async recordReservationRelease(
    transaction: TransactionContext,
    movement: LedgerReservationMovement,
  ): Promise<LedgerTransaction> {
    return this.appendInTransaction(
      transaction,
      createLedgerTransaction({
        ...movement,
        paperAccountId: movement.paperAccountId,
        causeType: LedgerCauseType.RESERVATION_RELEASE,
        causeId: movement.reservationId,
        entries: [
          debit(LedgerAccount.AVAILABLE_CASH, movement.amount),
          credit(LedgerAccount.RESERVED_CASH, movement.amount),
        ],
      }),
    );
  }

  /**
   * Appends balanced Fill accounting and updates the derived cash balance inside
   * the caller's atomic Inbox/Position/Ledger/Outbox/checkpoint transaction.
   */
  async recordFill(
    transaction: TransactionContext,
    accounting: FillLedgerAccounting,
  ): Promise<LedgerTransaction> {
    const client = prismaClientForTransaction(transaction);
    const fill = accounting.fill;
    await client.$queryRaw(Prisma.sql`
      SELECT "id"
      FROM "ledger_cash_balances"
      WHERE "workspace_id" = ${fill.workspaceId}
        AND "paper_account_id" = ${fill.paperAccountId}
        AND "currency" = ${accounting.currency}
      FOR UPDATE
    `);
    const balance = await client.ledgerCashBalance.findUnique({
      where: {
        workspaceId_paperAccountId_currency: {
          workspaceId: fill.workspaceId,
          paperAccountId: fill.paperAccountId,
          currency: accounting.currency,
        },
      },
    });
    if (!balance) throw new Error('Ledger cash balance not found for Fill accounting');

    const ledgerTransaction =
      fill.side === 'buy'
        ? await this.buyFillTransaction(transaction, accounting, balance)
        : sellFillTransaction(accounting);
    await this.ledger.append(ledgerTransaction, transaction);
    await this.appendEvent(transaction, ledgerTransaction);

    if (fill.side === 'sell') {
      const proceeds = FinancialDecimal.from(fill.grossNotional).minus(fill.fee);
      if (proceeds.isNegative()) throw new Error('Fill fee cannot exceed sell proceeds');
      await client.ledgerCashBalance.update({
        where: { id: balance.id },
        data: {
          postedCash: { increment: proceeds.toString() },
          version: { increment: 1 },
          updatedAt: new Date(accounting.recordedAt),
        },
      });
    }
    return ledgerTransaction;
  }

  private async buyFillTransaction(
    transaction: TransactionContext,
    accounting: FillLedgerAccounting,
    balance: { id: string; postedCash: Prisma.Decimal; reservedCash: Prisma.Decimal },
  ): Promise<LedgerTransaction> {
    const client = prismaClientForTransaction(transaction);
    const fill = accounting.fill;
    const reservation = await client.ledgerCashReservation.findUnique({
      where: {
        workspaceId_orderId: { workspaceId: fill.workspaceId, orderId: fill.orderId },
      },
    });
    if (!reservation || reservation.status !== 'active') {
      throw new Error('active Ledger cash reservation is required for buy Fill');
    }
    const total = FinancialDecimal.from(fill.grossNotional).plus(fill.fee);
    const reserved = FinancialDecimal.from(reservation.amount.toString());
    if (reserved.compare(total) < 0) {
      throw new Error('cash reservation is insufficient for Fill accounting');
    }
    const postedCash = FinancialDecimal.from(balance.postedCash.toString());
    const reservedCash = FinancialDecimal.from(balance.reservedCash.toString());
    if (postedCash.compare(total) < 0 || reservedCash.compare(reserved) < 0) {
      throw new Error('Ledger cash balance invariant violated during Fill accounting');
    }
    const remainder = reserved.minus(total);
    const entries: CreateLedgerTransactionInput['entries'][number][] = [
      debit(LedgerAccount.POSITION_COST, fill.grossNotional),
    ];
    if (FinancialDecimal.from(fill.fee).isPositive()) {
      entries.push(debit(LedgerAccount.FEES, fill.fee));
    }
    if (remainder.isPositive()) {
      entries.push(debit(LedgerAccount.AVAILABLE_CASH, remainder.toString()));
    }
    entries.push(credit(LedgerAccount.RESERVED_CASH, reserved.toString()));

    await client.ledgerCashReservation.update({
      where: { id: reservation.id },
      data: {
        status: 'released',
        releaseIdempotencyKey: `fill:${fill.id}`,
        releasedAt: new Date(accounting.recordedAt),
      },
    });
    await client.ledgerCashBalance.update({
      where: { id: balance.id },
      data: {
        postedCash: { decrement: total.toString() },
        reservedCash: { decrement: reserved.toString() },
        version: { increment: 1 },
        updatedAt: new Date(accounting.recordedAt),
      },
    });
    return fillLedgerTransaction(accounting, entries);
  }

  private async appendInTransaction(
    transaction: TransactionContext,
    ledgerTransaction: LedgerTransaction,
  ): Promise<LedgerTransaction> {
    await this.ledger.append(ledgerTransaction, transaction);
    await this.appendEvent(transaction, ledgerTransaction);
    return ledgerTransaction;
  }

  private async appendEvent(
    transaction: TransactionContext,
    ledgerTransaction: LedgerTransaction,
  ): Promise<void> {
    await this.outbox.append(
      transaction,
      ledgerEnvelope(ledgerTransaction),
      ledgerTransaction.recordedAt,
    );
  }
}

function sellFillTransaction(accounting: FillLedgerAccounting): LedgerTransaction {
  const fill = accounting.fill;
  const transition = accounting.transition;
  const proceeds = FinancialDecimal.from(fill.grossNotional).minus(fill.fee);
  if (proceeds.isNegative()) throw new Error('Fill fee cannot exceed sell proceeds');
  const entries: CreateLedgerTransactionInput['entries'][number][] = [];
  if (proceeds.isPositive()) entries.push(debit(LedgerAccount.AVAILABLE_CASH, proceeds.toString()));
  if (FinancialDecimal.from(fill.fee).isPositive()) {
    entries.push(debit(LedgerAccount.FEES, fill.fee));
  }
  const realized = FinancialDecimal.from(transition.realizedPnlDelta);
  if (realized.isNegative()) {
    entries.push(debit(LedgerAccount.REALIZED_PNL, realized.abs().toString()));
  }
  entries.push(credit(LedgerAccount.POSITION_COST, transition.costBasisReleased));
  if (realized.isPositive()) {
    entries.push(credit(LedgerAccount.REALIZED_PNL, realized.toString()));
  }
  return fillLedgerTransaction(accounting, entries);
}

function fillLedgerTransaction(
  accounting: FillLedgerAccounting,
  entries: CreateLedgerTransactionInput['entries'],
): LedgerTransaction {
  const fill = accounting.fill;
  return createLedgerTransaction({
    workspaceId: fill.workspaceId,
    paperAccountId: fill.paperAccountId,
    idempotencyKey: `fill:${fill.id}`,
    causeType: LedgerCauseType.FILL,
    causeId: fill.id,
    currency: accounting.currency,
    occurredAt: fill.occurredAt,
    recordedAt: accounting.recordedAt,
    actorId: accounting.actorId,
    correlationId: accounting.correlationId,
    entries,
  });
}

function ledgerEnvelope(ledgerTransaction: LedgerTransaction): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`ledger:${ledgerTransaction.id}:v1`),
    eventType: 'LedgerTransactionPosted',
    schemaVersion: LEDGER_TRANSACTION_SCHEMA_VERSION,
    aggregateType: 'LedgerTransaction',
    aggregateId: ledgerTransaction.id,
    aggregateVersion: 1,
    workspaceId: ledgerTransaction.workspaceId,
    occurredAt: ledgerTransaction.occurredAt,
    recordedAt: ledgerTransaction.recordedAt,
    ...(ledgerTransaction.correlationId ? { correlationId: ledgerTransaction.correlationId } : {}),
    actorId: ledgerTransaction.actorId,
    payload: Object.freeze({
      ledgerTransactionId: ledgerTransaction.id,
      paperAccountId: ledgerTransaction.paperAccountId,
      causeType: ledgerTransaction.causeType,
      causeId: ledgerTransaction.causeId,
      currency: ledgerTransaction.currency,
      entries: ledgerTransaction.entries,
    }),
  });
}

function debit(account: LedgerAccount, amount: string) {
  return Object.freeze({ account, direction: LedgerDirection.DEBIT, amount });
}

function credit(account: LedgerAccount, amount: string) {
  return Object.freeze({ account, direction: LedgerDirection.CREDIT, amount });
}

function cashBalanceId(workspaceId: string, paperAccountId: string, currency: string): string {
  const hash = createHash('sha256')
    .update(`${workspaceId}:${paperAccountId}:${currency}`)
    .digest('hex')
    .slice(0, 24);
  return `cashbal_${hash}`;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
