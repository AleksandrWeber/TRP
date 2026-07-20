import {
  ResearchApplicationService,
  ResearchSessionAlreadyExistsError,
  ResearchSessionAlreadyRunningError,
  ResearchSessionMapper,
  ResearchSessionNotFoundError,
  ResearchSessionStoppedError,
  ResearchValidationError,
  createResearchSessionRequest,
  createResearchSessionResponse,
  createSessionSummary,
  type CreateResearchSessionRequest,
  type ResearchApplicationServiceDependencies,
  type ResearchSessionRecord,
  type ResearchSessionRepository,
  type ResearchSessionResponse,
} from './index';
import {
  ExecutionMode,
  RecoveryStatus,
  SessionState,
  TradingSession,
} from '../trading-session/domain';
import {
  RunnerStatus,
  type PaperExecutionContext,
  type PaperStrategy,
} from '../paper-trading-runner';
import { afterEach, describe, expect, it, vi } from 'vitest';

const CREATED_AT = '2026-07-19T20:00:00.000Z';
const START_AT = '2026-07-19T20:01:00.000Z';
const CYCLE_AT = '2026-07-19T20:01:05.000Z';
const CYCLE_2_AT = '2026-07-19T20:01:10.000Z';
const STOP_AT = '2026-07-19T20:01:15.000Z';
const HEARTBEAT_EXPIRED_AT = '2026-07-19T20:01:06.000Z';
const SESSION_ID = 'research-session-190';
const RUNTIME_ID = 'runtime-190';

class InMemoryResearchSessionRepository implements ResearchSessionRepository {
  readonly records = new Map<string, ResearchSessionRecord>();

  async save(record: ResearchSessionRecord): Promise<void> {
    this.records.set(record.sessionId, Object.freeze({ ...record }));
  }

  async findById(sessionId: string): Promise<ResearchSessionRecord | null> {
    return this.records.get(sessionId) ?? null;
  }

  async findAll(): Promise<readonly ResearchSessionRecord[]> {
    return Object.freeze([...this.records.values()]);
  }

  async delete(sessionId: string): Promise<void> {
    this.records.delete(sessionId);
  }
}

class RecordingStrategy implements PaperStrategy {
  readonly initializeCalls: PaperExecutionContext[] = [];
  readonly executeCalls: PaperExecutionContext[] = [];
  readonly shutdownCalls: PaperExecutionContext[] = [];
  onInitialize: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;
  onExecute: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;
  onShutdown: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;

  async initialize(context: PaperExecutionContext): Promise<void> {
    this.initializeCalls.push(context);
    await this.onInitialize?.(context);
  }

  async execute(context: PaperExecutionContext): Promise<void> {
    this.executeCalls.push(context);
    await this.onExecute?.(context);
  }

  async shutdown(context: PaperExecutionContext): Promise<void> {
    this.shutdownCalls.push(context);
    await this.onShutdown?.(context);
  }
}

function createRequest(
  overrides: Partial<CreateResearchSessionRequest> = {},
): CreateResearchSessionRequest {
  return createResearchSessionRequest({
    executionMode: ExecutionMode.PAPER,
    strategyId: 'strategy-1',
    workspaceId: 'workspace-1',
    ...overrides,
  });
}

