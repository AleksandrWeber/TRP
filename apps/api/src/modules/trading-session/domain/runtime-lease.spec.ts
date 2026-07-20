import { Timeframe } from '../../market-data/timeframe';
import { describe, expect, it, vi } from 'vitest';
import type { RuntimeLeaseRepository } from './runtime-lease.repository';
import { RuntimeLease, type RuntimeLeaseProperties } from './runtime-lease';
import {
  ExecutionMode,
  DEFAULT_RUNTIME_LEASE_DURATION_MS,
  SessionState,
  TradingSession,
  type CreateTradingSessionProperties,
} from './trading-session-aggregate';

const CREATED_AT = '2026-07-19T18:00:00.000Z';
const ACQUIRED_AT = '2026-07-19T18:01:00.000Z';
const EXPIRES_AT = '2026-07-19T18:02:00.000Z';
const RELEASED_AT = '2026-07-19T18:01:30.000Z';

function leaseProperties(overrides: Partial<RuntimeLeaseProperties> = {}): RuntimeLeaseProperties {
  return {
    leaseId: 'lease-1',
    sessionId: 'session-186',
    ownerId: 'runtime-1',
    acquiredAt: ACQUIRED_AT,
    expiresAt: EXPIRES_AT,
    leaseVersion: 1,
    lastHeartbeatAt: ACQUIRED_AT,
    heartbeatTimeoutMs: 30_000,
    ...overrides,
  };
}

function sessionProperties(
  overrides: Partial<CreateTradingSessionProperties> = {},
): CreateTradingSessionProperties {
  return {
    sessionId: 'session-186',
    workspaceId: 'workspace-1',
    deploymentId: 'deployment-1',
    strategyId: 'strategy-1',
    executionMode: ExecutionMode.PAPER,
    marketType: 'CRYPTOCURRENCY',
    exchange: 'BINANCE',
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    createdAt: CREATED_AT,
    metadataVersion: 1,
    ...overrides,
  };
}

function acquire(session = TradingSession.create(sessionProperties()), ownerId = 'runtime-1') {
  return session.acquireLease(ownerId, {
    acquiredAt: ACQUIRED_AT,
    expiresAt: EXPIRES_AT,
  });
}

describe('US186 RuntimeLease', () => {
  it('creates and restores immutable leases', () => {
    const generated = RuntimeLease.create({
      sessionId: 'session-186',
      ownerId: 'runtime-1',
      acquiredAt: ACQUIRED_AT,
      expiresAt: EXPIRES_AT,
      leaseVersion: 1,
    });
    const restored = RuntimeLease.restore(leaseProperties());

    expect(generated.leaseId).toMatch(/^[0-9a-f-]{36}$/);
    expect(restored.toProperties()).toEqual(leaseProperties());
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.toProperties())).toBe(true);
  });

  it.each(['leaseId', 'sessionId', 'ownerId'] as const)('requires %s', (field) => {
    expect(() => RuntimeLease.restore(leaseProperties({ [field]: ' ' }))).toThrow(
      new RegExp(`${field} is required`),
    );
  });

  it.each(['acquiredAt', 'expiresAt'] as const)('validates %s', (field) => {
    expect(() => RuntimeLease.restore(leaseProperties({ [field]: 'invalid' }))).toThrow(
      new RegExp(`${field} must be an ISO-8601 UTC timestamp`),
    );
  });

  it('requires ordered timestamps and a positive lease version', () => {
    expect(() => RuntimeLease.restore(leaseProperties({ expiresAt: ACQUIRED_AT }))).toThrow(
      /expiresAt must be greater than acquiredAt/,
    );
    for (const leaseVersion of [0, -1, 1.5]) {
      expect(() => RuntimeLease.restore(leaseProperties({ leaseVersion }))).toThrow(
        /leaseVersion must be a positive integer/,
      );
    }
  });

  it('detects expiration at the boundary and validates now', () => {
    const lease = RuntimeLease.restore(leaseProperties());

    expect(lease.isExpired(RELEASED_AT)).toBe(false);
    expect(lease.isExpired(EXPIRES_AT)).toBe(true);
    expect(() => lease.isExpired('invalid')).toThrow(/now must be an ISO-8601 UTC timestamp/);
  });

  it('refreshes only heartbeat liveness with strictly ordered timestamps', () => {
    const lease = RuntimeLease.restore(leaseProperties());
    const heartbeatAt = '2026-07-19T18:01:10.000Z';
    const refreshed = lease.heartbeat(heartbeatAt);

    expect(lease.lastHeartbeat()).toBe(ACQUIRED_AT);
    expect(refreshed.toProperties()).toEqual({
      ...lease.toProperties(),
      lastHeartbeatAt: heartbeatAt,
    });
    expect(() => refreshed.heartbeat(ACQUIRED_AT)).toThrow(/heartbeat timestamp must move forward/);
    expect(() => refreshed.heartbeat(EXPIRES_AT)).toThrow(
      /heartbeat cannot renew an expired runtime lease/,
    );
  });

  it('evaluates configurable heartbeat timeout boundaries', () => {
    const lease = RuntimeLease.restore(leaseProperties({ heartbeatTimeoutMs: 10_000 }));

    expect(lease.heartbeatAge('2026-07-19T18:01:09.999Z')).toBe(9_999);
    expect(lease.isHeartbeatExpired('2026-07-19T18:01:09.999Z')).toBe(false);
    expect(lease.isHeartbeatExpired('2026-07-19T18:01:10.000Z')).toBe(true);
    expect(lease.requiresHeartbeat('2026-07-19T18:01:10.000Z')).toBe(true);
    expect(lease.requiresHeartbeat(EXPIRES_AT)).toBe(false);
    expect(() => lease.heartbeatAge('2026-07-19T18:00:59.999Z')).toThrow(
      /now must not be before lastHeartbeatAt/,
    );
  });

  it('validates restored heartbeat state', () => {
    expect(() => RuntimeLease.restore(leaseProperties({ lastHeartbeatAt: CREATED_AT }))).toThrow(
      /lastHeartbeatAt must be within the active lease period/,
    );
    expect(() => RuntimeLease.restore(leaseProperties({ lastHeartbeatAt: EXPIRES_AT }))).toThrow(
      /lastHeartbeatAt must be within the active lease period/,
    );
    expect(() => RuntimeLease.restore(leaseProperties({ heartbeatTimeoutMs: 0 }))).toThrow(
      /heartbeatTimeoutMs must be a positive integer/,
    );
  });
});

