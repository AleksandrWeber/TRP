import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  RESET_TOKEN_TTL_MS,
  SYSTEM_CLOCK,
  type Clock,
  type IssuedPasswordReset,
  type PasswordResetRecord,
} from './password-reset';
import type { PasswordResetRepository } from './password-reset.repository';
import { PASSWORD_RESET_CLOCK, PASSWORD_RESET_REPOSITORY } from './password-reset.repository.token';

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Auth-owned password reset store (V3-S01-e).
 * Issues hashed, single-use, time-limited tokens. Not a mail product.
 */
@Injectable()
export class PasswordResetStore {
  private readonly clock: Clock;

  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly repository: PasswordResetRepository,
    @Inject(PASSWORD_RESET_CLOCK)
    clock?: Clock,
  ) {
    this.clock = clock ?? SYSTEM_CLOCK;
  }

  async issue(userId: string): Promise<IssuedPasswordReset> {
    const now = this.clock.now();
    await this.repository.consumeAllForUser(userId, now);
    const token = randomBytes(32).toString('base64url');
    const record: PasswordResetRecord = {
      id: randomUUID(),
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
      consumedAt: null,
      createdAt: now,
    };
    await this.repository.save(record);
    return { userId, token };
  }

  async consume(presentedToken: string): Promise<{ userId: string } | null> {
    if (!presentedToken) return null;
    const now = this.clock.now();
    const current = await this.repository.findByTokenHash(hashResetToken(presentedToken));
    if (!current || current.consumedAt !== null || current.expiresAt <= now) {
      return null;
    }
    if (!(await this.repository.consumeIfActive(current.id, now))) {
      return null;
    }
    return { userId: current.userId };
  }

  async consumeAllForUser(userId: string): Promise<void> {
    await this.repository.consumeAllForUser(userId, this.clock.now());
  }

  /** Spend comparable hash work when no account should receive a token. */
  async dummyWork(): Promise<void> {
    hashResetToken(randomBytes(32).toString('base64url'));
  }
}