function createService(
  overrides: Partial<ResearchApplicationServiceDependencies> & {
    repository?: InMemoryResearchSessionRepository;
    strategy?: RecordingStrategy;
    clockTimes?: string[];
  } = {},
): {
  service: ResearchApplicationService;
  repository: InMemoryResearchSessionRepository;
  strategy: RecordingStrategy;
} {
  const repository = overrides.repository ?? new InMemoryResearchSessionRepository();
  const strategy = overrides.strategy ?? new RecordingStrategy();
  const times = [...(overrides.clockTimes ?? [CREATED_AT, START_AT, CYCLE_AT, STOP_AT])];
  let clockIndex = 0;
  const clock =
    overrides.clock ??
    (() => {
      const value = times[Math.min(clockIndex, times.length - 1)] as string;
      clockIndex += 1;
      return value;
    });

  const service = ResearchApplicationService.create({
    repository,
    resolveStrategy: () => strategy,
    clock,
    createSessionId: () => SESSION_ID,
    createRuntimeId: () => RUNTIME_ID,
    ...overrides,
  });

  return { service, repository, strategy };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US190 Research API DTOs', () => {
  it('creates immutable request, response, and summary DTOs', () => {
    const request = createResearchSessionRequest({
      executionMode: ExecutionMode.PAPER,
      strategyId: 'strategy-1',
      workspaceId: 'workspace-1',
      metadata: { label: 'smoke' },
    });
    const response = createResearchSessionResponse({
      sessionId: SESSION_ID,
      status: SessionState.CREATED,
      runnerStatus: RunnerStatus.CREATED,
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
      executionMode: ExecutionMode.PAPER,
      startedAt: null,
      stoppedAt: null,
      cycleNumber: 0,
    });
    const summary = createSessionSummary({
      sessionId: SESSION_ID,
      status: SessionState.CREATED,
      executionMode: ExecutionMode.PAPER,
    });

    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.metadata)).toBe(true);
    expect(Object.isFrozen(response)).toBe(true);
    expect(Object.isFrozen(summary)).toBe(true);
  });
});

describe('US190 ResearchSessionRepository contract', () => {
  it('supports save, findById, findAll, and delete', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({ repository });
    const created = await service.createSession(createRequest());

    const found = await repository.findById(created.sessionId);
    expect(found?.sessionId).toBe(SESSION_ID);
    expect(found?.strategyId).toBe('strategy-1');
    expect(await repository.findAll()).toHaveLength(1);

    await repository.delete(SESSION_ID);
    expect(await repository.findById(SESSION_ID)).toBeNull();
    expect(await repository.findAll()).toHaveLength(0);
  });
});

describe('US190 ResearchSessionMapper', () => {
  it('maps TradingSessionAggregate to response and summary without exposing the aggregate', () => {
    const mapper = new ResearchSessionMapper();
    const { service, repository } = createService();

    return service
      .createSession(createRequest({ metadata: { source: 'test' } }))
      .then(async (created) => {
        const record = (await repository.findById(created.sessionId)) as ResearchSessionRecord;
        const aggregate = mapper.toAggregate(record);
        const response = mapper.toResponse(aggregate, null);
        const summary = mapper.toSummary(aggregate);
        const mappedRecord = mapper.toRecord(aggregate, record.metadata);

        expect(response).toEqual({
          sessionId: SESSION_ID,
          status: SessionState.CREATED,
          runnerStatus: RunnerStatus.CREATED,
          recoveryStatus: RecoveryStatus.NOT_REQUIRED,
          executionMode: ExecutionMode.PAPER,
          startedAt: null,
          stoppedAt: null,
          cycleNumber: 0,
        });
        expect(summary).toEqual({
          sessionId: SESSION_ID,
          status: SessionState.CREATED,
          executionMode: ExecutionMode.PAPER,
        });
        expect(Object.isFrozen(response)).toBe(true);
        expect(Object.isFrozen(summary)).toBe(true);
        expect(Object.isFrozen(mappedRecord)).toBe(true);
        expect(mappedRecord.metadata).toEqual({ source: 'test' });
        expect(aggregate).toBeInstanceOf(TradingSession);
      });
  });
});

