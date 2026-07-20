import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHAOS_TESTING_EVENT_TYPES,
  CHAOS_TESTING_SUITE_ID,
  ChaosTestingAlreadyCompletedError,
  ChaosTestingDuplicateExecutionError,
  ChaosTestingScenarioFailedError,
  ChaosTestingService,
  FailingMarketDataProvider,
  FailingPaperStrategy,
  FailingSessionRepository,
  FailureInjector,
  INJECTED_FAILURE_TYPES,
  aggregateChaosTestingSuiteResult,
  createChaosScenario,
  createChaosTestResult,
  createChaosTestingConfiguration,
  createChaosTestingMetrics,
  createChaosTestingSuiteResult,
  createPredefinedChaosTestingConfiguration,
  createRecoveryScenarioContext,
  extractErrorCode,
  failureInjector,
  isChaosScenarioType,
  isInjectedFailureType,
  predefinedChaosScenarios,
  type ChaosTestingServiceDependencies,
} from './index';
import { SmokeBacktestValidationError } from '../smoke-backtest';
import { createPaperExecutionContext } from '../paper-trading-runner';
import { ExecutionMode } from '../trading-session/domain';

const SUITE_START = '2026-07-20T16:00:00.000Z';
const SCENARIO_TICK = '2026-07-20T16:00:01.000Z';
const SUITE_COMPLETED = '2026-07-20T16:30:00.000Z';

