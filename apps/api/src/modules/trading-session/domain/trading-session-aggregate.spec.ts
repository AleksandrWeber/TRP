import { Timeframe } from '../../market-data/timeframe';
import { describe, expect, it } from 'vitest';
import type { TradingSessionRepository } from './trading-session-aggregate.repository';
import {
  ExecutionMode,
  SessionState,
  TradingSession,
  isExecutionMode,
  isSessionState,
  type CreateTradingSessionProperties,
  type TradingSessionProperties,
} from './trading-session-aggregate';
import type { TradingSessionCreated, TradingSessionDomainEvent } from './trading-session-events';

const CREATED_AT = '2026-07-19T18:00:00.000Z';
const STARTED_AT = '2026-07-19T18:01:00.000Z';
const LATER_AT = '2026-07-19T18:02:00.000Z';

function createProperties(
  overrides: Partial<CreateTradingSessionProperties> = {},
): CreateTradingSessionProperties {
  return {
    sessionId: 'session-184',
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

function restoredProperties(
  state: SessionState,
  overrides: Partial<TradingSessionProperties> = {},
): TradingSessionProperties {
  const startedAt = [
    SessionState.RUNNING,
    SessionState.PAUSING,
    SessionState.PAUSED,
    SessionState.STOPPING,
    SessionState.STOPPED,
  ].includes(state)
    ? STARTED_AT
    : null;
  return {
    ...createProperties(),
    updatedAt: state === SessionState.CREATED ? CREATED_AT : LATER_AT,
    startedAt,
    stoppedAt: state === SessionState.STOPPED ? LATER_AT : null,
    failedAt: state === SessionState.FAILED ? LATER_AT : null,
    failureReason: state === SessionState.FAILED ? 'restored failure' : null,
    currentState: state,
    runtimeLease: null,
    lastLeaseVersion: 0,
    ...overrides,
  };
}

describe('US184 TradingSession aggregate', () => {
  it('creates an immutable session in CREATED state', () => {
    const session = TradingSession.create(createProperties());

    expect(session).toMatchObject({
      sessionId: 'session-184',
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      strategyId: 'strategy-1',
      executionMode: ExecutionMode.PAPER,
      marketType: 'CRYPTOCURRENCY',
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      timeframe: Timeframe.M5,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      startedAt: null,
      stoppedAt: null,
      metadataVersion: 1,
    });
    expect(session.currentState()).toBe(SessionState.CREATED);
    expect(Object.isFrozen(session)).toBe(true);
    expect(Object.isFrozen(session.toProperties())).toBe(true);
  });

  it('normalizes identifiers without allowing SessionId mutation', () => {
    const original = TradingSession.create(
      createProperties({
        sessionId: ' session-184 ',
        workspaceId: ' workspace-1 ',
        deploymentId: ' deployment-1 ',
        strategyId: ' strategy-1 ',
      }),
    );
    const transitioned = original.transitionTo(SessionState.STARTING, LATER_AT);

    expect(original.sessionId).toBe('session-184');
    expect(transitioned.sessionId).toBe(original.sessionId);
    expect(transitioned).not.toBe(original);
  });

  it.each([
    [SessionState.CREATED, SessionState.STARTING],
    [SessionState.STARTING, SessionState.RUNNING],
    [SessionState.STARTING, SessionState.FAILED],
    [SessionState.RUNNING, SessionState.PAUSING],
    [SessionState.RUNNING, SessionState.STOPPING],
    [SessionState.RUNNING, SessionState.FAILED],
    [SessionState.PAUSING, SessionState.PAUSED],
    [SessionState.PAUSING, SessionState.FAILED],
    [SessionState.PAUSED, SessionState.RUNNING],
    [SessionState.PAUSED, SessionState.STOPPING],
    [SessionState.PAUSED, SessionState.FAILED],
    [SessionState.STOPPING, SessionState.STOPPED],
    [SessionState.STOPPING, SessionState.FAILED],
  ])('allows %s -> %s', (from, to) => {
    const session = TradingSession.restore(restoredProperties(from));
    const transitioned =
      to === SessionState.FAILED
        ? session.fail('transition failed', '2026-07-19T18:03:00.000Z')
        : session.transitionTo(to, '2026-07-19T18:03:00.000Z');

    expect(transitioned.currentState()).toBe(to);
    expect(transitioned.updatedAt).toBe('2026-07-19T18:03:00.000Z');
  });

  it('sets lifecycle timestamps without replacing the first start time on resume', () => {
    const created = TradingSession.create(createProperties());
    const starting = created.transitionTo(SessionState.STARTING, STARTED_AT);
    const running = starting.transitionTo(SessionState.RUNNING, LATER_AT);
    const pausing = running.transitionTo(SessionState.PAUSING, '2026-07-19T18:03:00.000Z');
    const paused = pausing.transitionTo(SessionState.PAUSED, '2026-07-19T18:04:00.000Z');
    const resumed = paused.transitionTo(SessionState.RUNNING, '2026-07-19T18:05:00.000Z');
    const stopping = resumed.transitionTo(SessionState.STOPPING, '2026-07-19T18:06:00.000Z');
    const stopped = stopping.transitionTo(SessionState.STOPPED, '2026-07-19T18:07:00.000Z');

    expect(running.startedAt).toBe(LATER_AT);
    expect(resumed.startedAt).toBe(LATER_AT);
    expect(stopped.stoppedAt).toBe('2026-07-19T18:07:00.000Z');
  });

  it.each([
    [SessionState.CREATED, SessionState.RUNNING],
    [SessionState.STARTING, SessionState.PAUSED],
    [SessionState.RUNNING, SessionState.PAUSED],
    [SessionState.PAUSING, SessionState.RUNNING],
    [SessionState.PAUSED, SessionState.PAUSING],
    [SessionState.STOPPED, SessionState.RUNNING],
    [SessionState.FAILED, SessionState.STARTING],
  ])('rejects invalid transition %s -> %s', (from, to) => {
    const session = TradingSession.restore(restoredProperties(from));

    expect(session.canTransitionTo(to)).toBe(false);
    expect(() => session.transitionTo(to, '2026-07-19T18:03:00.000Z')).toThrow(
      /Invalid TradingSession transition/,
    );
  });

  it('rejects unknown states and transition timestamps moving backwards', () => {
    const created = TradingSession.create(createProperties());

    expect(created.canTransitionTo('UNKNOWN' as SessionState)).toBe(false);
    expect(() => created.transitionTo('UNKNOWN' as SessionState, LATER_AT)).toThrow(
      /Invalid TradingSession transition/,
    );
    expect(() =>
      TradingSession.restore(restoredProperties(SessionState.RUNNING)).transitionTo(
        SessionState.PAUSING,
        STARTED_AT,
      ),
    ).toThrow(/occurredAt must not be before updatedAt/);
    expect(() => created.transitionTo(SessionState.STARTING, 'not-a-timestamp')).toThrow(
      /occurredAt must be an ISO-8601 UTC timestamp/,
    );
  });

  it('defines and validates all execution modes and session states', () => {
    for (const executionMode of Object.values(ExecutionMode)) {
      expect(TradingSession.create(createProperties({ executionMode })).executionMode).toBe(
        executionMode,
      );
      expect(isExecutionMode(executionMode)).toBe(true);
    }
    for (const state of Object.values(SessionState)) {
      expect(isSessionState(state)).toBe(true);
    }
    expect(isExecutionMode('SIMULATION')).toBe(false);
    expect(isSessionState('RECOVERING')).toBe(false);
    expect(() =>
      TradingSession.create(createProperties({ executionMode: 'SIMULATION' as ExecutionMode })),
    ).toThrow(/Invalid executionMode/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.CREATED, {
          currentState: 'RECOVERING' as SessionState,
        }),
      ),
    ).toThrow(/Invalid currentState/);
    expect(() => TradingSession.create(createProperties({ timeframe: '2m' as Timeframe }))).toThrow(
      /Invalid timeframe/,
    );
  });

  it.each([
    'sessionId',
    'workspaceId',
    'deploymentId',
    'strategyId',
    'marketType',
    'exchange',
    'symbol',
  ] as const)('requires %s', (field) => {
    expect(() => TradingSession.create(createProperties({ [field]: ' ' }))).toThrow(
      new RegExp(`${field} is required`),
    );
  });

  it.each([0, -1, 1.5, Number.NaN])('requires a positive integer metadataVersion: %s', (value) => {
    expect(() => TradingSession.create(createProperties({ metadataVersion: value }))).toThrow(
      /metadataVersion must be a positive integer/,
    );
  });

  it('validates timestamp syntax and ordering', () => {
    expect(() => TradingSession.create(createProperties({ createdAt: 'invalid' }))).toThrow(
      /createdAt must be an ISO-8601 UTC timestamp/,
    );
    expect(() =>
      TradingSession.create(
        createProperties({
          updatedAt: '2026-07-19T17:59:00.000Z',
        }),
      ),
    ).toThrow(/updatedAt must not be before createdAt/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.RUNNING, {
          startedAt: 'invalid',
        }),
      ),
    ).toThrow(/startedAt must be an ISO-8601 UTC timestamp/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.STOPPED, {
          stoppedAt: 'invalid',
        }),
      ),
    ).toThrow(/stoppedAt must be an ISO-8601 UTC timestamp/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.RUNNING, {
          startedAt: '2026-07-19T17:59:00.000Z',
        }),
      ),
    ).toThrow(/startedAt must be between createdAt and updatedAt/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.STOPPED, {
          startedAt: null,
        }),
      ),
    ).toThrow(/stoppedAt requires startedAt/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.STOPPED, {
          stoppedAt: '2026-07-19T18:00:30.000Z',
        }),
      ),
    ).toThrow(/stoppedAt must be between startedAt and updatedAt/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.PAUSED, {
          stoppedAt: LATER_AT,
        }),
      ),
    ).toThrow(/stoppedAt is only valid for STOPPED sessions/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.RUNNING, {
          startedAt: null,
        }),
      ),
    ).toThrow(/RUNNING requires startedAt/);
    expect(() =>
      TradingSession.restore(
        restoredProperties(SessionState.STOPPED, {
          stoppedAt: null,
        }),
      ),
    ).toThrow(/STOPPED requires stoppedAt/);
  });

  it('defines immutable domain event contracts without an event bus', () => {
    const event: TradingSessionCreated = Object.freeze({
      eventType: 'TradingSessionCreated',
      sessionId: 'session-184',
      workspaceId: 'workspace-1',
      occurredAt: CREATED_AT,
      metadataVersion: 1,
      deploymentId: 'deployment-1',
      strategyId: 'strategy-1',
      executionMode: ExecutionMode.RESEARCH,
      currentState: SessionState.CREATED,
    });
    const domainEvent: TradingSessionDomainEvent = event;

    expect(domainEvent.eventType).toBe('TradingSessionCreated');
    expect(Object.isFrozen(domainEvent)).toBe(true);
  });

  it('provides the persistence-agnostic repository contract', async () => {
    class ContractRepository implements TradingSessionRepository {
      private value: TradingSession | null = null;

      async create(session: TradingSession): Promise<TradingSession> {
        this.value = session;
        return session;
      }

      async findById(sessionId: string): Promise<TradingSession | null> {
        return this.value?.sessionId === sessionId ? this.value : null;
      }

      async update(session: TradingSession): Promise<TradingSession> {
        this.value = session;
        return session;
      }

      async delete(sessionId: string): Promise<void> {
        if (this.value?.sessionId === sessionId) this.value = null;
      }
    }

    const repository: TradingSessionRepository = new ContractRepository();
    const session = TradingSession.create(createProperties());
    await expect(repository.create(session)).resolves.toBe(session);
    await expect(repository.findById(session.sessionId)).resolves.toBe(session);
    await expect(repository.update(session)).resolves.toBe(session);
    await repository.delete(session.sessionId);
    await expect(repository.findById(session.sessionId)).resolves.toBeNull();
  });
});
