import { Inject, Injectable } from '@nestjs/common';
import {
  LOGIN_LOCKOUT_COOLDOWN_MS,
  LOGIN_LOCKOUT_MAX_FAILURES,
  SYSTEM_CLOCK,
  type Clock,
  type LoginLockoutRecord,
} from './login-lockout';
import type { LoginLockoutRepository } from './login-lockout.repository';
import { LOGIN_LOCKOUT_CLOCK, LOGIN_LOCKOUT_REPOSITORY } from './login-lockout.repository.token';

export type FailureResult = {
  failedAttempts: number;
  locked: boolean;
};

/**
 * Auth-owned login lockout (V3-S01-b).
 * Per-account failed attempts and cooldown. Not a session product.
 */
@Injectable()
export class LoginLockoutStore {
  private readonly clock: Clock;

  constructor(
    @Inject(LOGIN_LOCKOUT_REPOSITORY)
    private readonly repository: LoginLockoutRepository,
    @Inject(LOGIN_LOCKOUT_CLOCK)
    clock?: Clock,
  ) {
    this.clock = clock ?? SYSTEM_CLOCK;
  }

  async isLocked(userId: string): Promise<boolean> {
    const record = await this.effectiveRecord(userId);
    return record.lockedUntil !== null && record.lockedUntil > this.clock.now();
  }

  async recordFailure(userId: string): Promise<FailureResult> {
    const current = await this.effectiveRecord(userId);
    const failedAttempts = current.failedAttempts + 1;
    const locked = failedAttempts >= LOGIN_LOCKOUT_MAX_FAILURES;
    const lockedUntil = locked
      ? new Date(this.clock.now().getTime() + LOGIN_LOCKOUT_COOLDOWN_MS)
      : null;

    await this.repository.save({ userId, failedAttempts, lockedUntil });
    return { failedAttempts, locked };
  }

  async clear(userId: string): Promise<void> {
    await this.repository.clear(userId);
  }

  private async effectiveRecord(userId: string): Promise<LoginLockoutRecord> {
    const record = await this.repository.findByUserId(userId);
    if (!record) {
      return { userId, failedAttempts: 0, lockedUntil: null };
    }

    if (record.lockedUntil && record.lockedUntil <= this.clock.now()) {
      await this.repository.clear(userId);
      return { userId, failedAttempts: 0, lockedUntil: null };
    }

    return record;
  }
}
