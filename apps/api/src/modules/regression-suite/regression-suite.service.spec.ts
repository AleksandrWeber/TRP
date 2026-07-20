import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DeterministicReplayValidationService,
  DeterministicReplayValidationValidationError,
} from '../deterministic-replay-validation';
import { HistoricalReplayService, HistoricalReplayValidationError } from '../historical-replay';
import { MultiYearResearchService, MultiYearResearchValidationError } from '../multi-year-research';
import { ExecutionStatus } from '../smoke-backtest';
import { SmokeBacktestService, SmokeBacktestValidationError } from '../smoke-backtest';
import {
  WalkForwardValidationError,
  WalkForwardValidationService,
} from '../walk-forward-validation';
import {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  ExecutionBaselineComparator,
  REGRESSION_SUITE_EVENT_TYPES,
  REGRESSION_SUITE_ID,
  RegressionSuiteAlreadyCompletedError,
  RegressionSuiteDuplicateExecutionError,
  RegressionSuiteExecutionFailedError,
  RegressionSuiteRegressionDetectedError,
  RegressionSuiteService,
  RegressionSuiteValidationError,
  aggregateRegressionSuiteResult,
  captureRegressionBaseline,
  createPredefinedRegressionSuiteConfiguration,
  createRegressionMismatch,
  createRegressionScenario,
  createRegressionScenarioResult,
  createRegressionSuiteConfiguration,
  createRegressionSuiteMetrics,
  createRegressionSuiteResult,
  executionBaselineComparator,
  executionOrder,
  isRegressionScenarioType,
  predefinedRegressionScenarioEntries,
  predefinedRegressionScenarios,
  stableApplicationEvent,
  stableApplicationEvents,
  type RegressionStableEvent,
  type RegressionSuiteServiceDependencies,
} from './index';

const SUITE_START = '2026-07-20T14:00:00.000Z';
const SCENARIO_TICK = '2026-07-20T14:00:01.000Z';
const SUITE_COMPLETED = '2026-07-20T14:30:00.000Z';

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
    ...Array.from({ length: 10_000 }, () => SCENARIO_TICK),
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
) {
  const predefined = predefinedRegressionScenarios().find(
    (scenario) => scenario.scenarioType === scenarioType,
  );
  if (predefined === undefined) {
    throw new Error(`missing predefined scenario for ${scenarioType}`);
  }

  return createRegressionSuiteConfiguration({
    suiteId: REGRESSION_SUITE_ID,
    scenarios: [{ ...predefined, scenarioId }],
  });
}

