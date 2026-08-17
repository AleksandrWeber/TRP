import type { AuthSessionRecord } from './auth-session';

/**
 * Persistence contract for Auth-owned operator sessions (V3-S01-c).
 * Not a trading session store.
 */
export interface AuthSessionRepository {
  save(record: AuthSessionRecord): Promise<void>;
  findById(id: string): Promise<AuthSessionRecord | null>;
  findByRefreshHash(refreshTokenHash: string): Promise<AuthSessionRecord | null>;
  findActiveByUserId(userId: string, now: Date): Promise<AuthSessionRecord[]>;
  findEarliestCreatedAtByFamilyIds(familyIds: string[]): Promise<Map<string, Date>>;
  /** Claims the current active session and creates exactly one successor. */
  rotateIfActive(currentId: string, next: AuthSessionRecord, now: Date): Promise<boolean>;
  revoke(id: string, params: { revokedAt: Date; replacedById?: string | null }): Promise<void>;
  revokeFamily(familyId: string, revokedAt: Date): Promise<void>;
  revokeAllForUser(userId: string, revokedAt: Date): Promise<number>;
}