describe('US190 ResearchApplicationService createSession', () => {
  it('creates a research session and emits ResearchSessionCreated', async () => {
    const { service, repository } = createService();

    const response = await service.createSession(
      createRequest({ metadata: { campaign: 'alpha' } }),
    );

    expect(response).toEqual({
      sessionId: SESSION_ID,
      status: SessionState.CREATED,
      runnerStatus: RunnerStatus.CREATED,
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
      executionMode: ExecutionMode.PAPER,
      startedAt: null,
      stoppedAt: null,
      cycleNumber: 0,
    });
    expect(Object.isFrozen(response)).toBe(true);
    expect(repository.records.size).toBe(1);
    expect(service.domainEvents()).toEqual([
      {
        eventType: 'ResearchSessionCreated',
        sessionId: SESSION_ID,
        occurredAt: CREATED_AT,
        workspaceId: 'workspace-1',
        strategyId: 'strategy-1',
        executionMode: ExecutionMode.PAPER,
      },
    ]);
    expect(Object.isFrozen(service.domainEvents())).toBe(true);
  });

  it('rejects duplicate session ids', async () => {
    const { service } = createService();
    await service.createSession(createRequest());

    await expect(service.createSession(createRequest())).rejects.toBeInstanceOf(
      ResearchSessionAlreadyExistsError,
    );
  });

  it('rejects missing strategy', async () => {
    const { service } = createService();

    await expect(
      service.createSession(createRequest({ strategyId: '   ' })),
    ).rejects.toBeInstanceOf(ResearchValidationError);
    await expect(service.createSession(createRequest({ strategyId: '' }))).rejects.toThrow(
      /missing strategy/,
    );
  });

  it('rejects invalid execution modes', async () => {
    const { service } = createService();

    await expect(
      service.createSession(createRequest({ executionMode: ExecutionMode.LIVE })),
    ).rejects.toBeInstanceOf(ResearchValidationError);
    await expect(
      service.createSession(createRequest({ executionMode: ExecutionMode.RESEARCH })),
    ).rejects.toThrow(/invalid execution mode/);
    await expect(
      service.createSession(createRequest({ executionMode: 'INVALID' as ExecutionMode })),
    ).rejects.toBeInstanceOf(ResearchValidationError);
  });

  it('rejects a blank workspace id', async () => {
    const { service } = createService();

    await expect(service.createSession(createRequest({ workspaceId: ' ' }))).rejects.toThrow(
      /workspaceId is required/,
    );
  });

  it('rejects a blank generated session id', async () => {
    const { service } = createService({ createSessionId: () => '   ' });

    await expect(service.createSession(createRequest())).rejects.toThrow(/sessionId is required/);
  });
});

describe('US190 ResearchApplicationService startSession', () => {
  it('starts a session by delegating to PaperTradingRunner', async () => {
    const { service, strategy } = createService({
      clockTimes: [CREATED_AT, START_AT],
    });
    await service.createSession(createRequest());

    const response = await service.startSession(SESSION_ID);

    expect(response.status).toBe(SessionState.RUNNING);
    expect(response.runnerStatus).toBe(RunnerStatus.RUNNING);
    expect(response.startedAt).toBe(START_AT);
    expect(response.cycleNumber).toBe(0);
    expect(strategy.initializeCalls).toHaveLength(1);
    expect(service.domainEvents().at(-1)).toEqual({
      eventType: 'ResearchSessionStarted',
      sessionId: SESSION_ID,
      occurredAt: START_AT,
      startedAt: START_AT,
    });
  });

  it('rejects duplicate start without creating another runner', async () => {
    const { service, strategy } = createService({
      clockTimes: [CREATED_AT, START_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchSessionAlreadyRunningError,
    );
    expect(strategy.initializeCalls).toHaveLength(1);
  });

  it('rejects starting an unknown session', async () => {
    const { service } = createService();

    await expect(service.startSession('missing')).rejects.toBeInstanceOf(
      ResearchSessionNotFoundError,
    );
  });

  it('rejects starting a stopped session', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, STOP_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);
    await service.stopSession(SESSION_ID);

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchSessionStoppedError,
    );
  });

  it('rejects start when strategy resolution fails', async () => {
    const { service } = createService({
      resolveStrategy: () => {
        throw new Error('strategy missing from catalog');
      },
    });
    await service.createSession(createRequest());

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);
  });

  it('rejects start when strategy resolver returns null', async () => {
    const { service } = createService({
      resolveStrategy: () => null as unknown as PaperStrategy,
    });
    await service.createSession(createRequest());

    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/missing strategy/);
  });

  it('wraps active recovery as a validation error', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({
      repository,
      clockTimes: [CREATED_AT, START_AT],
    });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const recovering = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
        heartbeatTimeoutMs: 5_000,
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT)
      .beginRecovery(START_AT);
    await repository.save({
      ...record,
      tradingSession: recovering.toProperties(),
    });

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);
    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/active recovery/);
  });
});

