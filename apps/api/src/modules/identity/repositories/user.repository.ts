import type { User } from '../user';
import type { UserId } from '../user-id';
import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';

/**
 * Persistence contract for Identity User aggregates (US105 / PC-18).
 * Storage operations only — no auth / policy logic.
 */
export interface UserRepository {
  save(user: User, transaction?: TransactionContext): Promise<void>;
  findById(id: UserId | string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
