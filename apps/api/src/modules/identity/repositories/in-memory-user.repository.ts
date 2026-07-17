import type { User } from '../user';
import type { UserId } from '../user-id';
import type { UserRepository } from './user.repository';

/**
 * In-memory UserRepository (Map-backed) (US105).
 * No filesystem, database, or serialization.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();
  private readonly byEmail = new Map<string, string>();

  save(user: User): void {
    // Clear any email keys for this id (handles in-place email mutation).
    for (const [emailKey, id] of [...this.byEmail.entries()]) {
      if (id === user.id) this.byEmail.delete(emailKey);
    }

    const stored: User = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      role: user.role,
    };
    this.byId.set(user.id, stored);
    this.byEmail.set(normalizeEmail(user.email), user.id);
  }

  findById(id: UserId | string): User | null {
    return this.byId.get(id) ?? null;
  }

  findByEmail(email: string): User | null {
    const id = this.byEmail.get(normalizeEmail(email));
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  findAll(): User[] {
    return Array.from(this.byId.values());
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
