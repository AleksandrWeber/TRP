import type { LoginLockoutRecord } from './login-lockout';

/**
 * Persistence contract for Auth-owned login lockout state (V3-S01-b).
 */
export interface LoginLockoutRepository {
  save(record: LoginLockoutRecord): Promise<void>;
  findByUserId(userId: string): Promise<LoginLockoutRecord | null>;
  clear(userId: string): Promise<void>;
}
