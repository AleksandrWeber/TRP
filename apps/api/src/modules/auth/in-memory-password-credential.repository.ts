import type { PasswordCredentialRepository } from './password-credential.repository';

/**
 * Process-local password hash store for unit tests (PC-18).
 */
export class InMemoryPasswordCredentialRepository implements PasswordCredentialRepository {
  private readonly hashes = new Map<string, string>();

  async save(userId: string, passwordHash: string): Promise<void> {
    this.hashes.set(userId, passwordHash);
  }

  async findByUserId(userId: string): Promise<string | null> {
    return this.hashes.get(userId) ?? null;
  }

  async findAll(): Promise<Array<{ userId: string; passwordHash: string }>> {
    return [...this.hashes.entries()].map(([userId, passwordHash]) => ({ userId, passwordHash }));
  }
}
