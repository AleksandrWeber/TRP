import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { Position } from '../domain/position';

export const POSITION_REPOSITORY = Symbol('POSITION_REPOSITORY');

/**
 * Durable per-Position Fill application ordinal (TD-040 / ADR-015).
 * Independent of Outbox delivery timing; unique on fillId prevents duplicates.
 */
export type PositionFillApplication = Readonly<{
  positionId: string;
  fillId: string;
  applicationSequence: number;
  appliedAt: string;
}>;

export type RecordFillApplicationInput = Readonly<{
  positionId: string;
  fillId: string;
  applicationSequence: number;
}>;

export interface PositionRepository {
  listByAccount(workspaceId: string, paperAccountId: string): Promise<Position[]>;

  listByInstrument(workspaceId: string, instrument: string): Promise<Position[]>;

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

  recordFillApplication(
    input: RecordFillApplicationInput,
    appliedAt: string,
    transaction: TransactionContext,
  ): Promise<void>;

  listFillApplications(
    workspaceId: string,
    paperAccountId: string,
  ): Promise<PositionFillApplication[]>;
}
