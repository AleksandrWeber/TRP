import type { PasswordResetRecord } from './password-reset';
import type { PasswordResetRepository } from './password-reset.repository';

/**
 * Process-local reset token store for unit tests (V3-S01-e).
 */
export class InMemoryPasswordResetRepository implements PasswordResetRepository {
  private readonly records = new Map<string, PasswordResetRecord>();

  async save(record: PasswordResetRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    for (const record of this.records.values()) {
      if (record.tokenHash === tokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  async consume(id: string, consumedAt: Date): Promise<void> {
    const record = this.records.get(id);
    if (!record || record.consumedAt) return;
    this.records.set(id, { ...record, consumedAt });
  }

  async consumeAllForUser(userId: string, consumedAt: Date): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.userId === userId && record.consumedAt === null) {
        this.records.set(id, { ...record, consumedAt });
      }
    }
  }
}