function createService(
  overrides: Partial<RegressionSuiteServiceDependencies> & {
    clockTimes?: string[];
    scenarioType?:
      | 'Smoke'
      | 'HistoricalReplay'
      | 'WalkForward'
      | 'MultiYearResearch'
      | 'DeterministicReplayValidation';
    usePredefinedSuite?: boolean;
  } = {},
): RegressionSuiteService {
  const {
    clockTimes: _clockTimes,
    scenarioType,
    usePredefinedSuite,
    ...dependencyOverrides
  } = overrides;

  const configuration =
    dependencyOverrides.configuration ??
    (usePredefinedSuite === true
      ? createPredefinedRegressionSuiteConfiguration()
      : singleScenarioConfiguration(
          `regression-${scenarioType ?? 'Smoke'}`.toLowerCase(),
          scenarioType ?? 'Smoke',
        ));

  return RegressionSuiteService.create({
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

describe('US198 RegressionScenarioType', () => {
  it('identifies supported scenario types', () => {
    expect(isRegressionScenarioType('Smoke')).toBe(true);
    expect(isRegressionScenarioType('HistoricalReplay')).toBe(true);
    expect(isRegressionScenarioType('WalkForward')).toBe(true);
    expect(isRegressionScenarioType('MultiYearResearch')).toBe(true);
    expect(isRegressionScenarioType('DeterministicReplayValidation')).toBe(true);
    expect(isRegressionScenarioType('Unknown')).toBe(false);
    expect(isRegressionScenarioType(42)).toBe(false);
  });
});

describe('US198 RegressionScenario', () => {
  it('creates immutable regression scenarios', () => {
    const scenario = createRegressionScenario({
      scenarioId: 'regression-smoke',
      scenarioType: 'Smoke',
      expectedResult: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      expectedEvents: Object.freeze([
        Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
      ]),
      expectedMetrics: Object.freeze({
        cyclesExecuted: 3,
        candlesProcessed: 3,
      }),
    });

    expect(Object.isFrozen(scenario)).toBe(true);
    expect(scenario.scenarioId).toBe('regression-smoke');
  });

  it('rejects invalid expected results and events', () => {
    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: 'INVALID' as ExecutionStatus,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: Object.freeze([]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('invalid expected executionStatus');

    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: null as unknown as [],
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('expectedEvents are required');

    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad',
        scenarioType: 'Invalid' as 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: Object.freeze([Object.freeze({ eventType: 'SmokeBacktestStarted' })]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('unsupported scenario');
  });
});

describe('US198 RegressionSuiteConfiguration', () => {
  it('creates predefined regression suite configuration', () => {
    const configuration = createPredefinedRegressionSuiteConfiguration();
    expect(configuration.suiteId).toBe(REGRESSION_SUITE_ID);
    expect(predefinedRegressionScenarioEntries()).toHaveLength(5);
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(Object.isFrozen(configuration.scenarios)).toBe(true);
  });

  it('rejects empty suites, duplicate identifiers, and unsupported scenarios', () => {
    expect(() =>
      createRegressionSuiteConfiguration({
        suiteId: REGRESSION_SUITE_ID,
        scenarios: [],
      }),
    ).toThrow('regression suite must not be empty');

    expect(() =>
      createRegressionSuiteConfiguration({
        suiteId: REGRESSION_SUITE_ID,
        scenarios: [
          createRegressionScenario({
            scenarioId: 'dup',
            scenarioType: 'Smoke',
            expectedResult: Object.freeze({
              executionStatus: ExecutionStatus.COMPLETED,
              cyclesExecuted: 3,
              candlesProcessed: 3,
              replayCompleted: true,
              datasetId: 'smoke-stub',
            }),
            expectedEvents: Object.freeze([
              Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
            ]),
            expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
          }),
          createRegressionScenario({
            scenarioId: 'dup',
            scenarioType: 'Smoke',
            expectedResult: Object.freeze({
              executionStatus: ExecutionStatus.COMPLETED,
              cyclesExecuted: 3,
              candlesProcessed: 3,
              replayCompleted: true,
              datasetId: 'smoke-stub',
            }),
            expectedEvents: Object.freeze([
              Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
            ]),
            expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
          }),
        ],
      }),
    ).toThrow('duplicate scenario identifier: dup');
  });

  it('rejects missing scenarios and blank suite identifiers', () => {
    expect(() =>
      createRegressionSuiteConfiguration({
        suiteId: REGRESSION_SUITE_ID,
        scenarios: null as unknown as [],
      }),
    ).toThrow('scenarios are required');

    expect(() =>
      createRegressionSuiteConfiguration({
        suiteId: '   ',
        scenarios: predefinedRegressionScenarios().slice(0, 1),
      }),
    ).toThrow('suiteId is required');
  });
});

describe('US198 ExecutionBaselineComparator', () => {
  it('compares execution result, events, metrics, and execution order', () => {
    const expected = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([
        Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
        Object.freeze({ eventType: 'SmokeBacktestCompleted', cyclesExecuted: 3 }),
      ]),
      metrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
    });

    const actual = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([
        Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
        Object.freeze({ eventType: 'SmokeBacktestCompleted', cyclesExecuted: 3 }),
      ]),
      metrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
    });

    expect(
      executionBaselineComparator.compare({
        scenarioId: 'regression-smoke',
        expected,
        actual,
      }),
    ).toHaveLength(0);
  });

  it('detects mismatches across result, order, events, and metrics', () => {
    const expected = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([
        Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
        Object.freeze({ eventType: 'SmokeBacktestCompleted', cyclesExecuted: 3 }),
      ]),
      metrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
    });

    const actual = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.FAILED,
        cyclesExecuted: 2,
        candlesProcessed: 2,
        replayCompleted: false,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([
        Object.freeze({ eventType: 'SmokeBacktestCompleted', cyclesExecuted: 2 }),
        Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 2 }),
      ]),
      metrics: Object.freeze({ cyclesExecuted: 2, candlesProcessed: 2 }),
    });

    const mismatches = executionBaselineComparator.compare({
      scenarioId: 'regression-smoke',
      expected,
      actual,
    });

    expect(mismatches.length).toBeGreaterThan(0);
    expect(mismatches.some((mismatch) => mismatch.field === 'executionOrder')).toBe(true);
    expect(mismatches.some((mismatch) => mismatch.field === 'metrics.cyclesExecuted')).toBe(true);
  });

  it('stabilizes application events and derives execution order', () => {
    const stable = stableApplicationEvent({
      eventType: 'SmokeBacktestCompleted',
      sessionId: 'session-1',
      occurredAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      cyclesExecuted: 3,
    });

    expect(stable).toEqual({
      eventType: 'SmokeBacktestCompleted',
      cyclesExecuted: 3,
    });
    expect(
      executionOrder(
        stableApplicationEvents([
          { eventType: 'A', sessionId: 's', occurredAt: SUITE_START },
          { eventType: 'B', sessionId: 's', occurredAt: SUITE_START },
        ]),
      ),
    ).toEqual(['A', 'B']);
  });

  it('supports custom comparator instances', () => {
    const comparator = new ExecutionBaselineComparator();
    expect(comparator).toBeInstanceOf(ExecutionBaselineComparator);
  });
});

