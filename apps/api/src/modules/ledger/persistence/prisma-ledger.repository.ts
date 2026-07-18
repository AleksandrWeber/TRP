import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  type LedgerEntry,
  type LedgerTransaction,
} from '../domain/ledger-transaction';
import type { LedgerRepository } from './ledger.repository';

type LedgerRow = Prisma.LedgerTransactionGetPayload<{ include: { entries: true } }>;

export class PrismaLedgerRepository implements LedgerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(
    ledgerTransaction: LedgerTransaction,
    transaction: TransactionContext,
  ): Promise<LedgerTransaction> {
    const client = prismaClientForTransaction(transaction);
    await client.ledgerTransaction.create({
      data: {
        id: ledgerTransaction.id,
        workspaceId: ledgerTransaction.workspaceId,
        paperAccountId: ledgerTransaction.paperAccountId,
        idempotencyKey: ledgerTransaction.idempotencyKey,
        causeType: ledgerTransaction.causeType,
        causeId: ledgerTransaction.causeId,
        currency: ledgerTransaction.currency,
        occurredAt: new Date(ledgerTransaction.occurredAt),
        recordedAt: new Date(ledgerTransaction.recordedAt),
        actorId: ledgerTransaction.actorId,
        correlationId: ledgerTransaction.correlationId,
        compensationReason: ledgerTransaction.compensationReason,
        entries: {
          create: ledgerTransaction.entries.map((entry) => ({
            id: entry.id,
            workspaceId: entry.workspaceId,
            line: entry.line,
            account: entry.account,
            direction: entry.direction,
            amount: entry.amount,
          })),
        },
      },
    });
    return ledgerTransaction;
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<LedgerTransaction | null> {
    const row = await this.prisma.ledgerTransaction.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } },
      include: { entries: { orderBy: { line: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async findByCause(
    workspaceId: string,
    causeType: string,
    causeId: string,
  ): Promise<LedgerTransaction | null> {
    const row = await this.prisma.ledgerTransaction.findUnique({
      where: {
        workspaceId_causeType_causeId: { workspaceId, causeType, causeId },
      },
      include: { entries: { orderBy: { line: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async listByAccount(workspaceId: string, paperAccountId: string): Promise<LedgerTransaction[]> {
    const rows = await this.prisma.ledgerTransaction.findMany({
      where: { workspaceId, paperAccountId },
      include: { entries: { orderBy: { line: 'asc' } } },
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: LedgerRow): LedgerTransaction {
  if (!Object.values(LedgerCauseType).includes(row.causeType as LedgerCauseType)) {
    throw new Error(`unsupported Ledger cause type: ${row.causeType}`);
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    paperAccountId: row.paperAccountId,
    idempotencyKey: row.idempotencyKey,
    causeType: row.causeType as LedgerCauseType,
    causeId: row.causeId,
    currency: row.currency,
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    actorId: row.actorId,
    correlationId: row.correlationId,
    compensationReason: row.compensationReason,
    entries: Object.freeze(row.entries.map(toEntry)),
  });
}

function toEntry(row: LedgerRow['entries'][number]): LedgerEntry {
  if (!Object.values(LedgerAccount).includes(row.account as LedgerAccount)) {
    throw new Error(`unsupported Ledger account: ${row.account}`);
  }
  if (!Object.values(LedgerDirection).includes(row.direction as LedgerDirection)) {
    throw new Error(`unsupported Ledger direction: ${row.direction}`);
  }
  return Object.freeze({
    id: row.id,
    transactionId: row.transactionId,
    workspaceId: row.workspaceId,
    line: row.line,
    account: row.account as LedgerAccount,
    direction: row.direction as LedgerDirection,
    amount: row.amount.toFixed(),
  });
}
