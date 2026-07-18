import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { PositionValuation } from '../domain/position-valuation';

export const POSITION_VALUATION_REPOSITORY = Symbol('POSITION_VALUATION_REPOSITORY');

export interface PositionValuationRepository {
  findByPosition(
    workspaceId: string,
    positionId: string,
    transaction?: TransactionContext,
  ): Promise<PositionValuation | null>;

  listByAccount(workspaceId: string, paperAccountId: string): Promise<PositionValuation[]>;

  save(
    valuation: PositionValuation,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<PositionValuation>;
}
