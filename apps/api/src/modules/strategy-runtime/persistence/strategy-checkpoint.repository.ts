import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { StrategyCheckpoint } from '../domain/strategy-checkpoint';

export const STRATEGY_CHECKPOINT_REPOSITORY = Symbol('STRATEGY_CHECKPOINT_REPOSITORY');

/**
 * Versioned Strategy Checkpoint persistence port (US215).
 * One current checkpoint per workspace session; advances are optimistic.
 */
export interface StrategyCheckpointRepository {
  save(
    checkpoint: StrategyCheckpoint,
    expectedVersion: number | null,
    transaction: TransactionContext,
  ): Promise<StrategyCheckpoint>;

  findBySession(
    workspaceId: string,
    sessionId: string,
    transaction?: TransactionContext,
  ): Promise<StrategyCheckpoint | null>;

  findById(workspaceId: string, checkpointId: string): Promise<StrategyCheckpoint | null>;
}
