import type { AuthSessionRecord } from './auth-session';
import type { AuthSessionRepository } from './auth-session.repository';

/**
 * Process-local session store for unit tests (V3-S01-c).
 */
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private readonly records = new Map<string, AuthSessionRecord>();

  async save(record: AuthSessionRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async findById(id: string): Promise<AuthSessionRecord | null> {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async findByRefreshHash(refreshTokenHash: string): Promise<AuthSessionRecord | null> {
    for (const record of this.records.values()) {
      if (record.refreshTokenHash === refreshTokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  async findActiveByUserId(userId: string, now: Date): Promise<AuthSessionRecord[]> {
    return [...this.records.values()]
      .filter(
        (record) => record.userId === userId && record.revokedAt === null && record.expiresAt > now,
      )
      .map((record) => ({ ...record }));
  }

  async findEarliestCreatedAtByFamilyIds(familyIds: string[]): Promise<Map<string, Date>> {
    const wanted = new Set(familyIds);
    const earliest = new Map<string, Date>();
    for (const record of this.records.values()) {
      if (!wanted.has(record.familyId)) continue;
      const current = earliest.get(record.familyId);
      if (!current || record.createdAt < current) {
        earliest.set(record.familyId, record.createdAt);
      }
    }
    return earliest;
  }

  async revoke(
    id: string,
    params: { revokedAt: Date; replacedById?: string | null },
  ): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    this.records.set(id, {
      ...record,
      revokedAt: params.revokedAt,
      replacedById: params.replacedById ?? record.replacedById,
    });
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.familyId === familyId && record.revokedAt === null) {
        this.records.set(id, { ...record, revokedAt });
      }
    }
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<number> {
    let count = 0;
    for (const [id, record] of this.records) {
      if (record.userId === userId && record.revokedAt === null) {
        this.records.set(id, { ...record, revokedAt });
        count += 1;
      }
    }
    return count;
  }
}