describe('US186 TradingSession runtime ownership', () => {
  it('supports acquisition with domain defaults', () => {
    vi.useFakeTimers();
    vi.setSystemTime(ACQUIRED_AT);
    try {
      const owned = TradingSession.create(sessionProperties()).acquireLease('runtime-1');
      const lease = owned.toProperties().runtimeLease;

      expect(lease?.acquiredAt).toBe(ACQUIRED_AT);
      expect(Date.parse(lease!.expiresAt) - Date.parse(lease!.acquiredAt)).toBe(
        DEFAULT_RUNTIME_LEASE_DURATION_MS,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('acquires one lease and records an acquired event', () => {
    const original = TradingSession.create(sessionProperties());
    const owned = acquire(original);
    const lease = owned.toProperties().runtimeLease;

    expect(original.hasLease(ACQUIRED_AT)).toBe(false);
    expect(owned.hasLease(ACQUIRED_AT)).toBe(true);
    expect(owned.leaseOwner(ACQUIRED_AT)).toBe('runtime-1');
    expect(lease).toMatchObject({
      sessionId: 'session-186',
      ownerId: 'runtime-1',
      leaseVersion: 1,
    });
    expect(lease?.leaseId).toMatch(/^[0-9a-f-]{36}$/);
    expect(owned.domainEvents().at(-1)).toMatchObject({
      eventType: 'RuntimeLeaseAcquired',
      lease,
    });
  });

  it('rejects duplicate acquisition by the same or another owner', () => {
    const owned = acquire();

    expect(owned.canAcquire('runtime-1', RELEASED_AT)).toBe(false);
    expect(owned.canAcquire('runtime-2', RELEASED_AT)).toBe(false);
    expect(() =>
      owned.acquireLease('runtime-1', {
        acquiredAt: RELEASED_AT,
        expiresAt: '2026-07-19T18:03:00.000Z',
      }),
    ).toThrow(/already has an active runtime lease/);
  });

  it('releases only by the owner and records a released event', () => {
    const owned = acquire();

    expect(owned.canRelease('runtime-1', RELEASED_AT)).toBe(true);
    expect(owned.canRelease('runtime-2', RELEASED_AT)).toBe(false);
    expect(() => owned.releaseLease('runtime-2', RELEASED_AT)).toThrow(
      /only be released by its owner/,
    );

    const released = owned.releaseLease('runtime-1', RELEASED_AT);
    expect(released.hasLease(RELEASED_AT)).toBe(false);
    expect(released.leaseOwner(RELEASED_AT)).toBeNull();
    expect(released.domainEvents().at(-1)).toMatchObject({
      eventType: 'RuntimeLeaseReleased',
      releasedAt: RELEASED_AT,
    });
    expect(() => released.releaseLease('runtime-1', RELEASED_AT)).toThrow(/has no runtime lease/);
  });

  it('detects expiration and replaces an expired lease with a new identity and version', () => {
    const owned = acquire();
    const firstLeaseId = owned.toProperties().runtimeLease?.leaseId;
    const reacquiredAt = '2026-07-19T18:03:00.000Z';
    const replaced = owned.acquireLease('runtime-2', {
      acquiredAt: reacquiredAt,
      expiresAt: '2026-07-19T18:04:00.000Z',
    });

    expect(owned.isLeaseExpired(EXPIRES_AT)).toBe(true);
    expect(owned.hasLease(EXPIRES_AT)).toBe(false);
    expect(owned.leaseOwner(EXPIRES_AT)).toBeNull();
    expect(owned.canAcquire('runtime-2', EXPIRES_AT)).toBe(true);
    expect(owned.canRelease('runtime-1', EXPIRES_AT)).toBe(false);
    expect(() => owned.releaseLease('runtime-1', EXPIRES_AT)).toThrow(
      /expired runtime lease cannot be reused/,
    );
    expect(replaced.toProperties().runtimeLease).toMatchObject({
      ownerId: 'runtime-2',
      leaseVersion: 2,
    });
    expect(replaced.toProperties().runtimeLease?.leaseId).not.toBe(firstLeaseId);
    expect(
      replaced
        .domainEvents()
        .slice(-2)
        .map((event) => event.eventType),
    ).toEqual(['RuntimeLeaseExpired', 'RuntimeLeaseAcquired']);
  });

  it('validates owners, operation timestamps, and restored lease invariants', () => {
    const session = TradingSession.create(sessionProperties());

    expect(() => session.acquireLease(' ')).toThrow(/ownerId is required/);
    expect(() => session.canAcquire(' ', ACQUIRED_AT)).toThrow(/ownerId is required/);
    expect(() => session.canRelease(' ', ACQUIRED_AT)).toThrow(/ownerId is required/);
    expect(() => session.isLeaseExpired('invalid')).toThrow(
      /now must be an ISO-8601 UTC timestamp/,
    );
    expect(() =>
      session.acquireLease('runtime-1', {
        acquiredAt: 'invalid',
        expiresAt: EXPIRES_AT,
      }),
    ).toThrow(/acquiredAt must be an ISO-8601 UTC timestamp/);

    const base = {
      ...session.toProperties(),
      runtimeLease: leaseProperties(),
      lastLeaseVersion: 1,
      updatedAt: ACQUIRED_AT,
    };
    expect(() =>
      TradingSession.restore({
        ...base,
        runtimeLease: leaseProperties({ sessionId: 'another-session' }),
      }),
    ).toThrow(/runtime lease sessionId must match/);
    expect(() =>
      TradingSession.restore({
        ...base,
        runtimeLease: leaseProperties({ leaseVersion: 2 }),
      }),
    ).toThrow(/runtime lease version must match/);
    expect(() => TradingSession.restore({ ...base, lastLeaseVersion: -1 })).toThrow(
      /lastLeaseVersion must be a non-negative integer/,
    );
  });

  it('provides the repository contract without an implementation', async () => {
    class ContractRepository implements RuntimeLeaseRepository {
      private lease: RuntimeLease | null = null;

      async acquire(lease: RuntimeLease): Promise<RuntimeLease> {
        this.lease = lease;
        return lease;
      }

      async release(leaseId: string, ownerId: string): Promise<void> {
        if (this.lease?.leaseId === leaseId && this.lease.ownerId === ownerId) this.lease = null;
      }

      async findActiveLease(sessionId: string, now: string): Promise<RuntimeLease | null> {
        return this.lease?.sessionId === sessionId && !this.lease.isExpired(now)
          ? this.lease
          : null;
      }

      async findBySessionId(sessionId: string): Promise<RuntimeLease | null> {
        return this.lease?.sessionId === sessionId ? this.lease : null;
      }
    }

    const repository: RuntimeLeaseRepository = new ContractRepository();
    const lease = RuntimeLease.restore(leaseProperties());
    await expect(repository.acquire(lease)).resolves.toBe(lease);
    await expect(repository.findActiveLease('session-186', ACQUIRED_AT)).resolves.toBe(lease);
    await expect(repository.findBySessionId('session-186')).resolves.toBe(lease);
    await repository.release('lease-1', 'runtime-1');
    await expect(repository.findBySessionId('session-186')).resolves.toBeNull();
  });

  it('preserves lifecycle state while changing ownership', () => {
    const owned = acquire();

    expect(owned.currentState()).toBe(SessionState.CREATED);
    expect(Object.isFrozen(owned)).toBe(true);
  });
});

describe('US187 Runtime heartbeat', () => {
  it('accepts an owner heartbeat without changing session identity or lifecycle', () => {
    const owned = acquire();
    const heartbeatAt = '2026-07-19T18:01:10.000Z';
    const refreshed = owned.heartbeat('runtime-1', heartbeatAt);

    expect(owned.lastHeartbeat()).toBe(ACQUIRED_AT);
    expect(refreshed.lastHeartbeat()).toBe(heartbeatAt);
    expect(refreshed.currentState()).toBe(owned.currentState());
    expect(refreshed.executionMode).toBe(owned.executionMode);
    expect(refreshed.leaseOwner(heartbeatAt)).toBe('runtime-1');
    expect(refreshed.updatedAt).toBe(owned.updatedAt);
    expect(refreshed.domainEvents().at(-1)).toMatchObject({
      eventType: 'RuntimeHeartbeatReceived',
      heartbeatAt,
      occurredAt: heartbeatAt,
      lease: {
        ownerId: 'runtime-1',
        lastHeartbeatAt: heartbeatAt,
      },
    });
  });

  it('rejects heartbeat by a non-owner', () => {
    expect(() => acquire().heartbeat('runtime-2', RELEASED_AT)).toThrow(
      /only be heartbeated by its owner/,
    );
  });

  it('rejects heartbeat without a lease and after release', () => {
    const session = TradingSession.create(sessionProperties());
    const released = acquire().releaseLease('runtime-1', RELEASED_AT);

    expect(() => session.heartbeat('runtime-1', RELEASED_AT)).toThrow(/has no runtime lease/);
    expect(() => released.heartbeat('runtime-1', '2026-07-19T18:01:40.000Z')).toThrow(
      /has no runtime lease/,
    );
  });

  it('rejects heartbeat after lease expiration', () => {
    expect(() => acquire().heartbeat('runtime-1', EXPIRES_AT)).toThrow(
      /expired runtime lease cannot be reused/,
    );
  });

  it('enforces heartbeat ordering', () => {
    const owned = acquire();
    const refreshed = owned.heartbeat('runtime-1', '2026-07-19T18:01:10.000Z');

    expect(() => owned.heartbeat('runtime-1', ACQUIRED_AT)).toThrow(
      /heartbeat timestamp must move forward/,
    );
    expect(() => refreshed.heartbeat('runtime-1', '2026-07-19T18:01:09.999Z')).toThrow(
      /heartbeat timestamp must move forward/,
    );
  });

  it('detects timeout and reports heartbeat age', () => {
    const owned = acquire();

    expect(owned.lastHeartbeat()).toBe(ACQUIRED_AT);
    expect(owned.heartbeatAge('2026-07-19T18:01:29.999Z')).toBe(29_999);
    expect(owned.isHeartbeatExpired('2026-07-19T18:01:29.999Z')).toBe(false);
    expect(owned.requiresHeartbeat('2026-07-19T18:01:29.999Z')).toBe(false);
    expect(owned.isHeartbeatExpired('2026-07-19T18:01:30.000Z')).toBe(true);
    expect(owned.requiresHeartbeat('2026-07-19T18:01:30.000Z')).toBe(true);
  });

  it('supports a configured timeout and emits expiration before a late heartbeat', () => {
    const owned = TradingSession.create(sessionProperties()).acquireLease('runtime-1', {
      acquiredAt: ACQUIRED_AT,
      expiresAt: EXPIRES_AT,
      heartbeatTimeoutMs: 10_000,
    });
    const heartbeatAt = '2026-07-19T18:01:15.000Z';
    const refreshed = owned.heartbeat('runtime-1', heartbeatAt);

    expect(
      refreshed
        .domainEvents()
        .slice(-2)
        .map((event) => event.eventType),
    ).toEqual(['RuntimeHeartbeatExpired', 'RuntimeHeartbeatReceived']);
    expect(refreshed.domainEvents().at(-2)).toMatchObject({
      eventType: 'RuntimeHeartbeatExpired',
      lastHeartbeatAt: ACQUIRED_AT,
      expiredAt: '2026-07-19T18:01:10.000Z',
      occurredAt: heartbeatAt,
    });
  });

  it('returns neutral heartbeat evaluations when no active lease exists', () => {
    const session = TradingSession.create(sessionProperties());

    expect(session.lastHeartbeat()).toBeNull();
    expect(session.heartbeatAge(ACQUIRED_AT)).toBeNull();
    expect(session.isHeartbeatExpired(ACQUIRED_AT)).toBe(false);
    expect(session.requiresHeartbeat(ACQUIRED_AT)).toBe(false);
  });
});
