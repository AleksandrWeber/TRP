import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { PaperFill } from '../domain/paper-fill';

export const FILL_REPOSITORY = Symbol('FILL_REPOSITORY');

/**
 * Append-only Fill store (US171). Intentionally exposes no update or delete:
 * Fills are immutable facts.
 */
export interface FillRepository {
  append(fill: PaperFill, transaction: TransactionContext): Promise<PaperFill>;

  findByOrder(workspaceId: string, orderId: string): Promise<PaperFill[]>;

  listByAccount(workspaceId: string, paperAccountId: string): Promise<PaperFill[]>;

  findById(workspaceId: string, fillId: string): Promise<PaperFill | null>;
}
