import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { LedgerTransaction } from '../domain/ledger-transaction';

export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');

/** Append-only Ledger persistence. There is intentionally no update/delete API. */
export interface LedgerRepository {
  append(
    ledgerTransaction: LedgerTransaction,
    transaction: TransactionContext,
  ): Promise<LedgerTransaction>;

  findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<LedgerTransaction | null>;

  findByCause(
    workspaceId: string,
    causeType: string,
    causeId: string,
  ): Promise<LedgerTransaction | null>;

  listByAccount(workspaceId: string, paperAccountId: string): Promise<LedgerTransaction[]>;
}
