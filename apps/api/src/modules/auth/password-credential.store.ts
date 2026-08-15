import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { PasswordCredentialRepository } from './password-credential.repository';
import { PASSWORD_CREDENTIAL_REPOSITORY } from './password-credential.repository.token';

const BCRYPT_ROUNDS = 10;

/**
 * Auth-layer password credential store (not part of Identity profile).
 * Identity remains password-free; Authentication owns credential verification.
 * Hashes persist through PasswordCredentialRepository (PC-18).
 */
@Injectable()
export class PasswordCredentialStore implements OnModuleInit {
  private readonly passwordHashes = new Map<string, string>();

  constructor(
    @Inject(PASSWORD_CREDENTIAL_REPOSITORY)
    private readonly repository: PasswordCredentialRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const row of await this.repository.findAll()) {
      this.passwordHashes.set(row.userId, row.passwordHash);
    }
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.repository.save(userId, passwordHash);
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
