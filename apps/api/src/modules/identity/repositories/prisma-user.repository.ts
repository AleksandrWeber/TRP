import { Prisma, type PrismaClient, type User as PrismaUser } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { User } from '../user';
import { toUserId, type UserId } from '../user-id';
import { UserStatus } from '../user-status';
import { toIdentityRole, toPrismaRole } from '../persistence/prisma-role.mapping';
import type { UserRepository } from './user.repository';

/**
 * Prisma persistence for Identity User aggregates (PC-18).
 * Writes profile fields only — never reads or writes passwordHash.
 * Existing User table remains the durable store (no new Source of Truth).
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User, transaction?: TransactionContext): Promise<void> {
    try {
      const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
      await client.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          role: toPrismaRole(user.role),
          passwordHash: null,
        },
        update: {
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          role: toPrismaRole(user.role),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`User with email already exists: ${user.email}`);
      }
      throw error;
    }
  }

  async findById(id: UserId | string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id: String(id) } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: PrismaUser): User {
  if (!Object.values(UserStatus).includes(row.status as UserStatus)) {
    throw new Error(`unsupported User status: ${row.status}`);
  }
  return {
    id: toUserId(row.id),
    email: row.email,
    displayName: row.displayName,
    status: row.status as UserStatus,
    role: toIdentityRole(row.role),
  };
}
