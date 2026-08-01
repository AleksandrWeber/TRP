import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableRecoveryState } from './durable-recovery-state';

/**
 * Persistence port for durable RecoveryState (US292 / E17 P0-1).
 * Implementations belong to trading-session infrastructure.
 */
export interface RecoveryStateRepository {
  saveRecoveryState(
    recoveryState: DurableRecoveryState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadRecoveryState(sessionId: string): Promise<DurableRecoveryState | null>;

  /**
   * Soft-clear is preferred for audit retention (P0-1). Hard clear is reserved
   * for test teardown / explicit retention policy — never required on success.
   */
  clearRecoveryState(sessionId: string, transaction?: TransactionContext): Promise<void>;
}

export const RECOVERY_STATE_REPOSITORY = Symbol('RECOVERY_STATE_REPOSITORY');
