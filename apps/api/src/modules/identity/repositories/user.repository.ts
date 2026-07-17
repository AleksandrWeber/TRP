import type { User } from '../user';
import type { UserId } from '../user-id';

/**
 * Persistence contract for Identity User aggregates (US105).
 * Storage operations only — no auth / policy logic.
 */
export interface UserRepository {
  save(user: User): void;
  findById(id: UserId | string): User | null;
  findByEmail(email: string): User | null;
  findAll(): User[];
}
