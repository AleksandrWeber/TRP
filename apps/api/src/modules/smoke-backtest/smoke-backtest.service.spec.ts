import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ResearchValidationError,
  type CreateResearchSessionRequest,
  type ResearchSessionResponse,
} from '../research-api';
import {
  ActiveRecoveryError,
  ExpiredRuntimeHeartbeatError,
  InactiveRuntimeLeaseError,
  InvalidExecutionModeError,
  RunnerStatus,
  type PaperExecutionContext,
  type PaperStrategy,
} from '../paper-trading-runner';
import { ExecutionMode, RecoveryStatus, SessionState } from '../trading-session/domain';
import {
  createEventEmissionFailingNotifier,
  EVENT_EMISSION_FAILURE_MESSAGE,
  SMOKE_COMPLETION_EVENT,
} from '../chaos-testing';
import {
  createExecutionMetrics,
  createExecutionResult,
  ExecutionStatus,
  isExecutionStatus,
  metricsFromResult,
  SmokeBacktestActiveRecoveryError,
  SmokeBacktestAlreadyCompletedError,
  SmokeBacktestDuplicateExecutionError,
  SmokeBacktestExecutionFailedError,
  SmokeBacktestExpiredHeartbeatError,
  SmokeBacktestExpiredLeaseError,
  SmokeBacktestRunnerStartupError,
  SmokeBacktestService,
  SmokeBacktestValidationError,
  StubMarketDataProvider,
  StubPaperStrategy,
  InMemorySmokeSessionRepository,
  type SmokeBacktestServiceDependencies,
  type SmokeResearchOrchestrator,
} from './index';

const SMOKE_START_AT = '2026-07-20T09:00:00.000Z';
const CREATE_AT = '2026-07-20T09:00:01.000Z';
const START_AT = '2026-07-20T09:00:02.000Z';
const CYCLE_1_AT = '2026-07-20T09:00:03.000Z';
const CYCLE_2_AT = '2026-07-20T09:00:04.000Z';
const CYCLE_3_AT = '2026-07-20T09:00:05.000Z';
const STOP_AT = '2026-07-20T09:00:06.000Z';
const COMPLETED_AT = '2026-07-20T09:00:07.000Z';
const HEARTBEAT_EXPIRED_AT = '2026-07-20T09:00:08.000Z';
const LEASE_EXPIRED_AT = '2026-07-20T09:01:30.000Z';
const FAILED_AT = '2026-07-20T09:01:31.000Z';
const SESSION_ID = 'smoke-session-191';
const RUNTIME_ID = 'smoke-runtime-191';

/** Default happy-path clock: smoke start → create → start → 3 cycles → stop → complete. */
const DEFAULT_CLOCK_TIMES = [
  SMOKE_START_AT,
  CREATE_AT,
  START_AT,
  CYCLE_1_AT,
  CYCLE_2_AT,
  CYCLE_3_AT,
  STOP_AT,
  COMPLETED_AT,
] as const;

