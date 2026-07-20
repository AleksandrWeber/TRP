import { Timeframe } from '../../market-data/timeframe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RecoveryStateRepository } from './recovery-state.repository';
import {
  ExecutionMode,
  RecoveryStatus,
  SessionState,
  TradingSession,
  isRecoveryStatus,
  type CreateTradingSessionProperties,
  type RecoveryStateProperties,
} from './trading-session-aggregate';

const CREATED_AT = '2026-07-19T18:00:00.000Z';
const ACQUIRED_AT = '2026-07-19T18:01:00.000Z';
const RUNNING_AT = '2026-07-19T18:01:10.000Z';
const HEARTBEAT_EXPIRED_AT = '2026-07-19T18:01:30.000Z';
const LEASE_EXPIRED_AT = '2026-07-19T18:03:00.000Z';

function createProperties(): CreateTradingSessionProperties {
  return {
    sessionId: 'session-188',
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
  };
}

function leasedSession(): TradingSession {
  return TradingSession.create(createProperties()).acquireLease('runtime-1', {
    acquiredAt: ACQUIRED_AT,
    expiresAt: LEASE_EXPIRED_AT,
    heartbeatTimeoutMs: 30_000,
  });
}

function runningSession(): TradingSession {
  return leasedSession()
    .transitionTo(SessionState.STARTING, '2026-07-19T18:01:05.000Z')
    .transitionTo(SessionState.RUNNING, RUNNING_AT);
}