describe('US198 RegressionMismatch', () => {
  it('creates immutable regression mismatches', () => {
    const mismatch = createRegressionMismatch({
      scenarioId: 'regression-smoke',
      field: 'cyclesExecuted',
      expected: 3,
      actual: 2,
    });

    expect(Object.isFrozen(mismatch)).toBe(true);
    expect(() =>
      createRegressionMismatch({
        scenarioId: '',
        field: 'cyclesExecuted',
        expected: 3,
        actual: 2,
      }),
    ).toThrow('scenarioId is required');
  });
});

describe('US198 RegressionSuiteResult', () => {
  it('aggregates scenario results and validates suite results', () => {
    const passed = createRegressionScenarioResult({
      scenarioId: 'one',
      scenarioType: 'Smoke',
      passed: true,
      regressionDetected: false,
      mismatches: Object.freeze([]),
      startedAt: SUITE_START,
      completedAt: SCENARIO_TICK,
      duration: 1_000,
    });
    const failed = createRegressionScenarioResult({
      scenarioId: 'two',
      scenarioType: 'HistoricalReplay',
      passed: false,
      regressionDetected: true,
      mismatches: Object.freeze([
        createRegressionMismatch({
          scenarioId: 'two',
          field: 'cyclesExecuted',
          expected: 6,
          actual: 5,
        }),
      ]),
      startedAt: SCENARIO_TICK,
      completedAt: SUITE_COMPLETED,
      duration: 2_000,
    });

    const aggregated = aggregateRegressionSuiteResult(
      REGRESSION_SUITE_ID,
      [passed, failed],
      SUITE_START,
      SUITE_COMPLETED,
    );

    expect(aggregated).toMatchObject({
      suiteId: REGRESSION_SUITE_ID,
      scenariosExecuted: 2,
      scenariosPassed: 1,
      scenariosFailed: 1,
      regressionsDetected: 1,
    });
    expect(Object.isFrozen(aggregated)).toBe(true);

    expect(() =>
      createRegressionSuiteResult({
        suiteId: '',
        scenariosExecuted: 0,
        scenariosPassed: 0,
        scenariosFailed: 0,
        regressionsDetected: 0,
        scenarioResults: [],
        startedAt: SUITE_START,
        completedAt: SUITE_COMPLETED,
        duration: 0,
      }),
    ).toThrow('suiteId is required');
  });
});

describe('US198 RegressionSuiteMetrics', () => {
  it('creates immutable regression suite metrics', () => {
    const metrics = createRegressionSuiteMetrics({
      scenariosExecuted: 5,
      scenariosPassed: 4,
      scenariosFailed: 1,
      regressionsDetected: 1,
      executionDuration: 1_800_000,
    });

    expect(Object.isFrozen(metrics)).toBe(true);
    expect(() =>
      createRegressionSuiteMetrics({
        scenariosExecuted: -1,
        scenariosPassed: 0,
        scenariosFailed: 0,
        regressionsDetected: 0,
        executionDuration: 0,
      }),
    ).toThrow('scenariosExecuted must be a non-negative integer');
  });
});

describe('US198 predefined regression baselines', () => {
  it('matches captured baselines for all predefined scenarios', async () => {
    const clock = defaultClock();
    const context = Object.freeze({ clock });

    for (const scenario of predefinedRegressionScenarios()) {
      const actual = await captureRegressionBaseline(scenario.scenarioType, context, undefined);
      const expected = Object.freeze({
        result: scenario.expectedResult,
        events: scenario.expectedEvents,
        metrics: scenario.expectedMetrics,
      });
      const mismatches = executionBaselineComparator.compare({
        scenarioId: scenario.scenarioId,
        expected,
        actual,
      });

      expect(mismatches, scenario.scenarioId).toEqual([]);
    }
  });
});

describe('US198 RegressionSuiteService creation', () => {
  it('requires configuration, workspaceId, and strategyId', () => {
    expect(() => RegressionSuiteService.create({ configuration: null })).toThrow(
      RegressionSuiteValidationError,
    );

    expect(() =>
      RegressionSuiteService.create({
        configuration: createPredefinedRegressionSuiteConfiguration(),
        workspaceId: '   ',
      }),
    ).toThrow('workspaceId is required');

    expect(() =>
      RegressionSuiteService.create({
        configuration: createPredefinedRegressionSuiteConfiguration(),
        strategyId: '',
      }),
    ).toThrow('strategyId is required');
  });
});