function createClock(times: readonly string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function createService(
  overrides: Partial<SmokeBacktestServiceDependencies> & {
    clockTimes?: string[];
  } = {},
): {
  service: SmokeBacktestService;
  strategy: StubPaperStrategy;
  marketData: StubMarketDataProvider;
} {
  const { clockTimes, ...dependencyOverrides } = overrides;
  const marketData =
    (dependencyOverrides.marketDataProvider as StubMarketDataProvider | null | undefined) ??
    StubMarketDataProvider.create();
  const strategy =
    (dependencyOverrides.strategy as StubPaperStrategy | null | undefined) ??
    StubPaperStrategy.create({ marketDataProvider: marketData });
  const clock = dependencyOverrides.clock ?? createClock([...(clockTimes ?? DEFAULT_CLOCK_TIMES)]);

  const service = SmokeBacktestService.create({
    createSessionId: () => SESSION_ID,
    createRuntimeId: () => RUNTIME_ID,
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    strategy: dependencyOverrides.strategy === undefined ? strategy : dependencyOverrides.strategy,
    marketDataProvider:
      dependencyOverrides.marketDataProvider === undefined
        ? marketData
        : dependencyOverrides.marketDataProvider,
    clock,
  });

  return {
    service,
    strategy: strategy as StubPaperStrategy,
    marketData: marketData as StubMarketDataProvider,
  };
}

function response(overrides: Partial<ResearchSessionResponse> = {}): ResearchSessionResponse {
  return Object.freeze({
    sessionId: SESSION_ID,
    status: SessionState.RUNNING,
    runnerStatus: RunnerStatus.RUNNING,
    recoveryStatus: RecoveryStatus.NOT_REQUIRED,
    executionMode: ExecutionMode.PAPER,
    startedAt: START_AT,
    stoppedAt: null,
    cycleNumber: 0,
    ...overrides,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US191 ExecutionResult', () => {
  it('creates immutable results and metrics', () => {
    const result = createExecutionResult({
      sessionId: SESSION_ID,
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 3,
      startedAt: START_AT,
      completedAt: COMPLETED_AT,
      duration: 5_000,
      eventsPublished: 1,
      errors: [],
      datasetId: 'smoke-stub',
      candlesProcessed: 3,
      replayCompleted: true,
    });
    const metrics = metricsFromResult(result);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.errors)).toBe(true);
    expect(isExecutionStatus(ExecutionStatus.COMPLETED)).toBe(true);
    expect(isExecutionStatus('NOPE')).toBe(false);
    expect(result.datasetId).toBe('smoke-stub');
    expect(result.candlesProcessed).toBe(3);
    expect(result.replayCompleted).toBe(true);
    expect(metrics).toEqual({
      cyclesExecuted: 3,
      executionDuration: 5_000,
      eventsPublished: 1,
      errorCount: 0,
    });
    expect(createExecutionMetrics(metrics)).toEqual(metrics);
  });

  it('rejects invalid execution result fields', () => {
    const base = {
      sessionId: SESSION_ID,
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 0,
      startedAt: START_AT,
      completedAt: COMPLETED_AT,
      duration: 0,
      eventsPublished: 0,
      errors: [] as string[],
      datasetId: 'smoke-stub' as string | null,
      candlesProcessed: 0,
      replayCompleted: true,
    };
    expect(() => createExecutionResult({ ...base, sessionId: '' })).toThrow(
      /sessionId is required/,
    );
    expect(() =>
      createExecutionResult({
        ...base,
        sessionId: 42 as unknown as string,
      }),
    ).toThrow(/sessionId is required/);
    expect(() =>
      createExecutionResult({
        ...base,
        executionStatus: 'BROKEN' as ExecutionStatus,
      }),
    ).toThrow(/Invalid executionStatus/);
    expect(() => createExecutionResult({ ...base, cyclesExecuted: -1 })).toThrow(/cyclesExecuted/);
    expect(() => createExecutionResult({ ...base, startedAt: 'not-iso' })).toThrow(
      /startedAt must be an ISO-8601/,
    );
    expect(() => createExecutionResult({ ...base, datasetId: '   ' })).toThrow(
      /datasetId is required/,
    );
    expect(() => createExecutionResult({ ...base, candlesProcessed: -1 })).toThrow(
      /candlesProcessed/,
    );
  });
});

describe('US191 InMemorySmokeSessionRepository', () => {
  it('supports save, findById, findAll, and delete', async () => {
    const repository = new InMemorySmokeSessionRepository();
    const { service } = createService({ repository });
    await service.execute();

    const found = await repository.findById(SESSION_ID);
    expect(found?.sessionId).toBe(SESSION_ID);
    expect(await repository.findAll()).toHaveLength(1);

    await repository.delete(SESSION_ID);
    expect(await repository.findById(SESSION_ID)).toBeNull();
    expect(await repository.findAll()).toHaveLength(0);
  });
});

