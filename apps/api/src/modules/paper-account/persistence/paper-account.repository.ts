import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { PaperAccount } from '../domain/paper-account';

export const PAPER_ACCOUNT_REPOSITORY = Symbol('PAPER_ACCOUNT_REPOSITORY');

export interface PaperAccountRepository {
  create(
    account: PaperAccount,
    idempotencyKey: string,
    transaction: TransactionContext,
  ): Promise<PaperAccount>;

  save(
    account: PaperAccount,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<PaperAccount>;

  findById(workspaceId: string, accountId: string): Promise<PaperAccount | null>;

  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<PaperAccount | null>;
}
