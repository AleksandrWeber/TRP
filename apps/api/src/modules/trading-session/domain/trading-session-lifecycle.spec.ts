import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import {
  ExecutionMode,
  SessionState,
  TradingSession,
  type CreateTradingSessionProperties,
  type TradingSessionProperties,
} from './trading-session-aggregate';
import {
  DuplicateTradingSessionFailureError,
  InvalidLifecycleTimestampError,
  InvalidTradingSessionTransitionError,
  MissingFailureReasonError,
  TradingSessionDomainError,
} from './trading-session-errors';

const CREATED_AT = '2026-07-19T18:00:00.000Z';
const T1 = '2026-07-19T18:01:00.000Z';
const T2 = '2026-07-19T18:02:00.000Z';
const T3 = '2026-07-19T18:03:00.000Z';
const T4 = '2026-07-19T18:04:00.000Z';
const T5 = '2026-07-19T18:05:00.000Z';
const T6 = '2026-07-19T18:06:00.000Z';
const T7 = '2026-07-19T18:07:00.000Z';

function properties(
  overrides: Partial<CreateTradingSessionProperties> = {},
): CreateTradingSessionProperties {
  return {
    sessionId: 'session-185',
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

function snapshot(state: SessionState): TradingSessionProperties {
  const started = [
    SessionState.RUNNING,
    SessionState.PAUSING,
    SessionState.PAUSED,
    SessionState.STOPPING,
    SessionState.STOPPED,
  ].includes(state);
  return {
    ...properties(),
    updatedAt: state === SessionState.CREATED ? CREATED_AT : T2,
    startedAt: started ? T1 : null,
    stoppedAt: state === SessionState.STOPPED ? T2 : null,
    failedAt: state === SessionState.FAILED ? T2 : null,
    failureReason: state === SessionState.FAILED ? 'exchange unavailable' : null,
    currentState: state,
    runtimeLease: null,
    lastLeaseVersion: 0,
  };
}

function attemptTransition(session: TradingSession, nextState: SessionState): TradingSession {
  return nextState === SessionState.FAILED
    ? session.fail('forced failure', T3)
    : session.transitionTo(nextState, T3);
}

const LEGAL = new Set([
  'CREATED:STARTING',
  'STARTING:RUNNING',
  'STARTING:FAILED',
  'RUNNING:PAUSING',
  'RUNNING:STOPPING',
  'RUNNING:FAILED',
  'PAUSING:PAUSED',
  'PAUSING:FAILED',
  'PAUSED:RUNNING',
  'PAUSED:STOPPING',
  'PAUSED:FAILED',
  'STOPPING:STOPPED',
  'STOPPING:FAILED',
]);

describe('US185 TradingSession lifecycle', () => {
  it('executes the complete start, pause, resume, and stop lifecycle', () => {
    const created = TradingSession.create(properties());
    const starting = created.start(T1);
    const running = starting.transitionTo(SessionState.RUNNING, T2);
    const pausing = running.pause(T3);
    const paused = pausing.transitionTo(SessionState.PAUSED, T4);
    const resumed = paused.resume(T5);
    const stopping = resumed.stop(T6);
    const stopped = stopping.transitionTo(SessionState.STOPPED, T7);

    expect([
      created.currentState(),
      starting.currentState(),
      running.currentState(),
      pausing.currentState(),
      paused.currentState(),
      resumed.currentState(),
      stopping.currentState(),
      stopped.currentState(),
    ]).toEqual([
      SessionState.CREATED,
      SessionState.STARTING,
      SessionState.RUNNING,
      SessionState.PAUSING,
      SessionState.PAUSED,
      SessionState.RUNNING,
      SessionState.STOPPING,
      SessionState.STOPPED,
    ]);
    expect(running.startedAt).toBe(T2);
    expect(resumed.startedAt).toBe(T2);
    expect(stopped.stoppedAt).toBe(T7);
    expect(stopped.updatedAt).toBe(T7);
  });

  it.each(
    Object.values(SessionState).flatMap((from) =>
      Object.values(SessionState)
        .filter((to) => !LEGAL.has(`${from}:${to}`))
        .map((to) => [from, to] as const),
    ),
  )('rejects illegal transition %s -> %s with a domain error', (from, to) => {
    const session = TradingSession.restore(snapshot(from));

    try {
      attemptTransition(session, to);
      expect.unreachable('illegal transition succeeded');
    } catch (error) {
      expect(error).toBeInstanceOf(TradingSessionDomainError);
    }
  });

  it('protects both terminal states', () => {
    const stopped = TradingSession.restore(snapshot(SessionState.STOPPED));
    const failed = TradingSession.restore(snapshot(SessionState.FAILED));

    for (const state of Object.values(SessionState)) {
      expect(() => attemptTransition(stopped, state)).toThrow();
      expect(() => attemptTransition(failed, state)).toThrow();
    }
    expect(stopped.isTerminal()).toBe(true);
    expect(failed.isTerminal()).toBe(true);
  });

  it.each([
    SessionState.STARTING,
    SessionState.RUNNING,
    SessionState.PAUSING,
    SessionState.PAUSED,
    SessionState.STOPPING,
  ])('fails active state %s and records immutable failure details', (state) => {
    const failed = TradingSession.restore(snapshot(state)).fail('  provider timeout  ', T3);

    expect(failed.currentState()).toBe(SessionState.FAILED);
    expect(failed.failureReason).toBe('provider timeout');
    expect(failed.failedAt).toBe(T3);
    expect(failed.updatedAt).toBe(T3);
    expect(failed.isFailed()).toBe(true);
    expect(failed.isTerminal()).toBe(true);
  });

  it('rejects missing reasons, direct FAILED transitions, and duplicate failure', () => {
    const running = TradingSession.restore(snapshot(SessionState.RUNNING));
    const failed = running.fail('provider timeout', T3);

    expect(() => running.fail(' ', T3)).toThrow(MissingFailureReasonError);
    expect(() => running.fail(null as unknown as string, T3)).toThrow(MissingFailureReasonError);
    expect(() => running.transitionTo(SessionState.FAILED, T3)).toThrow(MissingFailureReasonError);
    expect(() => failed.fail('again', T4)).toThrow(DuplicateTradingSessionFailureError);
  });

  it('rejects same-state, terminal, unknown, and out-of-order transitions', () => {
    const running = TradingSession.restore(snapshot(SessionState.RUNNING));

    expect(() => running.transitionTo(SessionState.RUNNING, T3)).toThrow(
      InvalidTradingSessionTransitionError,
    );
    expect(() => running.transitionTo('UNKNOWN' as SessionState, T3)).toThrow(
      InvalidTradingSessionTransitionError,
    );
    expect(() => running.pause(T1)).toThrow(InvalidLifecycleTimestampError);
    expect(() => running.pause('invalid')).toThrow(InvalidLifecycleTimestampError);
  });

  it('raises only milestone events and preserves their order in memory', () => {
    const created = TradingSession.create(properties());
    const starting = created.start(T1);
    const running = starting.transitionTo(SessionState.RUNNING, T2);
    const pausing = running.pause(T3);
    const paused = pausing.transitionTo(SessionState.PAUSED, T4);
    const resumed = paused.resume(T5);
    const stopping = resumed.stop(T6);
    const stopped = stopping.transitionTo(SessionState.STOPPED, T7);

    expect(created.domainEvents()).toEqual([]);
    expect(starting.domainEvents()).toEqual([]);
    expect(pausing.domainEvents().map(({ eventType }) => eventType)).toEqual([
      'TradingSessionStarted',
    ]);
    expect(stopping.domainEvents().map(({ eventType }) => eventType)).toEqual([
      'TradingSessionStarted',
      'TradingSessionPaused',
      'TradingSessionResumed',
    ]);
    expect(stopped.domainEvents().map(({ eventType }) => eventType)).toEqual([
      'TradingSessionStarted',
      'TradingSessionPaused',
      'TradingSessionResumed',
      'TradingSessionStopped',
    ]);
    expect(Object.isFrozen(stopped.domainEvents())).toBe(true);
    for (const event of stopped.domainEvents()) {
      expect(Object.isFrozen(event)).toBe(true);
    }
  });

  it('raises TradingSessionFailed with its reason and timestamp', () => {
    const failed = TradingSession.restore(snapshot(SessionState.RUNNING)).fail('risk limit', T3);

    expect(failed.domainEvents()).toEqual([
      {
        eventType: 'TradingSessionFailed',
        sessionId: 'session-185',
        workspaceId: 'workspace-1',
        occurredAt: T3,
        metadataVersion: 1,
        failedAt: T3,
        reason: 'risk limit',
        currentState: SessionState.FAILED,
      },
    ]);
  });

  it('reports lifecycle state through query operations', () => {
    const running = TradingSession.restore(snapshot(SessionState.RUNNING));
    const paused = TradingSession.restore(snapshot(SessionState.PAUSED));
    const stopped = TradingSession.restore(snapshot(SessionState.STOPPED));

    expect(running.isRunning()).toBe(true);
    expect(running.isPaused()).toBe(false);
    expect(running.isStopped()).toBe(false);
    expect(running.isFailed()).toBe(false);
    expect(running.isTerminal()).toBe(false);
    expect(paused.isPaused()).toBe(true);
    expect(stopped.isStopped()).toBe(true);
  });

  it('preserves immutable identity and deployment properties across transitions', () => {
    const created = TradingSession.create(properties());
    const starting = created.start(T1);

    expect(starting.toProperties()).toMatchObject({
      sessionId: created.sessionId,
      workspaceId: created.workspaceId,
      deploymentId: created.deploymentId,
      executionMode: created.executionMode,
    });
    expect(starting).not.toBe(created);
    expect(Object.isFrozen(starting)).toBe(true);
  });

  it('assigns a monotonic timestamp when an operation omits occurredAt', () => {
    const starting = TradingSession.create(properties()).start();

    expect(Date.parse(starting.updatedAt)).toBeGreaterThan(Date.parse(CREATED_AT));
  });

  it('validates failed snapshots and failure timestamp ordering', () => {
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.FAILED),
        failedAt: null,
      }),
    ).toThrow(/FAILED requires failedAt/);
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.FAILED),
        failureReason: ' ',
      }),
    ).toThrow(MissingFailureReasonError);
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.FAILED),
        failedAt: '2026-07-19T17:59:00.000Z',
      }),
    ).toThrow(/failedAt must be between createdAt and updatedAt/);
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.RUNNING),
        failedAt: T2,
      }),
    ).toThrow(/failedAt is only valid for FAILED sessions/);
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.RUNNING),
        failureReason: 'unexpected',
      }),
    ).toThrow(/failureReason is only valid for FAILED sessions/);
    expect(() =>
      TradingSession.restore({
        ...snapshot(SessionState.STARTING),
        startedAt: T1,
      }),
    ).toThrow(/STARTING must not have startedAt/);
  });
});