describe('US191 StubMarketDataProvider', () => {
  it('returns deterministic candles then end of stream', () => {
    const provider = StubMarketDataProvider.create();
    expect(provider.size()).toBe(3);
    expect(provider.current()).toBeNull();

    const first = provider.next();
    const second = provider.next();
    const third = provider.next();
    const done = provider.next();

    expect(first?.index).toBe(1);
    expect(second?.index).toBe(2);
    expect(third?.index).toBe(3);
    expect(done).toBeNull();
    expect(provider.current()).toBeNull();
    expect(provider.remaining()).toBe(0);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('resets the stream and rejects null candle lists', () => {
    const provider = StubMarketDataProvider.create(
      StubMarketDataProvider.defaultCandles().slice(0, 1),
    );
    expect(provider.next()?.index).toBe(1);
    expect(provider.next()).toBeNull();
    provider.reset();
    expect(provider.next()?.index).toBe(1);
    expect(provider.current()?.index).toBe(1);

    expect(() => StubMarketDataProvider.create(null as unknown as [])).toThrow(
      /candles are required/,
    );
  });
});

describe('US191 StubPaperStrategy', () => {
  it('records initialize → execute → shutdown without trading side effects', async () => {
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    const context = {
      sessionId: SESSION_ID,
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 1,
      runtimeId: RUNTIME_ID,
    } as PaperExecutionContext;

    strategy.initialize(context);
    await strategy.execute(context);
    await strategy.execute({ ...context, cycleNumber: 2 });
    strategy.shutdown(context);

    expect(strategy.invocations).toEqual(['initialize', 'execute', 'execute', 'shutdown']);
    expect(strategy.initializeCalls).toHaveLength(1);
    expect(strategy.executeCalls).toHaveLength(2);
    expect(strategy.shutdownCalls).toHaveLength(1);
    expect(strategy.consumedCandles.map((candle) => candle?.index)).toEqual([1, 2]);
    expect(marketData.remaining()).toBe(1);
  });

  it('rejects a null market data provider', () => {
    expect(() => StubPaperStrategy.create({ marketDataProvider: null })).toThrow(
      /marketDataProvider is required/,
    );
  });
});

describe('US191 SmokeBacktestService creation', () => {
  it('creates a service with stub strategy and market provider', () => {
    const { service, strategy, marketData } = createService();

    expect(service.paperStrategy()).toBe(strategy);
    expect(service.marketData()).toBe(marketData);
    expect(service.lastResult()).toBeNull();
    expect(service.metrics()).toBeNull();
    expect(service.domainEvents()).toEqual([]);
  });

  it('rejects null strategy and null market provider', () => {
    const marketData = StubMarketDataProvider.create();
    expect(() =>
      SmokeBacktestService.create({
        strategy: null,
        marketDataProvider: marketData,
      }),
    ).toThrow(SmokeBacktestValidationError);

    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: null,
      }),
    ).toThrow(/marketDataProvider is required/);
  });

  it('rejects invalid execution mode and invalid cycles', () => {
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });

    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: marketData,
        executionMode: ExecutionMode.LIVE,
      }),
    ).toThrow(/invalid execution mode/);

    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: marketData,
        executionMode: 'RESEARCH' as ExecutionMode,
      }),
    ).toThrow(/invalid execution mode/);

    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: marketData,
        cycles: 0,
      }),
    ).toThrow(/cycles must be a positive integer/);

    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: marketData,
        workspaceId: '   ',
      }),
    ).toThrow(/workspaceId is required/);

    expect(() =>
      SmokeBacktestService.create({
        strategy,
        marketDataProvider: marketData,
        strategyId: '',
      }),
    ).toThrow(/strategyId is required/);
  });
});

