import type { PasswordResetRecord } from './password-reset';

/**
 * Persistence contract for Auth-owned password reset tokens (V3-S01-e).
 */
export interface PasswordResetRepository {
  save(record: PasswordResetRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  /** Claims an unconsumed, unexpired token exactly once. */
  consumeIfActive(id: string, consumedAt: Date): Promise<boolean>;
  consumeAllForUser(userId: string, consumedAt: Date): Promise<void>;
}
