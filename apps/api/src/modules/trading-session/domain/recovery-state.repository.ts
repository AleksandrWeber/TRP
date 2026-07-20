import type { RecoveryStateProperties } from './trading-session-aggregate';

/**
 * Persistence-agnostic recovery state contract.
 * Implementations belong to a later infrastructure story.
 */
export interface RecoveryStateRepository {
  saveRecoveryState(sessionId: string, recoveryState: RecoveryStateProperties): Promise<void>;
  loadRecoveryState(sessionId: string): Promise<RecoveryStateProperties | null>;
  clearRecoveryState(sessionId: string): Promise<void>;
}