describe('US190 ResearchApplicationService runCycle', () => {
  it('executes one research cycle through the runner', async () => {
    const { service, strategy } = createService({
      clockTimes: [CREATED_AT, START_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    const response = await service.runCycle(SESSION_ID);

    expect(response.cycleNumber).toBe(1);
    expect(response.runnerStatus).toBe(RunnerStatus.RUNNING);
    expect(strategy.executeCalls).toHaveLength(1);
  });

  it('rejects a cycle before start', async () => {
    const { service } = createService();
    await service.createSession(createRequest());

    await expect(service.runCycle(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);
  });

  it('rejects a cycle after stop', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, STOP_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);
    await service.stopSession(SESSION_ID);

    await expect(service.runCycle(SESSION_ID)).rejects.toBeInstanceOf(ResearchSessionStoppedError);
  });
});

describe('US190 ResearchApplicationService stopSession', () => {
  it('stops a running session and emits ResearchSessionStopped', async () => {
    const { service, strategy } = createService({
      clockTimes: [CREATED_AT, START_AT, STOP_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    const response = await service.stopSession(SESSION_ID);

    expect(response.status).toBe(SessionState.STOPPED);
    expect(response.runnerStatus).toBe(RunnerStatus.STOPPED);
    expect(response.stoppedAt).toBe(STOP_AT);
    expect(strategy.shutdownCalls).toHaveLength(1);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'ResearchSessionStopped',
      sessionId: SESSION_ID,
      stoppedAt: STOP_AT,
    });
  });

  it('is idempotent: repeated stop never changes the final state', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, STOP_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);
    const first = await service.stopSession(SESSION_ID);
    const eventsAfterStop = service.domainEvents().length;

    const second = await service.stopSession(SESSION_ID);

    expect(second).toEqual(first);
    expect(second.stoppedAt).toBe(STOP_AT);
    expect(service.domainEvents()).toHaveLength(eventsAfterStop);
  });

  it('rejects stopping a session that was never started', async () => {
    const { service } = createService();
    await service.createSession(createRequest());

    await expect(service.stopSession(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);
  });
});

describe('US190 ResearchApplicationService recoverSession', () => {
  it('recovers through the live runner when heartbeat expiry made recovery eligible', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, HEARTBEAT_EXPIRED_AT, CYCLE_2_AT],
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 5_000,
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    await expect(service.runCycle(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);

    const recovered = await service.recoverSession(SESSION_ID);
    expect(recovered.recoveryStatus).toBe(RecoveryStatus.RECOVERED);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'ResearchSessionRecovered',
      sessionId: SESSION_ID,
    });

    const again = await service.recoverSession(SESSION_ID);
    expect(again.recoveryStatus).toBe(RecoveryStatus.RECOVERED);
    expect(
      service.domainEvents().filter((event) => event.eventType === 'ResearchSessionRecovered'),
    ).toHaveLength(1);
  });

  it('recovers a repository-backed eligible session without a live runner', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({
      repository,
      clockTimes: [CREATED_AT, START_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const eligible = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
        heartbeatTimeoutMs: 1_000,
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT);
    await repository.save({
      ...record,
      tradingSession: eligible.toProperties(),
    });

    const response = await service.recoverSession(SESSION_ID);

    expect(response.recoveryStatus).toBe(RecoveryStatus.RECOVERED);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'ResearchSessionRecovered',
      sessionId: SESSION_ID,
    });

    const again = await service.recoverSession(SESSION_ID);
    expect(again.recoveryStatus).toBe(RecoveryStatus.RECOVERED);
    expect(
      service.domainEvents().filter((event) => event.eventType === 'ResearchSessionRecovered'),
    ).toHaveLength(1);
  });

  it('completes an in-flight recovery without a live runner', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({
      repository,
      clockTimes: [CREATED_AT, START_AT],
    });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const recovering = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
        heartbeatTimeoutMs: 1_000,
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT)
      .beginRecovery(START_AT);
    await repository.save({
      ...record,
      tradingSession: recovering.toProperties(),
    });

    const response = await service.recoverSession(SESSION_ID);
    expect(response.recoveryStatus).toBe(RecoveryStatus.RECOVERED);
  });

  it('is a no-op when recovery is not required on a healthy running session', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, CYCLE_AT, CYCLE_2_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    const first = await service.recoverSession(SESSION_ID);
    const second = await service.recoverSession(SESSION_ID);

    expect(first.recoveryStatus).toBe(RecoveryStatus.NOT_REQUIRED);
    expect(second.recoveryStatus).toBe(RecoveryStatus.NOT_REQUIRED);
    expect(
      service.domainEvents().filter((event) => event.eventType === 'ResearchSessionRecovered'),
    ).toHaveLength(0);
  });
});

