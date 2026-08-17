import type { PasswordResetRecord } from './password-reset';

/**
 * Persistence contract for Auth-owned password reset tokens (V3-S01-e).
 */
export interface PasswordResetRepository {
  save(record: PasswordResetRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  consume(id: string, consumedAt: Date): Promise<void>;
  consumeAllForUser(userId: string, consumedAt: Date): Promise<void>;
}