describe('US191 SmokeBacktestService successful execution', () => {
  it('runs create → start → 3 cycles → stop and returns ExecutionResult', async () => {
    const { service, strategy, marketData } = createService();

    const result = await service.execute();

    expect(result).toMatchObject({
      sessionId: SESSION_ID,
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 3,
      startedAt: START_AT,
      completedAt: COMPLETED_AT,
      eventsPublished: 1,
      errors: [],
      datasetId: 'smoke-stub',
      candlesProcessed: 3,
      replayCompleted: true,
    });
    expect(result.duration).toBe(Date.parse(COMPLETED_AT) - Date.parse(SMOKE_START_AT));
    expect(Object.isFrozen(result)).toBe(true);

    expect(strategy.invocations).toEqual([
      'initialize',
      'execute',
      'execute',
      'execute',
      'shutdown',
    ]);
    expect(strategy.consumedCandles.map((candle) => candle?.index)).toEqual([1, 2, 3]);
    expect(marketData.next()).toBeNull();

    expect(service.domainEvents()).toEqual([
      expect.objectContaining({
        eventType: 'SmokeBacktestStarted',
        cycles: 3,
        occurredAt: SMOKE_START_AT,
      }),
      expect.objectContaining({
        eventType: 'SmokeBacktestCompleted',
        sessionId: SESSION_ID,
        cyclesExecuted: 3,
        completedAt: COMPLETED_AT,
      }),
    ]);
    expect(service.metrics()).toEqual({
      cyclesExecuted: 3,
      executionDuration: result.duration,
      eventsPublished: 1,
      errorCount: 0,
    });
    expect(service.lastResult()).toBe(result);
  });

  it('supports a configurable cycle count', async () => {
    const { service, strategy } = createService({
      cycles: 1,
      clockTimes: [SMOKE_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const result = await service.execute();

    expect(result.cyclesExecuted).toBe(1);
    expect(strategy.executeCalls).toHaveLength(1);
    expect(service.domainEvents()[0]).toMatchObject({
      eventType: 'SmokeBacktestStarted',
      cycles: 1,
    });
  });

  it('uses the default clock when none is provided', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(SMOKE_START_AT));
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    const service = SmokeBacktestService.create({
      strategy,
      marketDataProvider: marketData,
      cycles: 1,
      createSessionId: () => SESSION_ID,
      createRuntimeId: () => RUNTIME_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
    });

    const result = await service.execute();
    expect(result.sessionId).toBe(SESSION_ID);
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
  });
});

describe('US191 SmokeBacktestService runner lifecycle', () => {
  it('starts and shuts down the runner through the research boundary', async () => {
    const { service, strategy } = createService();
    await service.execute();

    expect(strategy.initializeCalls).toHaveLength(1);
    expect(strategy.shutdownCalls).toHaveLength(1);
    expect(strategy.initializeCalls[0]?.sessionId).toBe(SESSION_ID);
  });

  it('maps runner startup failures to SmokeBacktestRunnerStartupError', async () => {
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    strategy.initialize = () => {
      throw new Error('initialize exploded');
    };
    const { service } = createService({ strategy, marketDataProvider: marketData });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestRunnerStartupError);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'SmokeBacktestFailed',
      reason: 'initialize exploded',
    });
    expect(service.metrics()?.errorCount).toBe(1);
  });
});

describe('US191 SmokeBacktestService validation failures', () => {
  it('rejects expired heartbeat during a cycle', async () => {
    const { service } = createService({
      // start at 09:00:02 with 5s heartbeat → cycle at 09:00:08 expires
      clockTimes: [SMOKE_START_AT, CREATE_AT, START_AT, HEARTBEAT_EXPIRED_AT, FAILED_AT],
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 5_000,
      cycles: 1,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestExpiredHeartbeatError);
    expect(service.domainEvents().at(-1)?.eventType).toBe('SmokeBacktestFailed');
  });

  it('rejects expired lease during a cycle', async () => {
    const { service } = createService({
      // start at 09:00:02 with 60s lease → cycle at 09:01:30 expires
      clockTimes: [SMOKE_START_AT, CREATE_AT, START_AT, LEASE_EXPIRED_AT, FAILED_AT],
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      cycles: 1,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestExpiredLeaseError);
  });

  it('rejects active recovery on runner startup', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError('active recovery', new ActiveRecoveryError());
      },
      runCycle: async () => response({ cycleNumber: 1 }),
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
        }),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestActiveRecoveryError);
  });

  it('maps invalid execution mode from the research layer', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError(
          'invalid execution mode: LIVE',
          new InvalidExecutionModeError(ExecutionMode.LIVE),
        );
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestValidationError);
  });
});