describe('US198 RegressionSuiteService smoke scenario', () => {
  it('executes smoke regression and verifies baseline', async () => {
    const service = createService({ scenarioType: 'Smoke' });
    const suite = await service.execute();

    expect(suite.scenarioResults).toHaveLength(1);
    expect(suite.scenarioResults[0]).toMatchObject({
      scenarioId: 'regression-smoke',
      scenarioType: 'Smoke',
      passed: true,
      regressionDetected: false,
    });
    expect(suite.scenariosPassed).toBe(1);
    expect(suite.regressionsDetected).toBe(0);

    const events = service.domainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'RegressionSuiteStarted',
      'ScenarioPassed',
      'RegressionSuiteCompleted',
    ]);
    expect(service.metrics()?.scenariosPassed).toBe(1);
  });
});

describe('US198 RegressionSuiteService historical replay scenario', () => {
  it('executes historical replay regression', async () => {
    const service = createService({ scenarioType: 'HistoricalReplay' });
    const suite = await service.execute();

    expect(suite.scenarioResults[0]).toMatchObject({
      scenarioType: 'HistoricalReplay',
      passed: true,
    });
  });
});

describe('US198 RegressionSuiteService walk forward scenario', () => {
  it('executes walk forward regression', async () => {
    const service = createService({ scenarioType: 'WalkForward' });
    const suite = await service.execute();

    expect(suite.scenarioResults[0]?.passed).toBe(true);
  });
});

describe('US198 RegressionSuiteService multi-year scenario', () => {
  it('executes multi-year research regression', async () => {
    const service = createService({ scenarioType: 'MultiYearResearch' });
    const suite = await service.execute();

    expect(suite.scenarioResults[0]?.passed).toBe(true);
  });
});

describe('US198 RegressionSuiteService deterministic replay scenario', () => {
  it('executes deterministic replay validation regression', async () => {
    const service = createService({ scenarioType: 'DeterministicReplayValidation' });
    const suite = await service.execute();

    expect(suite.scenarioResults[0]).toMatchObject({
      scenarioType: 'DeterministicReplayValidation',
      passed: true,
      regressionDetected: false,
    });
  });
});

describe('US198 RegressionSuiteService predefined suite', () => {
  it('executes all predefined regression scenarios', async () => {
    const service = createService({ usePredefinedSuite: true });
    const suite = await service.execute();

    expect(suite.scenarioResults).toHaveLength(5);
    expect(suite.scenarioResults.every((result) => result.passed)).toBe(true);
    expect(suite.regressionsDetected).toBe(0);
    expect(suite.duration).toBeGreaterThan(0);

    const events = service.domainEvents();
    expect(events.filter((event) => event.eventType === 'ScenarioPassed')).toHaveLength(5);
    expect(events.at(-1)?.eventType).toBe('RegressionSuiteCompleted');
  });
});

describe('US198 RegressionSuiteService regression detection', () => {
  it('detects behavioral regressions against baselines', async () => {
    const configuration = createRegressionSuiteConfiguration({
      suiteId: REGRESSION_SUITE_ID,
      scenarios: [
        createRegressionScenario({
          scenarioId: 'regression-smoke',
          scenarioType: 'Smoke',
          expectedResult: Object.freeze({
            executionStatus: ExecutionStatus.COMPLETED,
            cyclesExecuted: 99,
            candlesProcessed: 99,
            replayCompleted: true,
            datasetId: 'smoke-stub',
          }),
          expectedEvents: Object.freeze([
            Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
            Object.freeze({ eventType: 'SmokeBacktestCompleted', cyclesExecuted: 3 }),
          ]),
          expectedMetrics: Object.freeze({
            cyclesExecuted: 99,
            candlesProcessed: 99,
          }),
        }),
      ],
    });

    const service = RegressionSuiteService.create({
      configuration,
      clock: defaultClock(),
    });
    const suite = await service.execute();

    expect(suite.scenariosFailed).toBe(1);
    expect(suite.regressionsDetected).toBe(1);
    expect(suite.scenarioResults[0]?.mismatches.length).toBeGreaterThan(0);

    const events = service.domainEvents();
    expect(events.some((event) => event.eventType === 'RegressionDetected')).toBe(true);
    expect(events.some((event) => event.eventType === 'ScenarioFailed')).toBe(true);
  });

  it('rejects when rejectOnRegression is enabled', async () => {
    const configuration = createRegressionSuiteConfiguration({
      suiteId: REGRESSION_SUITE_ID,
      rejectOnRegression: true,
      scenarios: [
        createRegressionScenario({
          scenarioId: 'regression-smoke',
          scenarioType: 'Smoke',
          expectedResult: Object.freeze({
            executionStatus: ExecutionStatus.COMPLETED,
            cyclesExecuted: 99,
            candlesProcessed: 99,
            replayCompleted: true,
            datasetId: 'smoke-stub',
          }),
          expectedEvents: Object.freeze([
            Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
          ]),
          expectedMetrics: Object.freeze({
            cyclesExecuted: 99,
            candlesProcessed: 99,
          }),
        }),
      ],
    });

    const service = RegressionSuiteService.create({
      configuration,
      clock: defaultClock(),
    });

    await expect(service.execute()).rejects.toBeInstanceOf(RegressionSuiteRegressionDetectedError);
    expect(service.lastResult()?.regressionsDetected).toBe(1);
  });
});