describe('US190 ResearchApplicationService queries', () => {
  it('returns session status via getSession and listSessions', async () => {
    const { service } = createService({
      clockTimes: [CREATED_AT, START_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);
    await service.runCycle(SESSION_ID);

    const session = await service.getSession(SESSION_ID);
    expect(session.cycleNumber).toBe(1);
    expect(session.runnerStatus).toBe(RunnerStatus.RUNNING);

    const listed = await service.listSessions();
    expect(listed).toEqual([
      {
        sessionId: SESSION_ID,
        status: SessionState.RUNNING,
        executionMode: ExecutionMode.PAPER,
      },
    ]);
    expect(Object.isFrozen(listed)).toBe(true);
  });

  it('rejects blank session ids and unknown sessions', async () => {
    const { service } = createService();

    await expect(service.getSession('')).rejects.toThrow(/sessionId is required/);
    await expect(service.getSession('missing')).rejects.toBeInstanceOf(
      ResearchSessionNotFoundError,
    );
  });
});

describe('US190 ResearchApplicationService application errors', () => {
  it('exposes typed application error codes', () => {
    expect(new ResearchSessionNotFoundError('x').code).toBe('RESEARCH_SESSION_NOT_FOUND');
    expect(new ResearchSessionAlreadyExistsError('x').code).toBe('RESEARCH_SESSION_ALREADY_EXISTS');
    expect(new ResearchSessionAlreadyRunningError('x').code).toBe(
      'RESEARCH_SESSION_ALREADY_RUNNING',
    );
    expect(new ResearchSessionStoppedError('x').code).toBe('RESEARCH_SESSION_STOPPED');
    expect(new ResearchValidationError('bad').code).toBe('RESEARCH_VALIDATION');
    expect(new ResearchValidationError('bad', new Error('cause')).cause).toBeInstanceOf(Error);
  });
});

describe('US190 ResearchApplicationService edge cases', () => {
  it('uses default clock and id generators', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CREATED_AT));
    const repository = new InMemoryResearchSessionRepository();
    const service = ResearchApplicationService.create({
      repository,
      resolveStrategy: () => new RecordingStrategy(),
    });

    const created = await service.createSession(createRequest());
    expect(created.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect((await service.getSession(created.sessionId)).sessionId).toBe(created.sessionId);
  });

  it('wraps invalid execution mode from a non-PAPER stored session', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({ repository });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    await repository.save({
      ...record,
      executionMode: ExecutionMode.LIVE,
      tradingSession: {
        ...record.tradingSession,
        executionMode: ExecutionMode.LIVE,
      },
    });

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);
    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/invalid execution mode/);
  });

  it('wraps invalid lifecycle from a non-startable stored session', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({ repository });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const paused = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT)
      .pause(CREATED_AT)
      .transitionTo(SessionState.PAUSED, CREATED_AT);
    await repository.save({
      ...record,
      tradingSession: paused.toProperties(),
    });

    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/invalid lifecycle/);
  });

  it('treats a failed runner as stopped for cycle and stop', async () => {
    const strategy = new RecordingStrategy();
    strategy.onShutdown = () => {
      throw new Error('shutdown exploded');
    };
    const { service } = createService({
      strategy,
      clockTimes: [CREATED_AT, START_AT, STOP_AT, CYCLE_AT, CYCLE_2_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    await expect(service.stopSession(SESSION_ID)).rejects.toBeInstanceOf(ResearchValidationError);

    await expect(service.runCycle(SESSION_ID)).rejects.toBeInstanceOf(ResearchSessionStoppedError);
    await expect(service.stopSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchSessionStoppedError,
    );
    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchSessionStoppedError,
    );
  });

  it('handles reentrant stop while STOPPING without changing final state', async () => {
    const strategy = new RecordingStrategy();
    let reentrant: ResearchSessionResponse | Error | null = null;
    const { service } = createService({
      strategy,
      clockTimes: [CREATED_AT, START_AT, STOP_AT, CYCLE_AT],
    });
    await service.createSession(createRequest());
    await service.startSession(SESSION_ID);

    strategy.onShutdown = async () => {
      try {
        reentrant = await service.stopSession(SESSION_ID);
      } catch (error) {
        reentrant = error as Error;
      }
    };

    const stopped = await service.stopSession(SESSION_ID);
    expect(stopped.runnerStatus).toBe(RunnerStatus.STOPPED);
    // Reentrant stop during STOPPING maps through DuplicateRunnerStopError.
    expect(reentrant).toBeTruthy();
  });

  it('lists sessions from the repository when no runner is attached', async () => {
    const { service } = createService();
    await service.createSession(createRequest());

    const listed = await service.listSessions();
    expect(listed).toEqual([
      {
        sessionId: SESSION_ID,
        status: SessionState.CREATED,
        executionMode: ExecutionMode.PAPER,
      },
    ]);
  });

  it('rejects non-string strategy and workspace identifiers', async () => {
    const { service } = createService();

    await expect(
      service.createSession(createRequest({ strategyId: 42 as unknown as string })),
    ).rejects.toThrow(/missing strategy/);
    await expect(
      service.createSession(createRequest({ workspaceId: null as unknown as string })),
    ).rejects.toThrow(/workspaceId is required/);
  });

  it('rejects starting a terminal session that has no live runner', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({ repository });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const stopped = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT)
      .stop(CREATED_AT)
      .transitionTo(SessionState.STOPPED, CREATED_AT);
    await repository.save({
      ...record,
      tradingSession: stopped.toProperties(),
    });

    await expect(service.startSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchSessionStoppedError,
    );
  });

  it('rethrows ResearchValidationError from strategy resolution', async () => {
    const { service } = createService({
      resolveStrategy: () => {
        throw new ResearchValidationError('catalog rejected strategy');
      },
    });
    await service.createSession(createRequest());

    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/catalog rejected strategy/);
  });

  it('uses a fallback message when strategy resolution throws a blank error', async () => {
    const { service } = createService({
      resolveStrategy: () => {
        throw new Error('   ');
      },
    });
    await service.createSession(createRequest());

    await expect(service.startSession(SESSION_ID)).rejects.toThrow(/strategy resolution failed/);
  });

  it('wraps blank recovery failures with a fallback message', async () => {
    const repository = new InMemoryResearchSessionRepository();
    const { service } = createService({
      repository,
      clockTimes: [CREATED_AT, 'not-a-timestamp'],
    });
    await service.createSession(createRequest());

    const record = (await repository.findById(SESSION_ID)) as ResearchSessionRecord;
    const recovering = TradingSession.restore(record.tradingSession)
      .acquireLease(RUNTIME_ID, {
        acquiredAt: CREATED_AT,
        expiresAt: '2026-07-19T21:00:00.000Z',
        heartbeatTimeoutMs: 1_000,
      })
      .start(CREATED_AT)
      .transitionTo(SessionState.RUNNING, CREATED_AT)
      .beginRecovery(START_AT);
    await repository.save({
      ...record,
      tradingSession: recovering.toProperties(),
    });

    await expect(service.recoverSession(SESSION_ID)).rejects.toBeInstanceOf(
      ResearchValidationError,
    );
  });
});