describe('US191 SmokeBacktestService idempotency', () => {
  it('returns the same final result on repeated execute()', async () => {
    const { service } = createService();
    const first = await service.execute();
    const eventsAfterFirst = service.domainEvents().length;

    const second = await service.execute();

    expect(second).toBe(first);
    expect(second).toEqual(first);
    expect(service.domainEvents()).toHaveLength(eventsAfterFirst);
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const { service } = createService({ rejectOnRepeat: true });
    await service.execute();

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestAlreadyCompletedError);
  });

  it('rejects concurrent execute to avoid duplicate runners', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const research: SmokeResearchOrchestrator = {
      createSession: async (_request: CreateResearchSessionRequest) => {
        await gate;
        return response({ status: SessionState.CREATED, runnerStatus: RunnerStatus.CREATED });
      },
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => response({ cycleNumber: 1 }),
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
          cycleNumber: 1,
        }),
      domainEvents: () => [],
    };

    const { service } = createService({
      researchService: research,
      cycles: 1,
      clockTimes: [SMOKE_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestDuplicateExecutionError);
    release();
    const result = await first;
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
  });
});

describe('US191 SmokeBacktestService failure mapping', () => {
  it('maps generic research validation and unknown failures', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => {
        throw new ResearchValidationError('workspace rejected');
      },
      startSession: async () => response(),
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestValidationError);
  });

  it('maps plain errors and non-error throws during execution', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new Error('cycle boom');
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: research,
      cycles: 1,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestExecutionFailedError);

    const research2: SmokeResearchOrchestrator = {
      createSession: async () => {
        throw 'string-failure';
      },
      startSession: async () => response(),
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    const service2 = SmokeBacktestService.create({
      strategy,
      marketDataProvider: marketData,
      researchService: research2,
      clock: createClock([SMOKE_START_AT, FAILED_AT]),
    });
    await expect(service2.execute()).rejects.toThrow(/string-failure/);
  });

  it('maps heartbeat and lease errors from message text when cause is absent', async () => {
    const heartbeatResearch: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new ResearchValidationError('runtime heartbeat has expired');
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: heartbeatResearch,
      cycles: 1,
    });
    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestExpiredHeartbeatError);

    const leaseResearch: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new ResearchValidationError(
          'runtime lease is missing, expired, or owned by another runtime',
        );
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    const leaseService = SmokeBacktestService.create({
      strategy,
      marketDataProvider: marketData,
      researchService: leaseResearch,
      cycles: 1,
      clock: createClock([SMOKE_START_AT, CREATE_AT, START_AT, LEASE_EXPIRED_AT, FAILED_AT]),
    });
    await expect(leaseService.execute()).rejects.toBeInstanceOf(SmokeBacktestExpiredLeaseError);
  });

  it('exposes typed application error codes', () => {
    expect(new SmokeBacktestValidationError('x').code).toBe('SMOKE_BACKTEST_VALIDATION');
    expect(new SmokeBacktestAlreadyCompletedError('x').code).toBe(
      'SMOKE_BACKTEST_ALREADY_COMPLETED',
    );
    expect(new SmokeBacktestDuplicateExecutionError().code).toBe(
      'SMOKE_BACKTEST_DUPLICATE_EXECUTION',
    );
    expect(new SmokeBacktestRunnerStartupError('x').code).toBe(
      'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
    );
    expect(new SmokeBacktestActiveRecoveryError().code).toBe('SMOKE_BACKTEST_ACTIVE_RECOVERY');
    expect(new SmokeBacktestExpiredLeaseError().code).toBe('SMOKE_BACKTEST_EXPIRED_LEASE');
    expect(new SmokeBacktestExpiredHeartbeatError().code).toBe('SMOKE_BACKTEST_EXPIRED_HEARTBEAT');
    expect(new SmokeBacktestExecutionFailedError('x').code).toBe('SMOKE_BACKTEST_EXECUTION_FAILED');
    expect(
      new SmokeBacktestExpiredHeartbeatError(new ExpiredRuntimeHeartbeatError()).cause,
    ).toBeInstanceOf(ExpiredRuntimeHeartbeatError);
    expect(
      new SmokeBacktestExpiredLeaseError(new InactiveRuntimeLeaseError()).cause,
    ).toBeInstanceOf(InactiveRuntimeLeaseError);
  });

  it('does not remount smoke errors when mapping', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new SmokeBacktestValidationError('already mapped');
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toThrow(/already mapped/);
  });

  it('falls back to smoke start time when runner startedAt is null', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () =>
        response({ status: SessionState.CREATED, runnerStatus: RunnerStatus.CREATED }),
      startSession: async () =>
        response({
          status: SessionState.RUNNING,
          startedAt: null,
        }),
      runCycle: async () => response({ cycleNumber: 1 }),
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
          cycleNumber: 1,
        }),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: research,
      cycles: 1,
      clockTimes: [SMOKE_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const result = await service.execute();
    expect(result.startedAt).toBe(SMOKE_START_AT);
  });

  it('maps blank startup failures with a fallback message', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new Error('');
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestRunnerStartupError);
  });

  it('maps InvalidExecutionModeError cause without relying on message text', async () => {
    const research: SmokeResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError(
          'mode rejected',
          new InvalidExecutionModeError(ExecutionMode.LIVE),
        );
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(SmokeBacktestValidationError);
  });
});