function createClock(times: string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function defaultClock(): () => string {
  return createClock([
    SUITE_START,
    ...Array.from({ length: 20_000 }, () => SCENARIO_TICK),
    SUITE_COMPLETED,
  ]);
}

function singleScenarioConfiguration(
  scenarioId: string,
  scenarioType:
    | 'Smoke'
    | 'HistoricalReplay'
    | 'WalkForward'
    | 'MultiYearResearch'
    | 'DeterministicReplayValidation',
  injectedFailure:
    | 'MarketDataProvider'
    | 'Strategy'
    | 'Repository'
    | 'SessionLeaseExpiration'
    | 'ValidationFailure'
    | 'EventEmissionFailure',
) {
  const predefined = predefinedChaosScenarios().find(
    (scenario) =>
      scenario.scenarioType === scenarioType && scenario.injectedFailure === injectedFailure,
  );
  if (predefined === undefined) {
    throw new Error(`missing predefined scenario for ${scenarioType}/${injectedFailure}`);
  }

  return createChaosTestingConfiguration({
    suiteId: CHAOS_TESTING_SUITE_ID,
    scenarios: [{ ...predefined, scenarioId }],
  });
}

function createService(
  overrides: Partial<ChaosTestingServiceDependencies> & {
    clockTimes?: string[];
    scenarioType?:
      | 'Smoke'
      | 'HistoricalReplay'
      | 'WalkForward'
      | 'MultiYearResearch'
      | 'DeterministicReplayValidation';
    injectedFailure?:
      | 'MarketDataProvider'
      | 'Strategy'
      | 'Repository'
      | 'SessionLeaseExpiration'
      | 'ValidationFailure'
      | 'EventEmissionFailure';
    usePredefinedSuite?: boolean;
  } = {},
): ChaosTestingService {
  const {
    clockTimes: _clockTimes,
    scenarioType,
    injectedFailure,
    usePredefinedSuite,
    ...dependencyOverrides
  } = overrides;

  const configuration =
    dependencyOverrides.configuration ??
    (usePredefinedSuite === true
      ? createPredefinedChaosTestingConfiguration()
      : singleScenarioConfiguration(
          `chaos-${scenarioType ?? 'Smoke'}-${injectedFailure ?? 'Strategy'}`.toLowerCase(),
          scenarioType ?? 'Smoke',
          injectedFailure ?? 'Strategy',
        ));

  return ChaosTestingService.create({
    clock: dependencyOverrides.clock ?? defaultClock(),
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    configuration:
      dependencyOverrides.configuration === undefined
        ? configuration
        : dependencyOverrides.configuration,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US199 InjectedFailureType', () => {
  it('identifies supported failure types', () => {
    for (const failureType of INJECTED_FAILURE_TYPES) {
      expect(isInjectedFailureType(failureType)).toBe(true);
    }
    expect(isInjectedFailureType('Random')).toBe(false);
  });
});

describe('US199 ChaosScenarioType', () => {
  it('identifies supported scenario types', () => {
    expect(isChaosScenarioType('Smoke')).toBe(true);
    expect(isChaosScenarioType('DeterministicReplayValidation')).toBe(true);
    expect(isChaosScenarioType('Unknown')).toBe(false);
  });
});

describe('US199 ChaosScenario', () => {
  it('creates immutable chaos scenarios', () => {
    const scenario = createChaosScenario({
      scenarioId: 'chaos-smoke-strategy',
      scenarioType: 'Smoke',
      injectedFailure: 'Strategy',
      expectedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
      expectedFailedEventType: 'SmokeBacktestFailed',
    });

    expect(Object.isFrozen(scenario)).toBe(true);
    expect(scenario.scenarioId).toBe('chaos-smoke-strategy');
  });

  it('rejects invalid scenario and failure types', () => {
    expect(() =>
      createChaosScenario({
        scenarioId: 'bad',
        scenarioType: 'Unknown' as never,
        injectedFailure: 'Strategy',
        expectedFailure: 'X',
        expectedFailedEventType: 'SmokeBacktestFailed',
      }),
    ).toThrow('unsupported scenario');
  });
});

describe('US199 ChaosTestResult', () => {
  it('creates immutable chaos test results', () => {
    const result = createChaosTestResult({
      scenarioId: 'chaos-smoke-strategy',
      injectedFailure: 'Strategy',
      expectedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
      observedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
      recoverySucceeded: true,
      eventsVerified: true,
      cleanupVerified: true,
      success: true,
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(result.success).toBe(true);
  });
});

describe('US199 FailureInjector helpers', () => {
  it('extracts typed error codes', () => {
    expect(extractErrorCode(new SmokeBacktestValidationError('x'))).toBe(
      'SMOKE_BACKTEST_VALIDATION',
    );
    expect(extractErrorCode(new Error('plain'))).toBeNull();
  });
});

describe('US199 test doubles', () => {
  it('injects market data failures deterministically', () => {
    const delegate = {
      next: () => Object.freeze({ index: 1 }),
      current: () => null,
      reset: () => undefined,
    };
    const provider = FailingMarketDataProvider.create({ delegate, failAfterCalls: 0 });

    expect(() => provider.next()).toThrow(/market data provider failure/);
    expect(provider.failureInjected).toEqual([true]);
  });

  it('injects strategy failures deterministically', () => {
    const delegate = {
      initialize: () => undefined,
      execute: () => undefined,
      shutdown: () => undefined,
    };
    const strategy = FailingPaperStrategy.create({
      delegate,
      failOn: 'initialize',
    });

    expect(() =>
      strategy.initialize(
        createPaperExecutionContext({
          sessionId: 's',
          executionMode: ExecutionMode.PAPER,
          startedAt: SUITE_START,
          cycleNumber: 0,
          runtimeId: 'runtime-s',
        }),
      ),
    ).toThrow(/strategy failure/);
  });

  it('injects repository failures deterministically', async () => {
    const delegate = {
      save: async () => undefined,
      findById: async () => null,
      findAll: async () => Object.freeze([]),
      delete: async () => undefined,
    };
    const repository = FailingSessionRepository.create({ delegate, failOn: 'save' });

    await expect(
      repository.save({
        sessionId: 's',
        workspaceId: 'workspace',
        strategyId: 'strategy',
        executionMode: ExecutionMode.PAPER,
        metadata: null,
        tradingSession: {} as never,
      }),
    ).rejects.toThrow(/repository failure/);
  });
});

describe('US199 ChaosTestingService validation', () => {
  it('requires configuration', () => {
    expect(() => ChaosTestingService.create({ configuration: null })).toThrow(
      /configuration is required/,
    );
  });

  it('requires workspace and strategy identifiers', () => {
    expect(() =>
      ChaosTestingService.create({
        configuration: createPredefinedChaosTestingConfiguration(),
        workspaceId: ' ',
      }),
    ).toThrow(/workspaceId is required/);
  });

  it('rejects duplicate scenario identifiers', () => {
    const scenario = predefinedChaosScenarios()[0] as NonNullable<
      ReturnType<typeof predefinedChaosScenarios>[number]
    >;
    expect(() =>
      createChaosTestingConfiguration({
        suiteId: CHAOS_TESTING_SUITE_ID,
        scenarios: [scenario, scenario],
      }),
    ).toThrow(/duplicate scenario identifier/);
  });
});

describe('US199 ChaosTestingService smoke scenarios', () => {
  it('validates market data provider failure propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'MarketDataProvider',
    });
    const result = await service.execute();

    expect(result.scenariosPassed).toBe(1);
    expect(result.scenarioResults[0]).toMatchObject({
      injectedFailure: 'MarketDataProvider',
      expectedFailure: 'SMOKE_BACKTEST_VALIDATION',
      observedFailure: 'SMOKE_BACKTEST_VALIDATION',
      recoverySucceeded: true,
      eventsVerified: true,
      cleanupVerified: true,
      success: true,
    });
  });

  it('validates strategy failure propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'Strategy',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
    expect(result.scenarioResults[0]?.expectedFailure).toBe('SMOKE_BACKTEST_RUNNER_STARTUP_FAILED');
  });

  it('validates repository failure propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'Repository',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
    expect(result.scenarioResults[0]?.observedFailure).toBe('SMOKE_BACKTEST_EXECUTION_FAILED');
  });

  it('validates lease expiration propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'SessionLeaseExpiration',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
    expect(result.scenarioResults[0]?.observedFailure).toBe('SMOKE_BACKTEST_EXPIRED_LEASE');
  });

  it('validates validation failure propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'ValidationFailure',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
  });

  it('validates event emission failure propagation and recovery', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'EventEmissionFailure',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
  });
});

