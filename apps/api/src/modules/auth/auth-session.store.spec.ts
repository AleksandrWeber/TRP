import { describe, expect, it } from 'vitest';
import { InMemoryAuthSessionRepository } from './in-memory-auth-session.repository';
import { REFRESH_TOKEN_TTL_MS, type Clock } from './auth-session';
import { AuthSessionStore } from './auth-session.store';

class ManualClock implements Clock {
  current = new Date('2026-08-16T18:00:00.000Z');

  now(): Date {
    return this.current;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

describe('AuthSessionStore (V3-S01-c)', () => {
  it('issues a session bound to the user and rotates refresh', async () => {
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const issued = await store.issue('user-1', { ip: '203.0.113.8', userAgent: 'test' });
    const active = await store.requireActive(issued.sessionId, 'user-1');

    expect(active.userId).toBe('user-1');
    expect(active.refreshTokenHash).not.toBe(issued.refreshToken);

    const rotated = await store.rotate(issued.refreshToken);
    expect(rotated.sessionId).not.toBe(issued.sessionId);
    expect(rotated.familyId).toBe(issued.familyId);
    await expect(store.requireActive(issued.sessionId, 'user-1')).rejects.toBeTruthy();
    await expect(store.requireActive(rotated.sessionId, 'user-1')).resolves.toMatchObject({
      userId: 'user-1',
    });
  });

  it('revokes the family when a rotated refresh is reused', async () => {
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const issued = await store.issue('user-1');
    const rotated = await store.rotate(issued.refreshToken);

    await expect(store.rotate(issued.refreshToken)).rejects.toBeTruthy();
    await expect(store.requireActive(rotated.sessionId, 'user-1')).rejects.toBeTruthy();
  });

  it('allows exactly one concurrent refresh rotation without duplicate sessions', async () => {
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const issued = await store.issue('user-1');

    const attempts = await Promise.allSettled([
      store.rotate(issued.refreshToken),
      store.rotate(issued.refreshToken),
      store.rotate(issued.refreshToken),
    ]);
    const successful = attempts.filter(
      (attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof store.rotate>>> =>
        attempt.status === 'fulfilled',
    );

    expect(successful).toHaveLength(1);
    expect(successful[0]!.value.refreshToken).not.toBe(issued.refreshToken);
    expect(await store.listActive('user-1')).toEqual([
      expect.objectContaining({ id: successful[0]!.value.sessionId }),
    ]);
    await expect(store.rotate(issued.refreshToken)).rejects.toBeTruthy();
  });

  it('rejects expired refresh without dummy delays', async () => {
    const clock = new ManualClock();
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository(), clock);
    const issued = await store.issue('user-1');
    clock.advance(REFRESH_TOKEN_TTL_MS + 1);
    await expect(store.rotate(issued.refreshToken)).rejects.toBeTruthy();
  });

  it('lists only live sessions and revokes others while keeping the current one', async () => {
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const current = await store.issue('user-1', { ip: '203.0.113.8', userAgent: 'Chrome' });
    const other = await store.issue('user-1', { ip: '198.51.100.10', userAgent: 'Firefox' });
    await store.issue('user-2');

    const listed = await store.listActive('user-1');
    expect(listed.map((session) => session.id).sort()).toEqual(
      [current.sessionId, other.sessionId].sort(),
    );

    const revoked = await store.revokeOthers('user-1', current.sessionId);
    expect(revoked).toBe(1);
    await expect(store.requireActive(current.sessionId, 'user-1')).resolves.toMatchObject({
      id: current.sessionId,
    });
    await expect(store.requireActive(other.sessionId, 'user-1')).rejects.toBeTruthy();
  });

  it('revokes every live session for the user', async () => {
    const store = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const first = await store.issue('user-1');
    const second = await store.issue('user-1');

    expect(await store.revokeAllForUser('user-1')).toBe(2);
    await expect(store.requireActive(first.sessionId, 'user-1')).rejects.toBeTruthy();
    await expect(store.requireActive(second.sessionId, 'user-1')).rejects.toBeTruthy();
    expect(await store.listActive('user-1')).toEqual([]);
  });
});
