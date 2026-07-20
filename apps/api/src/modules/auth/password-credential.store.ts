import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

/**
 * Auth-layer password credential store (not part of Identity profile).
 * Identity remains password-free; Authentication owns credential verification.
 */
@Injectable()
export class PasswordCredentialStore {
  private readonly passwordHashes = new Map<string, string>();

  async setPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    this.passwordHashes.set(userId, passwordHash);
  }

  async verify(userId: string, password: string): Promise<boolean> {
    const passwordHash = this.passwordHashes.get(userId);
    if (!passwordHash) {
      return false;
    }
    return bcrypt.compare(password, passwordHash);
  }

  has(userId: string): boolean {
    return this.passwordHashes.has(userId);
  }
}