describe('US199 ChaosTestingService orchestrated scenarios', () => {
  it('validates historical replay strategy failure', async () => {
    const service = createService({
      scenarioType: 'HistoricalReplay',
      injectedFailure: 'Strategy',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
  });

  it('validates walk forward repository failure', async () => {
    const service = createService({
      scenarioType: 'WalkForward',
      injectedFailure: 'Repository',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
    expect(result.scenarioResults[0]?.observedFailure).toBe('WALK_FORWARD_REPLAY_FAILED');
  });

  it('validates multi-year repository failure', async () => {
    const service = createService({
      scenarioType: 'MultiYearResearch',
      injectedFailure: 'Repository',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
    expect(result.scenarioResults[0]?.observedFailure).toBe('MULTI_YEAR_RESEARCH_DATASET_FAILED');
  });

  it('validates deterministic replay validation failure', async () => {
    const service = createService({
      scenarioType: 'DeterministicReplayValidation',
      injectedFailure: 'ValidationFailure',
    });
    const result = await service.execute();

    expect(result.scenarioResults[0]?.success).toBe(true);
  });
});

describe('US199 ChaosTestingService suite execution', () => {
  it('executes the predefined chaos suite successfully', async () => {
    const service = createService({ usePredefinedSuite: true });
    const result = await service.execute();

    expect(result.suiteId).toBe(CHAOS_TESTING_SUITE_ID);
    expect(result.scenariosExecuted).toBe(predefinedChaosScenarios().length);
    expect(result.scenariosPassed).toBe(predefinedChaosScenarios().length);
    expect(result.scenariosFailed).toBe(0);
    expect(service.metrics()?.scenariosPassed).toBe(result.scenariosPassed);
  });

  it('emits chaos testing lifecycle events', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'Strategy',
    });
    await service.execute();

    const eventTypes = service.domainEvents().map((event) => event.eventType);
    expect(eventTypes).toEqual([
      'ChaosTestingStarted',
      'ChaosScenarioStarted',
      'FailureInjected',
      'RecoveryVerified',
      'ChaosScenarioCompleted',
      'ChaosTestingCompleted',
    ]);
    expect(CHAOS_TESTING_EVENT_TYPES).toContain('FailureInjected');
  });

  it('returns cached result on repeated execute()', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'Strategy',
    });
    const first = await service.execute();
    const eventsAfterFirst = service.domainEvents().length;
    const second = await service.execute();

    expect(second).toBe(first);
    expect(service.domainEvents()).toHaveLength(eventsAfterFirst);
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const service = createService({
      scenarioType: 'Smoke',
      injectedFailure: 'Strategy',
      rejectOnRepeat: true,
    });
    await service.execute();

    await expect(service.execute()).rejects.toBeInstanceOf(ChaosTestingAlreadyCompletedError);
  });

  it('rejects concurrent execute()', async () => {
    const service = createService({ usePredefinedSuite: true });
    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(ChaosTestingDuplicateExecutionError);
    await first;
  });

  it('stops early when failFast is enabled and a scenario fails', async () => {
    const scenario = predefinedChaosScenarios()[0] as NonNullable<
      ReturnType<typeof predefinedChaosScenarios>[number]
    >;
    const service = ChaosTestingService.create({
      clock: defaultClock(),
      configuration: createChaosTestingConfiguration({
        suiteId: CHAOS_TESTING_SUITE_ID,
        scenarios: [scenario],
        failFast: true,
      }),
      failureInjector: {
        inject: () => {
          throw new Error('injector exploded');
        },
        createService: failureInjector.createService.bind(failureInjector),
      } as unknown as FailureInjector,
    });

    const result = await service.execute();
    expect(result.scenariosExecuted).toBe(1);
    expect(result.scenariosFailed).toBe(1);
  });

  it('rejects when rejectOnScenarioFailure is enabled', async () => {
    const scenario = predefinedChaosScenarios()[0] as NonNullable<
      ReturnType<typeof predefinedChaosScenarios>[number]
    >;
    const service = ChaosTestingService.create({
      clock: defaultClock(),
      configuration: createChaosTestingConfiguration({
        suiteId: CHAOS_TESTING_SUITE_ID,
        scenarios: [scenario],
        rejectOnScenarioFailure: true,
      }),
      failureInjector: {
        inject: () => ({ serviceOverrides: Object.freeze({}) }),
        createService: failureInjector.createService.bind(failureInjector),
      } as unknown as FailureInjector,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(ChaosTestingScenarioFailedError);
  });
});

describe('US199 ChaosTestingService factories', () => {
  it('aggregates suite results deterministically', () => {
    const scenarioResult = createChaosTestResult({
      scenarioId: 'chaos-smoke-strategy',
      injectedFailure: 'Strategy',
      expectedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
      observedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
      recoverySucceeded: true,
      eventsVerified: true,
      cleanupVerified: true,
      success: true,
    });

    const suiteResult = aggregateChaosTestingSuiteResult(
      CHAOS_TESTING_SUITE_ID,
      [scenarioResult],
      SUITE_START,
      SUITE_COMPLETED,
    );

    expect(suiteResult.duration).toBe(Date.parse(SUITE_COMPLETED) - Date.parse(SUITE_START));
    expect(createChaosTestingSuiteResult(suiteResult)).toEqual(suiteResult);
  });

  it('creates recovery scenario context with deterministic clock', () => {
    const context = createRecoveryScenarioContext();
    expect(context.clock()).toMatch(/2026-07-20T15:/);
    expect(
      createChaosTestingMetrics({
        scenariosExecuted: 1,
        scenariosPassed: 1,
        scenariosFailed: 0,
        executionDuration: 10,
      }).executionDuration,
    ).toBe(10);
  });
});