function pausedSession(): TradingSession {
  return runningSession()
    .transitionTo(SessionState.PAUSING, '2026-07-19T18:01:15.000Z')
    .transitionTo(SessionState.PAUSED, '2026-07-19T18:01:20.000Z');
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US188 TradingSession recovery', () => {
  it('starts with independent NOT_REQUIRED recovery state', () => {
    const session = TradingSession.create(createProperties());

    expect(session.recoveryStatus()).toBe(RecoveryStatus.NOT_REQUIRED);
    expect(session.recoveryState()).toEqual({
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
      recoveryId: null,
      recoveryAttempt: 0,
      recoveryStartedAt: null,
      recoveryCompletedAt: null,
      recoveryFailedAt: null,
      recoveryFailureReason: null,
    });
    expect(Object.isFrozen(session.recoveryState())).toBe(true);
  });

  it.each([runningSession, pausedSession])(
    'is eligible for a RUNNING or PAUSED session after heartbeat expiration',
    (createSession) => {
      const session = createSession();

      expect(session.canRecover('2026-07-19T18:01:29.999Z')).toBe(false);
      expect(session.canRecover(HEARTBEAT_EXPIRED_AT)).toBe(true);
      expect(session.isRecoveryRequired(HEARTBEAT_EXPIRED_AT)).toBe(true);
    },
  );

  it('is eligible when the lease expires even with a longer heartbeat timeout', () => {
    const session = TradingSession.create(createProperties())
      .acquireLease('runtime-1', {
        acquiredAt: ACQUIRED_AT,
        expiresAt: LEASE_EXPIRED_AT,
        heartbeatTimeoutMs: 300_000,
      })
      .transitionTo(SessionState.STARTING, '2026-07-19T18:01:05.000Z')
      .transitionTo(SessionState.RUNNING, RUNNING_AT);

    expect(session.isHeartbeatExpired(LEASE_EXPIRED_AT)).toBe(false);
    expect(session.isLeaseExpired(LEASE_EXPIRED_AT)).toBe(true);
    expect(session.canRecover(LEASE_EXPIRED_AT)).toBe(true);
  });

  it('rejects recovery without a lease or without either expiration condition', () => {
    const noLease = TradingSession.create(createProperties())
      .transitionTo(SessionState.STARTING, '2026-07-19T18:01:05.000Z')
      .transitionTo(SessionState.RUNNING, RUNNING_AT);
    const activeLease = runningSession();

    expect(noLease.canRecover(HEARTBEAT_EXPIRED_AT)).toBe(false);
    expect(() => noLease.beginRecovery(HEARTBEAT_EXPIRED_AT)).toThrow(/not eligible/);
    expect(() => activeLease.beginRecovery('2026-07-19T18:01:29.999Z')).toThrow(/not eligible/);
    expect(() => activeLease.canRecover('invalid')).toThrow(/now must be an ISO-8601 UTC/);
    expect(() => activeLease.beginRecovery('invalid')).toThrow(/now must be an ISO-8601 UTC/);
  });

  it.each([
    SessionState.CREATED,
    SessionState.STARTING,
    SessionState.PAUSING,
    SessionState.STOPPING,
  ])('rejects recovery while lifecycle is %s', (state) => {
    let session = leasedSession();
    if (state === SessionState.STARTING) {
      session = session.transitionTo(state, '2026-07-19T18:01:05.000Z');
    } else if (state === SessionState.PAUSING || state === SessionState.STOPPING) {
      session = session
        .transitionTo(SessionState.STARTING, '2026-07-19T18:01:05.000Z')
        .transitionTo(SessionState.RUNNING, RUNNING_AT)
        .transitionTo(state, '2026-07-19T18:01:20.000Z');
    }

    expect(session.canRecover(HEARTBEAT_EXPIRED_AT)).toBe(false);
  });

  it('rejects recovery after STOPPED or lifecycle FAILED', () => {
    const stopped = runningSession()
      .transitionTo(SessionState.STOPPING, '2026-07-19T18:01:20.000Z')
      .transitionTo(SessionState.STOPPED, HEARTBEAT_EXPIRED_AT);
    const failed = runningSession().fail('runtime failure', '2026-07-19T18:01:20.000Z');

    expect(stopped.canRecover(LEASE_EXPIRED_AT)).toBe(false);
    expect(failed.canRecover(LEASE_EXPIRED_AT)).toBe(false);
    expect(() => stopped.beginRecovery(LEASE_EXPIRED_AT)).toThrow(/not eligible/);
    expect(() => failed.beginRecovery(LEASE_EXPIRED_AT)).toThrow(/not eligible/);
  });

  it('begins recovery with immutable identity, incremented attempt, and a domain event', () => {
    const original = runningSession();
    const recovering = original.beginRecovery(HEARTBEAT_EXPIRED_AT);
    const state = recovering.recoveryState();

    expect(original.recoveryStatus()).toBe(RecoveryStatus.NOT_REQUIRED);
    expect(recovering.isRecovering()).toBe(true);
    expect(recovering.isRecovered()).toBe(false);
    expect(state.recoveryId).toMatch(/^[0-9a-f-]{36}$/);
    expect(state).toMatchObject({
      recoveryAttempt: 1,
      recoveryStartedAt: HEARTBEAT_EXPIRED_AT,
      recoveryCompletedAt: null,
      recoveryFailedAt: null,
      recoveryFailureReason: null,
    });
    expect(recovering.domainEvents().at(-1)).toMatchObject({
      eventType: 'TradingSessionRecoveryStarted',
      recoveryId: state.recoveryId,
      recoveryAttempt: 1,
      recoveryStartedAt: HEARTBEAT_EXPIRED_AT,
      recoveryStatus: RecoveryStatus.RECOVERING,
    });
    expect(recovering.currentState()).toBe(original.currentState());
    expect(recovering.toProperties().runtimeLease).toEqual(original.toProperties().runtimeLease);
    expect(recovering).toMatchObject({
      sessionId: original.sessionId,
      workspaceId: original.workspaceId,
      deploymentId: original.deploymentId,
      strategyId: original.strategyId,
      executionMode: original.executionMode,
    });
  });

  it('rejects duplicate begin without changing recovery identity or events', () => {
    const recovering = runningSession().beginRecovery(HEARTBEAT_EXPIRED_AT);
    const before = recovering.toProperties();
    const eventCount = recovering.domainEvents().length;

    expect(recovering.canRecover(LEASE_EXPIRED_AT)).toBe(false);
    expect(() => recovering.beginRecovery(LEASE_EXPIRED_AT)).toThrow(/already in progress/);
    expect(recovering.toProperties()).toEqual(before);
    expect(recovering.domainEvents()).toHaveLength(eventCount);
  });

  it('completes recovery once and rejects recovery after RECOVERED', () => {
    const recovering = runningSession().beginRecovery(HEARTBEAT_EXPIRED_AT);
    const completedAt = '2026-07-19T18:01:40.000Z';
    const recovered = recovering.completeRecovery(completedAt);

    expect(recovered.isRecovered()).toBe(true);
    expect(recovered.recoveryState()).toMatchObject({
      recoveryId: recovering.recoveryState().recoveryId,
      recoveryAttempt: 1,
      recoveryCompletedAt: completedAt,
    });
    expect(recovered.domainEvents().at(-1)).toMatchObject({
      eventType: 'TradingSessionRecoveryCompleted',
      recoveryCompletedAt: completedAt,
      recoveryStatus: RecoveryStatus.RECOVERED,
    });
    expect(recovered.canRecover(LEASE_EXPIRED_AT)).toBe(false);
    expect(() => recovered.completeRecovery('2026-07-19T18:01:50.000Z')).toThrow(
      /already completed/,
    );
    expect(() => recovered.beginRecovery(LEASE_EXPIRED_AT)).toThrow(/already completed/);
    expect(() => recovered.failRecovery('late failure')).toThrow(/not in progress/);
  });

  it('fails recovery once, stores a normalized reason, and permits a new attempt', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-07-19T18:01:40.000Z');
    const first = runningSession().beginRecovery(HEARTBEAT_EXPIRED_AT);
    const failed = first.failRecovery('  runtime restart failed  ');

    expect(failed.recoveryStatus()).toBe(RecoveryStatus.FAILED);
    expect(failed.recoveryState()).toMatchObject({
      recoveryId: first.recoveryState().recoveryId,
      recoveryAttempt: 1,
      recoveryFailedAt: '2026-07-19T18:01:40.000Z',
      recoveryFailureReason: 'runtime restart failed',
    });
    expect(failed.domainEvents().at(-1)).toMatchObject({
      eventType: 'TradingSessionRecoveryFailed',
      reason: 'runtime restart failed',
      recoveryStatus: RecoveryStatus.FAILED,
    });
    expect(() => failed.failRecovery('again')).toThrow(/already failed/);

    const retried = failed.beginRecovery('2026-07-19T18:01:50.000Z');
    expect(retried.recoveryState()).toMatchObject({
      recoveryAttempt: 2,
      recoveryStartedAt: '2026-07-19T18:01:50.000Z',
      recoveryFailedAt: null,
      recoveryFailureReason: null,
    });
    expect(retried.recoveryState().recoveryId).not.toBe(first.recoveryState().recoveryId);
  });

  it('rejects empty failure reason and completion/failure without an active recovery', () => {
    const session = runningSession();
    const recovering = session.beginRecovery(HEARTBEAT_EXPIRED_AT);

    expect(() => recovering.failRecovery(' ')).toThrow(/recovery reason is required/);
    expect(() => session.completeRecovery(HEARTBEAT_EXPIRED_AT)).toThrow(/not in progress/);
    expect(() => session.failRecovery('failure')).toThrow(/not in progress/);
    expect(() => recovering.completeRecovery('2026-07-19T18:01:29.999Z')).toThrow(
      /must not be before recoveryStartedAt/,
    );
    expect(() => recovering.completeRecovery('invalid')).toThrow(/ISO-8601 UTC/);
  });

  it('skips recovery with a reason and preserves lifecycle and ownership', () => {
    vi.useFakeTimers();
    vi.setSystemTime(HEARTBEAT_EXPIRED_AT);
    const original = runningSession();
    const skipped = original.skipRecovery('manual intervention selected');

    expect(skipped.recoveryStatus()).toBe(RecoveryStatus.NOT_REQUIRED);
    expect(skipped.currentState()).toBe(original.currentState());
    expect(skipped.toProperties().runtimeLease).toEqual(original.toProperties().runtimeLease);
    expect(skipped.domainEvents().at(-1)).toMatchObject({
      eventType: 'TradingSessionRecoverySkipped',
      reason: 'manual intervention selected',
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
    });
    expect(() => original.skipRecovery(' ')).toThrow(/recovery reason is required/);
    expect(() => original.beginRecovery(HEARTBEAT_EXPIRED_AT).skipRecovery('late')).toThrow(
      /already in progress/,
    );
  });

  it('validates recovery status and restored recovery metadata', () => {
    const base = runningSession().toProperties();
    const recoveryId = 'recovery-1';

    expect(Object.values(RecoveryStatus).every(isRecoveryStatus)).toBe(true);
    expect(isRecoveryStatus('SKIPPED')).toBe(false);
    expect(() =>
      TradingSession.restore({
        ...base,
        recoveryStatus: 'SKIPPED' as RecoveryStatus,
      }),
    ).toThrow(/Invalid recoveryStatus/);
    expect(() =>
      TradingSession.restore({
        ...base,
        recoveryStatus: RecoveryStatus.RECOVERING,
        recoveryId,
        recoveryAttempt: 1,
        recoveryStartedAt: null,
      }),
    ).toThrow(/requires recovery identity and start metadata/);
    expect(() =>
      TradingSession.restore({
        ...base,
        recoveryStatus: RecoveryStatus.RECOVERED,
        recoveryId,
        recoveryAttempt: 1,
        recoveryStartedAt: HEARTBEAT_EXPIRED_AT,
        recoveryCompletedAt: null,
      }),
    ).toThrow(/requires recoveryCompletedAt/);
    expect(() =>
      TradingSession.restore({
        ...base,
        recoveryStatus: RecoveryStatus.FAILED,
        recoveryId,
        recoveryAttempt: 1,
        recoveryStartedAt: HEARTBEAT_EXPIRED_AT,
        recoveryFailureReason: ' ',
      }),
    ).toThrow(/recovery reason is required/);
    expect(() =>
      TradingSession.restore({
        ...base,
        recoveryAttempt: -1,
      }),
    ).toThrow(/recoveryAttempt must be a non-negative integer/);
  });

  it('provides a recovery repository contract without an implementation', async () => {
    class ContractRepository implements RecoveryStateRepository {
      private states = new Map<string, RecoveryStateProperties>();

      async saveRecoveryState(
        sessionId: string,
        recoveryState: RecoveryStateProperties,
      ): Promise<void> {
        this.states.set(sessionId, recoveryState);
      }

      async loadRecoveryState(sessionId: string): Promise<RecoveryStateProperties | null> {
        return this.states.get(sessionId) ?? null;
      }

      async clearRecoveryState(sessionId: string): Promise<void> {
        this.states.delete(sessionId);
      }
    }

    const repository: RecoveryStateRepository = new ContractRepository();
    const state = runningSession().beginRecovery(HEARTBEAT_EXPIRED_AT).recoveryState();

    await repository.saveRecoveryState('session-188', state);
    await expect(repository.loadRecoveryState('session-188')).resolves.toBe(state);
    await repository.clearRecoveryState('session-188');
    await expect(repository.loadRecoveryState('session-188')).resolves.toBeNull();
  });
});
