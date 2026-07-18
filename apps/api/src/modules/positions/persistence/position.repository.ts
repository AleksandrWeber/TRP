import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { Position } from '../domain/position';

export const POSITION_REPOSITORY = Symbol('POSITION_REPOSITORY');

export interface PositionRepository {
  findByIdentity(
    workspaceId: string,
    paperAccountId: string,
    instrument: string,
  ): Promise<Position | null>;

  findByIdentityForUpdate(
    workspaceId: string,
    paperAccountId: string,
    instrument: string,
    transaction: TransactionContext,
  ): Promise<Position | null>;

  save(
    position: Position,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<Position>;
}
