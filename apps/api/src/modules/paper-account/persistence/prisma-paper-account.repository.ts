import type { PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { PaperAccountStatus, type PaperAccount } from '../domain/paper-account';
import type { PaperAccountRepository } from './paper-account.repository';

export class PrismaPaperAccountRepository implements PaperAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    account: PaperAccount,
    idempotencyKey: string,
    transaction: TransactionContext,
  ): Promise<PaperAccount> {
    const row = await prismaClientForTransaction(transaction).paperAccount.create({
      data: {
        id: account.id,
        workspaceId: account.workspaceId,
        currency: account.currency,
        mode: account.mode,
        status: account.status,
        openingCapital: account.openingCapital,
        openingLedgerTransactionId: account.openingLedgerTransactionId,
        idempotencyKey,
        version: account.version,
        openedAt: new Date(account.openedAt),
        recordedAt: new Date(account.recordedAt),
      },
    });
    return toDomain(row);
  }

  async findById(workspaceId: string, accountId: string): Promise<PaperAccount | null> {
    const row = await this.prisma.paperAccount.findFirst({
      where: { id: accountId, workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<PaperAccount | null> {
    const row = await this.prisma.paperAccount.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } },
    });
    return row ? toDomain(row) : null;
  }
}

type PaperAccountRow = {
  id: string;
  workspaceId: string;
  currency: string;
  mode: string;
  status: string;
  openingCapital: { toFixed(): string };
  openingLedgerTransactionId: string | null;
  version: number;
  openedAt: Date;
  recordedAt: Date;
};

function toDomain(row: PaperAccountRow): PaperAccount {
  if (row.mode !== 'paper') throw new Error(`unsupported account mode persisted: ${row.mode}`);
  if (!Object.values(PaperAccountStatus).includes(row.status as PaperAccountStatus)) {
    throw new Error(`unsupported paper account status persisted: ${row.status}`);
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    currency: row.currency,
    mode: 'paper',
    status: row.status as PaperAccountStatus,
    openingCapital: row.openingCapital.toFixed(),
    openingLedgerTransactionId: row.openingLedgerTransactionId,
    version: row.version,
    openedAt: row.openedAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
  });
}