describe('US198 RegressionSuiteService failure handling', () => {
  it('records execution failures as scenario failures', async () => {
    const service = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration('regression-smoke', 'Smoke'),
      clock: defaultClock(),
      createSmokeBacktestService: () => {
        throw new SmokeBacktestValidationError('smoke failed');
      },
    });

    const suite = await service.execute();
    expect(suite.scenariosFailed).toBe(1);
    expect(suite.regressionsDetected).toBe(0);
    expect(suite.scenarioResults[0]?.passed).toBe(false);
    expect(service.domainEvents().some((event) => event.eventType === 'ScenarioFailed')).toBe(true);
  });

  it('maps historical, walk forward, multi-year, and deterministic failures', async () => {
    const historical = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration(
        'regression-historical-replay',
        'HistoricalReplay',
      ),
      clock: defaultClock(),
      createHistoricalReplayService: () => {
        throw new HistoricalReplayValidationError('historical failed');
      },
    });
    expect((await historical.execute()).scenariosFailed).toBe(1);

    const walkForward = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration('regression-walk-forward', 'WalkForward'),
      clock: defaultClock(),
      createWalkForwardValidationService: () => {
        throw new WalkForwardValidationError('walk forward failed');
      },
    });
    expect((await walkForward.execute()).scenariosFailed).toBe(1);

    const multiYear = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration(
        'regression-multi-year-research',
        'MultiYearResearch',
      ),
      clock: defaultClock(),
      createMultiYearResearchService: () => {
        throw new MultiYearResearchValidationError('multi-year failed');
      },
    });
    expect((await multiYear.execute()).scenariosFailed).toBe(1);

    const deterministic = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration(
        'regression-deterministic-replay-validation',
        'DeterministicReplayValidation',
      ),
      clock: defaultClock(),
      createDeterministicReplayValidationService: () => {
        throw new DeterministicReplayValidationValidationError('deterministic failed');
      },
    });
    expect((await deterministic.execute()).scenariosFailed).toBe(1);
  });

  it('stops early when failFast is enabled', async () => {
    const configuration = createRegressionSuiteConfiguration({
      suiteId: REGRESSION_SUITE_ID,
      failFast: true,
      scenarios: [
        createRegressionScenario({
          scenarioId: 'regression-smoke',
          scenarioType: 'Smoke',
          expectedResult: Object.freeze({
            executionStatus: ExecutionStatus.COMPLETED,
            cyclesExecuted: 99,
            candlesProcessed: 99,
            replayCompleted: true,
            datasetId: 'smoke-stub',
          }),
          expectedEvents: Object.freeze([
            Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
          ]),
          expectedMetrics: Object.freeze({
            cyclesExecuted: 99,
            candlesProcessed: 99,
          }),
        }),
        predefinedRegressionScenarios()[1] as NonNullable<
          ReturnType<typeof predefinedRegressionScenarios>[number]
        >,
      ],
    });

    const service = RegressionSuiteService.create({
      configuration,
      clock: defaultClock(),
    });
    const suite = await service.execute();

    expect(suite.scenariosExecuted).toBe(1);
    expect(suite.scenarioResults).toHaveLength(1);
  });
});

describe('US198 RegressionSuiteService idempotency', () => {
  it('returns cached suite result on repeat and rejects when configured', async () => {
    const service = createService({ scenarioType: 'Smoke' });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);

    const rejecting = createService({ scenarioType: 'Smoke', rejectOnRepeat: true });
    await rejecting.execute();
    await expect(rejecting.execute()).rejects.toBeInstanceOf(RegressionSuiteAlreadyCompletedError);
  });

  it('rejects duplicate concurrent execution', async () => {
    const service = createService({ scenarioType: 'Smoke' });
    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(RegressionSuiteDuplicateExecutionError);
    await first;
  });

  it('produces deterministic regression results', async () => {
    const first = RegressionSuiteService.create({
      configuration: createPredefinedRegressionSuiteConfiguration(),
      clock: defaultClock(),
    });
    const second = RegressionSuiteService.create({
      configuration: createPredefinedRegressionSuiteConfiguration(),
      clock: defaultClock(),
    });

    const firstSuite = await first.execute();
    const secondSuite = await second.execute();

    expect(firstSuite.scenarioResults.length).toBe(secondSuite.scenarioResults.length);
    for (let index = 0; index < firstSuite.scenarioResults.length; index += 1) {
      const left = firstSuite.scenarioResults[index] as NonNullable<
        (typeof firstSuite.scenarioResults)[number]
      >;
      const right = secondSuite.scenarioResults[index] as NonNullable<
        (typeof secondSuite.scenarioResults)[number]
      >;
      expect(left).toMatchObject({
        scenarioId: right.scenarioId,
        scenarioType: right.scenarioType,
        passed: right.passed,
        regressionDetected: right.regressionDetected,
      });
    }
  });
});

