import type { PrismaClient } from '@prisma/client';
import type { PasswordResetRecord } from './password-reset';
import type { PasswordResetRepository } from './password-reset.repository';

/**
 * Persists Auth password reset tokens on auth_password_resets (V3-S01-e).
 * Does not write Identity profile fields or notification tables.
 */
export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: PasswordResetRecord): Promise<void> {
    await this.prisma.authPasswordReset.create({
      data: {
        id: record.id,
        userId: record.userId,
        tokenHash: record.tokenHash,
        expiresAt: record.expiresAt,
        consumedAt: record.consumedAt,
        createdAt: record.createdAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null> {
    const row = await this.prisma.authPasswordReset.findUnique({ where: { tokenHash } });
    return row ? this.toRecord(row) : null;
  }

  async consumeIfActive(id: string, consumedAt: Date): Promise<boolean> {
    const consumed = await this.prisma.authPasswordReset.updateMany({
      where: { id, consumedAt: null, expiresAt: { gt: consumedAt } },
      data: { consumedAt },
    });
    return consumed.count === 1;
  }

  async consumeAllForUser(userId: string, consumedAt: Date): Promise<void> {
    await this.prisma.authPasswordReset.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt },
    });
  }

  private toRecord(row: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
    createdAt: Date;
  }): PasswordResetRecord {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt,
      createdAt: row.createdAt,
    };
  }
}
