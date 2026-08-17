import type { PrismaClient } from '@prisma/client';
import type { AuthSessionRecord } from './auth-session';
import type { AuthSessionRepository } from './auth-session.repository';

/**
 * Persists Auth operator sessions on auth_sessions (V3-S01-c).
 * Does not write Identity profile fields or trading session tables.
 */
export class PrismaAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: AuthSessionRecord): Promise<void> {
    await this.prisma.authSession.create({
      data: {
        id: record.id,
        familyId: record.familyId,
        userId: record.userId,
        refreshTokenHash: record.refreshTokenHash,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        replacedById: record.replacedById,
        ip: record.ip,
        userAgent: record.userAgent,
        mfaSatisfied: record.mfaSatisfied,
        createdAt: record.createdAt,
      },
    });
  }

  async findById(id: string): Promise<AuthSessionRecord | null> {
    const row = await this.prisma.authSession.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findByRefreshHash(refreshTokenHash: string): Promise<AuthSessionRecord | null> {
    const row = await this.prisma.authSession.findUnique({
      where: { refreshTokenHash },
    });
    return row ? this.toRecord(row) : null;
  }

  async findActiveByUserId(userId: string, now: Date): Promise<AuthSessionRecord[]> {
    const rows = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async findEarliestCreatedAtByFamilyIds(familyIds: string[]): Promise<Map<string, Date>> {
    const earliest = new Map<string, Date>();
    if (familyIds.length === 0) return earliest;
    const rows = await this.prisma.authSession.groupBy({
      by: ['familyId'],
      where: { familyId: { in: familyIds } },
      _min: { createdAt: true },
    });
    for (const row of rows) {
      if (row._min.createdAt) {
        earliest.set(row.familyId, row._min.createdAt);
      }
    }
    return earliest;
  }

  async rotateIfActive(currentId: string, next: AuthSessionRecord, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.authSession.updateMany({
        where: { id: currentId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, replacedById: next.id },
      });
      if (claimed.count !== 1) return false;

      await transaction.authSession.create({
        data: {
          id: next.id,
          familyId: next.familyId,
          userId: next.userId,
          refreshTokenHash: next.refreshTokenHash,
          expiresAt: next.expiresAt,
          revokedAt: next.revokedAt,
          replacedById: next.replacedById,
          ip: next.ip,
          userAgent: next.userAgent,
          mfaSatisfied: next.mfaSatisfied,
          createdAt: next.createdAt,
        },
      });
      return true;
    });
  }

  async revoke(
    id: string,
    params: { revokedAt: Date; replacedById?: string | null },
  ): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: {
        revokedAt: params.revokedAt,
        replacedById: params.replacedById ?? undefined,
      },
    });
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<number> {
    const result = await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
    return result.count;
  }

  private toRecord(row: {
    id: string;
    familyId: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedById: string | null;
    ip: string | null;
    userAgent: string | null;
    mfaSatisfied: boolean;
    createdAt: Date;
  }): AuthSessionRecord {
    return {
      id: row.id,
      familyId: row.familyId,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedById: row.replacedById,
      ip: row.ip,
      userAgent: row.userAgent,
      mfaSatisfied: row.mfaSatisfied,
      createdAt: row.createdAt,
    };
  }
}
