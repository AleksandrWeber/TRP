/**
 * Persistence contract for Auth-layer password hashes (PC-18).
 * Identity remains password-free; Authentication owns credential records.
 */
export interface PasswordCredentialRepository {
  save(userId: string, passwordHash: string): Promise<void>;
  findByUserId(userId: string): Promise<string | null>;
  findAll(): Promise<Array<{ userId: string; passwordHash: string }>>;
}