describe('US198 RegressionSuiteService integration', () => {
  it('uses injected child services for each scenario', async () => {
    const smokeSpy = vi.spyOn(SmokeBacktestService, 'create');
    const historicalSpy = vi.spyOn(HistoricalReplayService, 'create');
    const walkForwardSpy = vi.spyOn(WalkForwardValidationService, 'create');
    const multiYearSpy = vi.spyOn(MultiYearResearchService, 'create');
    const deterministicSpy = vi.spyOn(DeterministicReplayValidationService, 'create');

    const service = createService({ usePredefinedSuite: true });
    await service.execute();

    expect(smokeSpy).toHaveBeenCalled();
    expect(historicalSpy).toHaveBeenCalled();
    expect(walkForwardSpy).toHaveBeenCalled();
    expect(multiYearSpy).toHaveBeenCalled();
    expect(deterministicSpy).toHaveBeenCalled();

    smokeSpy.mockRestore();
    historicalSpy.mockRestore();
    walkForwardSpy.mockRestore();
    multiYearSpy.mockRestore();
    deterministicSpy.mockRestore();
  });

  it('exposes suite configuration and last result accessors', async () => {
    const service = createService({ scenarioType: 'Smoke' });
    const suite = await service.execute();

    expect(service.suiteConfiguration().suiteId).toBe(REGRESSION_SUITE_ID);
    expect(service.lastResult()).toBe(suite);
  });
});

describe('US198 RegressionSuiteEvents', () => {
  it('declares supported event types', () => {
    expect(REGRESSION_SUITE_EVENT_TYPES).toEqual([
      'RegressionSuiteStarted',
      'ScenarioPassed',
      'ScenarioFailed',
      'RegressionDetected',
      'RegressionSuiteCompleted',
    ]);
    expect(Object.isFrozen(REGRESSION_SUITE_EVENT_TYPES)).toBe(true);
  });
});

