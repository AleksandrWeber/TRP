import { describe, expect, it } from 'vitest';
import { InMemoryLoginLockoutRepository } from './in-memory-login-lockout.repository';
import { LOGIN_LOCKOUT_COOLDOWN_MS, LOGIN_LOCKOUT_MAX_FAILURES, type Clock } from './login-lockout';
import { LoginLockoutStore } from './login-lockout.store';

class ManualClock implements Clock {
  current = new Date('2026-08-16T12:00:00.000Z');

  now(): Date {
    return this.current;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

describe('LoginLockoutStore (V3-S01-b)', () => {
  it('locks on the Nth failure and unlocks after cooldown', async () => {
    const clock = new ManualClock();
    const store = new LoginLockoutStore(new InMemoryLoginLockoutRepository(), clock);

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES - 1; i += 1) {
      const result = await store.recordFailure('user-1');
      expect(result.locked).toBe(false);
      expect(await store.isLocked('user-1')).toBe(false);
    }

    const locked = await store.recordFailure('user-1');
    expect(locked.locked).toBe(true);
    expect(locked.failedAttempts).toBe(LOGIN_LOCKOUT_MAX_FAILURES);
    expect(await store.isLocked('user-1')).toBe(true);

    clock.advance(LOGIN_LOCKOUT_COOLDOWN_MS - 1);
    expect(await store.isLocked('user-1')).toBe(true);

    clock.advance(1);
    expect(await store.isLocked('user-1')).toBe(false);
  });

  it('survives a simulated process restart', async () => {
    const clock = new ManualClock();
    const repository = new InMemoryLoginLockoutRepository();
    const original = new LoginLockoutStore(repository, clock);

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES; i += 1) {
      await original.recordFailure('user-1');
    }

    const restarted = new LoginLockoutStore(repository, clock);
    expect(await restarted.isLocked('user-1')).toBe(true);

    clock.advance(LOGIN_LOCKOUT_COOLDOWN_MS);
    expect(await restarted.isLocked('user-1')).toBe(false);
  });

  it('clear removes lockout state', async () => {
    const store = new LoginLockoutStore(new InMemoryLoginLockoutRepository());
    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES; i += 1) {
      await store.recordFailure('user-1');
    }

    await store.clear('user-1');
    expect(await store.isLocked('user-1')).toBe(false);
  });
});
