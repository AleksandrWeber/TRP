import type { LoginLockoutRecord } from './login-lockout';
import type { LoginLockoutRepository } from './login-lockout.repository';

/**
 * Process-local lockout store for unit tests (V3-S01-b).
 */
export class InMemoryLoginLockoutRepository implements LoginLockoutRepository {
  private readonly records = new Map<string, LoginLockoutRecord>();

  async save(record: LoginLockoutRecord): Promise<void> {
    this.records.set(record.userId, { ...record });
  }

  async findByUserId(userId: string): Promise<LoginLockoutRecord | null> {
    const record = this.records.get(userId);
    return record ? { ...record } : null;
  }

  async clear(userId: string): Promise<void> {
    this.records.delete(userId);
  }
}