describe('US198 RegressionSuiteService error codes', () => {
  it('wraps configuration validation failures during service creation', () => {
    expect(() =>
      RegressionSuiteService.create({
        configuration: {
          suiteId: REGRESSION_SUITE_ID,
          scenarios: [],
          failFast: false,
          rejectOnRegression: false,
        },
      }),
    ).toThrow(RegressionSuiteValidationError);
  });

  it('wraps non-error configuration validation failures during service creation', async () => {
    const configurationModule = await import('./regression-suite-configuration');
    const spy = vi
      .spyOn(configurationModule, 'createRegressionSuiteConfiguration')
      .mockImplementation(() => {
        throw 'configuration invalid';
      });

    expect(() =>
      RegressionSuiteService.create({
        configuration: createPredefinedRegressionSuiteConfiguration(),
      }),
    ).toThrow('configuration invalid');

    spy.mockRestore();
  });

  it('exposes typed error codes', () => {
    expect(new RegressionSuiteValidationError('invalid').code).toBe('REGRESSION_SUITE_VALIDATION');
    expect(new RegressionSuiteAlreadyCompletedError(REGRESSION_SUITE_ID).code).toBe(
      'REGRESSION_SUITE_ALREADY_COMPLETED',
    );
    expect(new RegressionSuiteDuplicateExecutionError().code).toBe(
      'REGRESSION_SUITE_DUPLICATE_EXECUTION',
    );
    expect(new RegressionSuiteExecutionFailedError('failed').code).toBe(
      'REGRESSION_SUITE_EXECUTION_FAILED',
    );
    expect(new RegressionSuiteRegressionDetectedError(REGRESSION_SUITE_ID, 2).code).toBe(
      'REGRESSION_SUITE_REGRESSION_DETECTED',
    );
  });

  it('wraps suite finalization failures', async () => {
    const service = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration('regression-smoke', 'Smoke'),
      clock: defaultClock(),
      createSuiteResult: () => {
        throw new RegressionSuiteValidationError('suite finalize failed');
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(RegressionSuiteValidationError);
  });

  it('wraps non-error suite finalization failures', async () => {
    const service = RegressionSuiteService.create({
      configuration: singleScenarioConfiguration('regression-smoke', 'Smoke'),
      clock: defaultClock(),
      createSuiteResult: () => {
        throw 'suite finalize failed';
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(RegressionSuiteExecutionFailedError);
  });
});

describe('US198 ExecutionBaselineComparator edge cases', () => {
  it('detects array and object payload mismatches', () => {
    const matchingPayload = Object.freeze({
      eventType: 'SmokeBacktestStarted',
      tags: Object.freeze(['alpha', 'beta']),
      meta: Object.freeze({ level: 1 }),
    });
    const expected = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([matchingPayload]),
      metrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
    });

    const actualMatching = Object.freeze({
      result: expected.result,
      events: Object.freeze([matchingPayload]),
      metrics: expected.metrics,
    });
    expect(
      executionBaselineComparator.compare({
        scenarioId: 'regression-smoke',
        expected,
        actual: actualMatching,
      }),
    ).toHaveLength(0);

    const actual = Object.freeze({
      result: expected.result,
      events: Object.freeze([
        Object.freeze({
          eventType: 'SmokeBacktestStarted',
          tags: Object.freeze(['alpha']),
          meta: Object.freeze({ level: 2, extra: true }),
        }),
      ]),
      metrics: expected.metrics,
    });

    const mismatches = executionBaselineComparator.compare({
      scenarioId: 'regression-smoke',
      expected,
      actual,
    });

    expect(mismatches.some((mismatch) => mismatch.field === 'applicationEvents[0]')).toBe(true);
  });

  it('matches nested array payloads and detects object key count differences', () => {
    const nested = Object.freeze({
      eventType: 'SmokeBacktestStarted',
      nested: Object.freeze({ values: Object.freeze([1, 2, 3]) }),
    });
    const expected = Object.freeze({
      result: Object.freeze({
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: 3,
        candlesProcessed: 3,
        replayCompleted: true,
        datasetId: 'smoke-stub',
      }),
      events: Object.freeze([nested]),
      metrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
    });

    expect(
      executionBaselineComparator.compare({
        scenarioId: 'regression-smoke',
        expected,
        actual: Object.freeze({
          result: expected.result,
          events: Object.freeze([nested]),
          metrics: expected.metrics,
        }),
      }),
    ).toHaveLength(0);

    const keyMismatch = executionBaselineComparator.compare({
      scenarioId: 'regression-smoke',
      expected,
      actual: Object.freeze({
        result: expected.result,
        events: Object.freeze([
          Object.freeze({
            eventType: 'SmokeBacktestStarted',
          }),
        ]),
        metrics: expected.metrics,
      }),
    });

    expect(keyMismatch.some((mismatch) => mismatch.field === 'applicationEvents[0]')).toBe(true);
  });
});

describe('US198 RegressionScenarioResult validation edge cases', () => {
  it('rejects invalid timestamps and durations', () => {
    const base = {
      scenarioId: 'regression-smoke',
      scenarioType: 'Smoke' as const,
      passed: true,
      regressionDetected: false,
      mismatches: Object.freeze([]),
      startedAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      duration: 1,
    };

    expect(() => createRegressionScenarioResult({ ...base, scenarioId: '   ' })).toThrow(
      'scenarioId is required',
    );
    expect(() => createRegressionScenarioResult({ ...base, startedAt: 'not-a-date' })).toThrow(
      'startedAt must be an ISO-8601 UTC timestamp',
    );
    expect(() => createRegressionScenarioResult({ ...base, duration: -1 })).toThrow(
      'duration must be a non-negative integer',
    );
  });
});

describe('US198 RegressionScenario validation edge cases', () => {
  it('rejects invalid optional metric and result fields', () => {
    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad-metrics',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
          iterations: 0,
        }),
        expectedEvents: Object.freeze([
          Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
        ]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('iterations must be a positive integer');

    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad-event',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: Object.freeze([Object.freeze({ eventType: '   ', cycles: 3 })]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('expectedEvents[0].eventType is required');

    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad-event-object',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 3,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: Object.freeze(['invalid-event' as unknown as RegressionStableEvent]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('expectedEvents[0] must be an object');

    expect(() =>
      createRegressionScenario({
        scenarioId: 'bad-result',
        scenarioType: 'Smoke',
        expectedResult: Object.freeze({
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: -1,
          candlesProcessed: 3,
          replayCompleted: true,
          datasetId: 'smoke-stub',
        }),
        expectedEvents: Object.freeze([
          Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
        ]),
        expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
      }),
    ).toThrow('cyclesExecuted must be a non-negative integer');
  });
});

describe('US198 RegressionSuiteResult validation edge cases', () => {
  it('rejects invalid aggregated values', () => {
    expect(() =>
      createRegressionSuiteResult({
        suiteId: REGRESSION_SUITE_ID,
        scenariosExecuted: -1,
        scenariosPassed: 0,
        scenariosFailed: 0,
        regressionsDetected: 0,
        scenarioResults: [],
        startedAt: SUITE_START,
        completedAt: SUITE_COMPLETED,
        duration: 0,
      }),
    ).toThrow('scenariosExecuted must be a non-negative integer');

    expect(() =>
      createRegressionSuiteResult({
        suiteId: REGRESSION_SUITE_ID,
        scenariosExecuted: 0,
        scenariosPassed: 0,
        scenariosFailed: 0,
        regressionsDetected: 0,
        scenarioResults: [],
        startedAt: SUITE_START,
        completedAt: 'not-a-date',
        duration: 0,
      }),
    ).toThrow('completedAt must be an ISO-8601 UTC timestamp');
  });
});

describe('US198 captureRegressionBaseline edge cases', () => {
  it('rejects unsupported scenario types at runtime', async () => {
    await expect(
      captureRegressionBaseline('Unsupported' as 'Smoke', Object.freeze({ clock: defaultClock() })),
    ).rejects.toThrow('unsupported scenario');
  });

  it('falls back when multi-year metrics are unavailable', async () => {
    const walkForwardResult = {
      executionId: 'wf-1',
      datasetId: 'dataset-1',
      totalWindows: 1,
      completedWindows: 1,
      failedWindows: 0,
      replayResults: Object.freeze([
        Object.freeze({
          sessionId: 'session-1',
          runnerStatus: 'STOPPED',
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 4,
          startedAt: SUITE_START,
          completedAt: SUITE_COMPLETED,
          duration: 100,
          eventsPublished: 0,
          errors: Object.freeze([]),
          datasetId: 'dataset-1',
          candlesProcessed: 4,
          replayCompleted: true,
        }),
      ]),
      startedAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      duration: 100,
    };

    const service = {
      execute: vi.fn(async () =>
        Object.freeze({
          researchId: 'research-1',
          datasetsProcessed: 1,
          datasetsSucceeded: 1,
          datasetsFailed: 0,
          walkForwardResults: Object.freeze([walkForwardResult]),
          startedAt: SUITE_START,
          completedAt: SUITE_COMPLETED,
          duration: 100,
        }),
      ),
      domainEvents: vi.fn(() =>
        Object.freeze([
          Object.freeze({
            eventType: 'MultiYearResearchStarted',
            researchId: 'research-1',
            occurredAt: SUITE_START,
            totalDatasets: 1,
          }),
        ]),
      ),
      metrics: vi.fn(() => null),
    } as unknown as MultiYearResearchService;

    const baseline = await captureRegressionBaseline(
      'MultiYearResearch',
      Object.freeze({ clock: defaultClock() }),
      Object.freeze({
        createSmokeBacktestService: () => {
          throw new Error('not used');
        },
        createHistoricalReplayService: () => {
          throw new Error('not used');
        },
        createWalkForwardValidationService: () => {
          throw new Error('not used');
        },
        createMultiYearResearchService: () => service,
        createDeterministicReplayValidationService: () => {
          throw new Error('not used');
        },
      }),
    );

    expect(baseline.metrics).toMatchObject({
      cyclesExecuted: 4,
      candlesProcessed: 4,
      datasetsProcessed: 1,
    });
  });
});

describe('US198 RegressionMismatch validation edge cases', () => {
  it('rejects blank mismatch fields', () => {
    expect(() =>
      createRegressionMismatch({
        scenarioId: 'regression-smoke',
        field: '   ',
        expected: 1,
        actual: 2,
      }),
    ).toThrow('field is required');
  });
});

describe('US198 RegressionSuiteConfiguration validation edge cases', () => {
  it('rejects blank scenario identifiers during suite validation', () => {
    expect(() =>
      createRegressionSuiteConfiguration({
        suiteId: REGRESSION_SUITE_ID,
        scenarios: [
          createRegressionScenario({
            scenarioId: '   ',
            scenarioType: 'Smoke',
            expectedResult: Object.freeze({
              executionStatus: ExecutionStatus.COMPLETED,
              cyclesExecuted: 3,
              candlesProcessed: 3,
              replayCompleted: true,
              datasetId: 'smoke-stub',
            }),
            expectedEvents: Object.freeze([
              Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: 3 }),
            ]),
            expectedMetrics: Object.freeze({ cyclesExecuted: 3, candlesProcessed: 3 }),
          }),
        ],
      }),
    ).toThrow('scenarioId is required');
  });
});

describe('US198 regression scenario constants', () => {
  it('uses deterministic benchmark datasets', () => {
    expect(BENCHMARK_SMOKE_CYCLES).toBe(3);
    expect(BENCHMARK_HISTORICAL_CANDLE_COUNT).toBe(6);
    expect(BENCHMARK_MULTI_YEAR_DATASET_IDS).toHaveLength(2);
  });
});
