import type { PrismaClient } from '@prisma/client';
import type { LoginLockoutRecord } from './login-lockout';
import type { LoginLockoutRepository } from './login-lockout.repository';

/**
 * Persists Auth login lockout on auth_login_lockouts (V3-S01-b).
 * Does not write Identity profile fields.
 */
export class PrismaLoginLockoutRepository implements LoginLockoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: LoginLockoutRecord): Promise<void> {
    await this.prisma.authLoginLockout.upsert({
      where: { userId: record.userId },
      create: {
        userId: record.userId,
        failedAttempts: record.failedAttempts,
        lockedUntil: record.lockedUntil,
      },
      update: {
        failedAttempts: record.failedAttempts,
        lockedUntil: record.lockedUntil,
      },
    });
  }

  async findByUserId(userId: string): Promise<LoginLockoutRecord | null> {
    const row = await this.prisma.authLoginLockout.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return {
      userId: row.userId,
      failedAttempts: row.failedAttempts,
      lockedUntil: row.lockedUntil,
    };
  }

  async clear(userId: string): Promise<void> {
    await this.prisma.authLoginLockout.deleteMany({ where: { userId } });
  }
}
