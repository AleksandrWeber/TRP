import { describe, expect, it } from 'vitest';
import { InMemoryPasswordResetRepository } from './in-memory-password-reset.repository';
import { RESET_TOKEN_TTL_MS, type Clock } from './password-reset';
import { PasswordResetStore } from './password-reset.store';

class ManualClock implements Clock {
  current = new Date('2026-08-16T18:00:00.000Z');

  now(): Date {
    return this.current;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

describe('PasswordResetStore (V3-S01-e)', () => {
  it('issues a hashed token and consumes it once', async () => {
    const store = new PasswordResetStore(new InMemoryPasswordResetRepository());
    const issued = await store.issue('user-1');

    expect(issued.token.length).toBeGreaterThan(20);
    expect(await store.consume(issued.token)).toEqual({ userId: 'user-1' });
    expect(await store.consume(issued.token)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const clock = new ManualClock();
    const store = new PasswordResetStore(new InMemoryPasswordResetRepository(), clock);
    const issued = await store.issue('user-1');
    clock.advance(RESET_TOKEN_TTL_MS + 1);
    expect(await store.consume(issued.token)).toBeNull();
  });

  it('replaces a previous outstanding token for the same user', async () => {
    const store = new PasswordResetStore(new InMemoryPasswordResetRepository());
    const first = await store.issue('user-1');
    const second = await store.issue('user-1');
    expect(await store.consume(first.token)).toBeNull();
    expect(await store.consume(second.token)).toEqual({ userId: 'user-1' });
  });
});