describe('US191 SmokeBacktestService custom strategy', () => {
  it('accepts any PaperStrategy that records invocations', async () => {
    const marketData = StubMarketDataProvider.create();
    const calls: string[] = [];
    const strategy: PaperStrategy = {
      initialize: () => {
        calls.push('initialize');
      },
      execute: () => {
        calls.push('execute');
        marketData.next();
      },
      shutdown: () => {
        calls.push('shutdown');
      },
    };
    const { service } = createService({
      strategy,
      marketDataProvider: marketData,
      cycles: 2,
      clockTimes: [
        SMOKE_START_AT,
        CREATE_AT,
        START_AT,
        CYCLE_1_AT,
        CYCLE_2_AT,
        STOP_AT,
        COMPLETED_AT,
      ],
    });

    await service.execute();
    expect(calls).toEqual(['initialize', 'execute', 'execute', 'shutdown']);
  });
});

describe('ADR-019 SmokeBacktestService EventEmissionFailure (Contract B)', () => {
  function createFailingService(): SmokeBacktestService {
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    return SmokeBacktestService.create({
      strategy,
      marketDataProvider: marketData,
      cycles: 1,
      createSessionId: () => SESSION_ID,
      createRuntimeId: () => RUNTIME_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      clock: createClock(DEFAULT_CLOCK_TIMES),
      applicationEventNotifier: createEventEmissionFailingNotifier([SMOKE_COMPLETION_EVENT]),
    });
  }

  it('preserves COMPLETED execution when the completion notifier throws', async () => {
    const service = createFailingService();

    const result = await service.execute();

    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
    expect(result.errors).toEqual([]);
    expect(service.eventEmissionDiagnostics()).toEqual([
      expect.objectContaining({
        eventType: SMOKE_COMPLETION_EVENT,
        message: EVENT_EMISSION_FAILURE_MESSAGE,
      }),
    ]);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'SmokeBacktestStarted',
    ]);
    expect(service.metrics()?.errorCount).toBe(0);
  });

  it('caches the completed result after notification failure', async () => {
    const service = createFailingService();

    const result = await service.execute();
    expect(await service.execute()).toBe(result);
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
  });

  it('produces identical execution results on repeated notification failure', async () => {
    const first = createFailingService();
    const second = createFailingService();

    const firstResult = await first.execute();
    const secondResult = await second.execute();

    expect(firstResult).toEqual(secondResult);
    expect(first.eventEmissionDiagnostics()).toEqual(second.eventEmissionDiagnostics());
  });
});
