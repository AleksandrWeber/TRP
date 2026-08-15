import type { PrismaClient } from '@prisma/client';
import type { PasswordCredentialRepository } from './password-credential.repository';

/**
 * Persists Auth password hashes on the existing User.passwordHash column (PC-18).
 * Does not create users or write Identity profile fields.
 */
export class PrismaPasswordCredentialRepository implements PasswordCredentialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async findByUserId(userId: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return row?.passwordHash ?? null;
  }

  async findAll(): Promise<Array<{ userId: string; passwordHash: string }>> {
    const rows = await this.prisma.user.findMany({
      where: { passwordHash: { not: null } },
      select: { id: true, passwordHash: true },
    });
    return rows
      .filter((row): row is { id: string; passwordHash: string } => Boolean(row.passwordHash))
      .map((row) => ({ userId: row.id, passwordHash: row.passwordHash }));
  }
}
