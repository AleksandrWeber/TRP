import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoricalReplayService, HistoricalReplayValidationError } from '../historical-replay';
import { MultiYearResearchService, MultiYearResearchValidationError } from '../multi-year-research';
import {
  createExecutionResult,
  ExecutionStatus,
  SmokeBacktestService,
  SmokeBacktestValidationError,
} from '../smoke-backtest';
import { RunnerStatus } from '../paper-trading-runner';
import {
  WalkForwardValidationError,
  WalkForwardValidationService,
} from '../walk-forward-validation';
import {
  aggregateBenchmarkSuiteResult,
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  calculateThroughput,
  createBenchmarkHistoricalDataset,
  createBenchmarkResult,
  createBenchmarkScenarioFactories,
  createBenchmarkSuiteConfiguration,
  createBenchmarkSuiteResult,
  createDefaultBenchmarkExecutionId,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createPredefinedBenchmarkSuiteConfiguration,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
  isBenchmarkScenario,
  PerformanceBenchmarkAlreadyCompletedError,
  PerformanceBenchmarkDuplicateExecutionError,
  PerformanceBenchmarkExecutionFailedError,
  PerformanceBenchmarkService,
  PerformanceBenchmarkValidationError,
  PERFORMANCE_BENCHMARK_EVENT_TYPES,
  predefinedBenchmarkSuiteEntries,
  type PerformanceBenchmarkServiceDependencies,
} from './index';

const SUITE_START = '2026-07-20T14:00:00.000Z';
const BENCHMARK_TICK = '2026-07-20T14:00:01.000Z';
const SUITE_COMPLETED = '2026-07-20T14:30:00.000Z';
const SUITE_ID = 'benchmark-suite-196';

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
    ...Array.from({ length: 5_000 }, () => BENCHMARK_TICK),
    SUITE_COMPLETED,
  ]);
}

function singleBenchmarkConfiguration(
  benchmarkId: string,
  scenario: 'Smoke' | 'HistoricalReplay' | 'WalkForward' | 'MultiYearResearch',
) {
  return createBenchmarkSuiteConfiguration({
    suiteId: SUITE_ID,
    benchmarks: [{ benchmarkId, scenario }],
  });
}

function createService(
  overrides: Partial<PerformanceBenchmarkServiceDependencies> & {
    clockTimes?: string[];
    benchmarkId?: string;
    scenario?: 'Smoke' | 'HistoricalReplay' | 'WalkForward' | 'MultiYearResearch';
    usePredefinedSuite?: boolean;
  } = {},
): PerformanceBenchmarkService {
  const {
    clockTimes: _clockTimes,
    benchmarkId,
    scenario,
    usePredefinedSuite,
    ...dependencyOverrides
  } = overrides;

  const configuration =
    dependencyOverrides.configuration ??
    (usePredefinedSuite === true
      ? createPredefinedBenchmarkSuiteConfiguration()
      : singleBenchmarkConfiguration(benchmarkId ?? 'benchmark-smoke', scenario ?? 'Smoke'));

  return PerformanceBenchmarkService.create({
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

describe('US196 BenchmarkScenario', () => {
  it('identifies supported scenarios', () => {
    expect(isBenchmarkScenario('Smoke')).toBe(true);
    expect(isBenchmarkScenario('HistoricalReplay')).toBe(true);
    expect(isBenchmarkScenario('WalkForward')).toBe(true);
    expect(isBenchmarkScenario('MultiYearResearch')).toBe(true);
    expect(isBenchmarkScenario('Unknown')).toBe(false);
    expect(isBenchmarkScenario(42)).toBe(false);
  });
});

describe('US196 BenchmarkResult', () => {
  it('creates immutable benchmark results', () => {
    const result = createBenchmarkResult({
      benchmarkId: 'benchmark-smoke',
      scenario: 'Smoke',
      startedAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      duration: 1_800_000,
      datasetsProcessed: 0,
      windowsProcessed: 0,
      candlesProcessed: 3,
      cyclesProcessed: 3,
      throughputCandlesPerSecond: 0.0016666666666666668,
      throughputCyclesPerSecond: 0.0016666666666666668,
      success: true,
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(result.success).toBe(true);
  });

  it('calculates throughput and rejects invalid values', () => {
    expect(calculateThroughput(100, 1_000)).toBe(100);
    expect(calculateThroughput(0, 0)).toBe(0);
    expect(calculateThroughput(-1, 1_000)).toBe(0);
    expect(calculateThroughput(Number.NaN, 1_000)).toBe(0);

    expect(() =>
      createBenchmarkResult({
        benchmarkId: 123 as unknown as string,
        scenario: 'Smoke',
        startedAt: SUITE_START,
        completedAt: SUITE_COMPLETED,
        duration: 1,
        datasetsProcessed: 0,
        windowsProcessed: 0,
        candlesProcessed: 1,
        cyclesProcessed: 1,
        throughputCandlesPerSecond: 1,
        throughputCyclesPerSecond: 1,
        success: true,
      }),
    ).toThrow('benchmarkId is required');
  });
});

describe('US196 BenchmarkSuiteResult', () => {
  it('aggregates benchmark suite metrics', () => {
    const first = createBenchmarkResult({
      benchmarkId: 'one',
      scenario: 'Smoke',
      startedAt: SUITE_START,
      completedAt: '2026-07-20T14:00:10.000Z',
      duration: 10_000,
      datasetsProcessed: 0,
      windowsProcessed: 0,
      candlesProcessed: 3,
      cyclesProcessed: 3,
      throughputCandlesPerSecond: 0.3,
      throughputCyclesPerSecond: 0.3,
      success: true,
    });
    const second = createBenchmarkResult({
      benchmarkId: 'two',
      scenario: 'HistoricalReplay',
      startedAt: '2026-07-20T14:00:10.000Z',
      completedAt: '2026-07-20T14:00:20.000Z',
      duration: 20_000,
      datasetsProcessed: 1,
      windowsProcessed: 0,
      candlesProcessed: 6,
      cyclesProcessed: 6,
      throughputCandlesPerSecond: 0.3,
      throughputCyclesPerSecond: 0.3,
      success: true,
    });

    const aggregated = aggregateBenchmarkSuiteResult(SUITE_ID, [first, second]);
    expect(aggregated).toMatchObject({
      suiteId: SUITE_ID,
      totalDuration: 30_000,
      averageThroughput: 0.3,
      maximumDuration: 20_000,
      minimumDuration: 10_000,
    });
    expect(Object.isFrozen(aggregated)).toBe(true);
    expect(Object.isFrozen(aggregated.benchmarkResults)).toBe(true);
  });

  it('handles empty aggregation and validates suite results', () => {
    const empty = aggregateBenchmarkSuiteResult(SUITE_ID, []);
    expect(empty.totalDuration).toBe(0);
    expect(empty.averageThroughput).toBe(0);

    expect(() =>
      createBenchmarkSuiteResult({
        suiteId: '',
        benchmarkResults: [],
        totalDuration: 0,
        averageThroughput: 0,
        maximumDuration: 0,
        minimumDuration: 0,
      }),
    ).toThrow('suiteId is required');
  });
});

describe('US196 BenchmarkSuiteConfiguration', () => {
  it('creates predefined benchmark suite entries', () => {
    const configuration = createPredefinedBenchmarkSuiteConfiguration();
    expect(configuration.suiteId).toBe(SUITE_ID);
    expect(predefinedBenchmarkSuiteEntries()).toHaveLength(4);
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(Object.isFrozen(configuration.benchmarks)).toBe(true);
  });

  it('rejects empty suites, duplicate identifiers, and unsupported scenarios', () => {
    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: SUITE_ID,
        benchmarks: [],
      }),
    ).toThrow('benchmark suite must not be empty');

    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: SUITE_ID,
        benchmarks: [
          { benchmarkId: 'dup', scenario: 'Smoke' },
          { benchmarkId: 'dup', scenario: 'Smoke' },
        ],
      }),
    ).toThrow('duplicate benchmark identifier: dup');

    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: SUITE_ID,
        benchmarks: [{ benchmarkId: 'bad', scenario: 'Invalid' as 'Smoke' }],
      }),
    ).toThrow('unsupported scenario: Invalid');
  });
});

describe('US196 benchmark scenario factories', () => {
  it('creates deterministic datasets and dependencies', () => {
    const clock = defaultClock();
    const context = Object.freeze({ clock });

    const dataset = createBenchmarkHistoricalDataset('benchmark-dataset', 4);
    expect(dataset.candles).toHaveLength(4);

    const factories = createBenchmarkScenarioFactories(context);
    expect(factories.createSmokeBacktestService()).toBeInstanceOf(SmokeBacktestService);
    expect(factories.createHistoricalReplayService()).toBeInstanceOf(HistoricalReplayService);
    expect(factories.createWalkForwardValidationService()).toBeInstanceOf(
      WalkForwardValidationService,
    );
    expect(factories.createMultiYearResearchService()).toBeInstanceOf(MultiYearResearchService);

    expect(createSmokeBenchmarkDependencies(context).cycles).toBe(BENCHMARK_SMOKE_CYCLES);
    expect(createHistoricalReplayBenchmarkDependencies(context).dataset?.candles.length).toBe(
      BENCHMARK_HISTORICAL_CANDLE_COUNT,
    );
    expect(createWalkForwardBenchmarkDependencies(context).dataset?.candles.length).toBe(
      BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
    );
    expect(createMultiYearBenchmarkDependencies(context).configuration?.datasets.length).toBe(
      BENCHMARK_MULTI_YEAR_DATASET_IDS.length,
    );
    expect(
      createMultiYearBenchmarkDependencies(context).configuration?.datasets[0]?.candles.length,
    ).toBe(BENCHMARK_MULTI_YEAR_CANDLE_COUNT);
  });
});

describe('US196 PerformanceBenchmarkService creation', () => {
  it('requires configuration, workspaceId, and strategyId', () => {
    expect(() => PerformanceBenchmarkService.create({ configuration: null })).toThrow(
      PerformanceBenchmarkValidationError,
    );

    expect(() =>
      PerformanceBenchmarkService.create({
        configuration: createPredefinedBenchmarkSuiteConfiguration(),
        workspaceId: '   ',
      }),
    ).toThrow('workspaceId is required');

    expect(() =>
      PerformanceBenchmarkService.create({
        configuration: createPredefinedBenchmarkSuiteConfiguration(),
        strategyId: '',
      }),
    ).toThrow('strategyId is required');
  });
});

describe('US196 PerformanceBenchmarkService smoke scenario', () => {
  it('executes smoke benchmark and collects metrics', async () => {
    const service = createService({ scenario: 'Smoke' });
    const suite = await service.execute();

    expect(suite.benchmarkResults).toHaveLength(1);
    const [result] = suite.benchmarkResults;
    expect(result).toMatchObject({
      benchmarkId: 'benchmark-smoke',
      scenario: 'Smoke',
      success: true,
      datasetsProcessed: 0,
      windowsProcessed: 0,
      candlesProcessed: BENCHMARK_SMOKE_CYCLES,
      cyclesProcessed: BENCHMARK_SMOKE_CYCLES,
    });
    expect(result.throughputCandlesPerSecond).toBeGreaterThan(0);
    expect(result.throughputCyclesPerSecond).toBeGreaterThan(0);

    const events = service.domainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'BenchmarkStarted',
      'BenchmarkCompleted',
      'SuiteCompleted',
    ]);
  });
});

describe('US196 PerformanceBenchmarkService historical replay scenario', () => {
  it('executes historical replay benchmark', async () => {
    const service = createService({
      benchmarkId: 'benchmark-historical-replay',
      scenario: 'HistoricalReplay',
    });
    const suite = await service.execute();

    const [result] = suite.benchmarkResults;
    expect(result).toMatchObject({
      scenario: 'HistoricalReplay',
      success: true,
      datasetsProcessed: 1,
      windowsProcessed: 0,
      candlesProcessed: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      cyclesProcessed: BENCHMARK_HISTORICAL_CANDLE_COUNT,
    });
  });
});

describe('US196 PerformanceBenchmarkService walk forward scenario', () => {
  it('executes walk forward benchmark', async () => {
    const service = createService({
      benchmarkId: 'benchmark-walk-forward',
      scenario: 'WalkForward',
    });
    const suite = await service.execute();

    const [result] = suite.benchmarkResults;
    expect(result.success).toBe(true);
    expect(result.datasetsProcessed).toBe(1);
    expect(result.windowsProcessed).toBeGreaterThan(0);
    expect(result.candlesProcessed).toBeGreaterThan(0);
    expect(result.cyclesProcessed).toBeGreaterThan(0);
  });
});

describe('US196 PerformanceBenchmarkService multi-year scenario', () => {
  it('executes multi-year research benchmark', async () => {
    const service = createService({
      benchmarkId: 'benchmark-multi-year-research',
      scenario: 'MultiYearResearch',
    });
    const suite = await service.execute();

    const [result] = suite.benchmarkResults;
    expect(result.success).toBe(true);
    expect(result.datasetsProcessed).toBe(BENCHMARK_MULTI_YEAR_DATASET_IDS.length);
    expect(result.windowsProcessed).toBeGreaterThan(0);
    expect(result.candlesProcessed).toBeGreaterThan(0);
    expect(result.cyclesProcessed).toBeGreaterThan(0);
  });
});

describe('US196 PerformanceBenchmarkService predefined suite', () => {
  it('executes all predefined benchmark scenarios', async () => {
    const service = createService({ usePredefinedSuite: true });
    const suite = await service.execute();

    expect(suite.benchmarkResults).toHaveLength(4);
    expect(suite.benchmarkResults.every((result) => result.success)).toBe(true);
    expect(suite.totalDuration).toBeGreaterThan(0);
    expect(suite.averageThroughput).toBeGreaterThan(0);
    expect(suite.maximumDuration).toBeGreaterThanOrEqual(suite.minimumDuration);

    const events = service.domainEvents();
    expect(events.filter((event) => event.eventType === 'BenchmarkStarted')).toHaveLength(4);
    expect(events.filter((event) => event.eventType === 'BenchmarkCompleted')).toHaveLength(4);
    expect(events.at(-1)?.eventType).toBe('SuiteCompleted');
  });
});

describe('US196 PerformanceBenchmarkService failure handling', () => {
  it('records failed benchmarks and continues the suite', async () => {
    const configuration = createBenchmarkSuiteConfiguration({
      suiteId: SUITE_ID,
      benchmarks: [
        { benchmarkId: 'benchmark-smoke', scenario: 'Smoke' },
        { benchmarkId: 'benchmark-failing', scenario: 'HistoricalReplay' },
      ],
    });

    const service = PerformanceBenchmarkService.create({
      configuration,
      clock: defaultClock(),
      createHistoricalReplayService: () => {
        throw new HistoricalReplayValidationError('historical replay failed');
      },
    });

    const suite = await service.execute();
    expect(suite.benchmarkResults).toHaveLength(2);
    expect(suite.benchmarkResults[0]?.success).toBe(true);
    expect(suite.benchmarkResults[1]?.success).toBe(false);

    const events = service.domainEvents();
    expect(events.some((event) => event.eventType === 'BenchmarkFailed')).toBe(true);
    expect(events.at(-1)?.eventType).toBe('SuiteCompleted');
  });

  it('maps smoke, walk forward, and multi-year failures', async () => {
    const smokeService = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-smoke', 'Smoke'),
      clock: defaultClock(),
      createSmokeBacktestService: () => {
        throw new SmokeBacktestValidationError('smoke failed');
      },
    });
    const smokeSuite = await smokeService.execute();
    expect(smokeSuite.benchmarkResults[0]?.success).toBe(false);

    const walkForwardService = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-walk-forward', 'WalkForward'),
      clock: defaultClock(),
      createWalkForwardValidationService: () => {
        throw new WalkForwardValidationError('walk forward failed');
      },
    });
    const walkForwardSuite = await walkForwardService.execute();
    expect(walkForwardSuite.benchmarkResults[0]?.success).toBe(false);

    const multiYearService = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration(
        'benchmark-multi-year-research',
        'MultiYearResearch',
      ),
      clock: defaultClock(),
      createMultiYearResearchService: () => {
        throw new MultiYearResearchValidationError('multi-year failed');
      },
    });
    const multiYearSuite = await multiYearService.execute();
    expect(multiYearSuite.benchmarkResults[0]?.success).toBe(false);
  });
});

describe('US196 PerformanceBenchmarkService idempotency', () => {
  it('returns cached suite result on repeat and rejects when configured', async () => {
    const service = createService({ scenario: 'Smoke' });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);

    const rejecting = createService({ scenario: 'Smoke', rejectOnRepeat: true });
    await rejecting.execute();
    await expect(rejecting.execute()).rejects.toBeInstanceOf(
      PerformanceBenchmarkAlreadyCompletedError,
    );
  });

  it('rejects duplicate concurrent execution', async () => {
    const service = createService({ scenario: 'Smoke' });
    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(
      PerformanceBenchmarkDuplicateExecutionError,
    );
    await first;
  });

  it('produces deterministic benchmark results within tolerance', async () => {
    const clock = defaultClock();
    const first = PerformanceBenchmarkService.create({
      configuration: createPredefinedBenchmarkSuiteConfiguration(),
      clock,
    });
    const second = PerformanceBenchmarkService.create({
      configuration: createPredefinedBenchmarkSuiteConfiguration(),
      clock: defaultClock(),
    });

    const firstSuite = await first.execute();
    const secondSuite = await second.execute();

    expect(firstSuite.benchmarkResults.length).toBe(secondSuite.benchmarkResults.length);

    for (let index = 0; index < firstSuite.benchmarkResults.length; index += 1) {
      const left = firstSuite.benchmarkResults[index] as NonNullable<
        (typeof firstSuite.benchmarkResults)[number]
      >;
      const right = secondSuite.benchmarkResults[index] as NonNullable<
        (typeof secondSuite.benchmarkResults)[number]
      >;
      expect(left).toMatchObject({
        benchmarkId: right.benchmarkId,
        scenario: right.scenario,
        datasetsProcessed: right.datasetsProcessed,
        windowsProcessed: right.windowsProcessed,
        candlesProcessed: right.candlesProcessed,
        cyclesProcessed: right.cyclesProcessed,
        success: right.success,
      });
      expect(Math.abs(left.duration - right.duration)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(left.throughputCandlesPerSecond - right.throughputCandlesPerSecond),
      ).toBeLessThan(0.001);
    }
  });
});

describe('US196 PerformanceBenchmarkService integration', () => {
  it('uses injected child services for each scenario', async () => {
    const smokeSpy = vi.spyOn(SmokeBacktestService, 'create');
    const historicalSpy = vi.spyOn(HistoricalReplayService, 'create');
    const walkForwardSpy = vi.spyOn(WalkForwardValidationService, 'create');
    const multiYearSpy = vi.spyOn(MultiYearResearchService, 'create');

    const service = createService({ usePredefinedSuite: true });
    await service.execute();

    expect(smokeSpy).toHaveBeenCalled();
    expect(historicalSpy).toHaveBeenCalled();
    expect(walkForwardSpy).toHaveBeenCalled();
    expect(multiYearSpy).toHaveBeenCalled();

    smokeSpy.mockRestore();
    historicalSpy.mockRestore();
    walkForwardSpy.mockRestore();
    multiYearSpy.mockRestore();
  });

  it('supports custom scenario factories and result creators', async () => {
    const completedResult = createExecutionResult({
      sessionId: 'custom-smoke',
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 9,
      startedAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      duration: 100,
      eventsPublished: 0,
      errors: Object.freeze([]),
      datasetId: 'smoke-stub',
      candlesProcessed: 9,
      replayCompleted: true,
    });

    const customSmoke = {
      execute: vi.fn(async () => completedResult),
    } as unknown as SmokeBacktestService;

    const service = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('custom-smoke', 'Smoke'),
      clock: createClock([SUITE_START, SUITE_COMPLETED, SUITE_COMPLETED]),
      createScenarioFactories: (_context) =>
        Object.freeze({
          createSmokeBacktestService: () => customSmoke,
          createHistoricalReplayService: () => {
            throw new Error('not used');
          },
          createWalkForwardValidationService: () => {
            throw new Error('not used');
          },
          createMultiYearResearchService: () => {
            throw new Error('not used');
          },
        }),
      createBenchmarkResult: (properties) =>
        createBenchmarkResult({ ...properties, benchmarkId: 'custom-result-id' }),
    });

    const suite = await service.execute();
    expect(suite.benchmarkResults[0]?.benchmarkId).toBe('custom-result-id');
    expect(suite.benchmarkResults[0]?.cyclesProcessed).toBe(9);
    expect(service.lastResult()).toBe(suite);
    expect(service.suiteConfiguration().suiteId).toBe(SUITE_ID);
  });
});

describe('US196 BenchmarkEvents', () => {
  it('declares supported event types', () => {
    expect(PERFORMANCE_BENCHMARK_EVENT_TYPES).toEqual([
      'BenchmarkStarted',
      'BenchmarkCompleted',
      'BenchmarkFailed',
      'SuiteCompleted',
    ]);
    expect(Object.isFrozen(PERFORMANCE_BENCHMARK_EVENT_TYPES)).toBe(true);
  });
});

describe('US196 BenchmarkSuiteConfiguration validation edge cases', () => {
  it('rejects missing benchmarks and blank suite identifiers', () => {
    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: SUITE_ID,
        benchmarks: null as unknown as [],
      }),
    ).toThrow('benchmarks are required');

    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: '   ',
        benchmarks: [{ benchmarkId: 'one', scenario: 'Smoke' }],
      }),
    ).toThrow('suiteId is required');

    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: SUITE_ID,
        benchmarks: [{ benchmarkId: '   ', scenario: 'Smoke' }],
      }),
    ).toThrow('benchmarkId is required');

    expect(() =>
      createBenchmarkSuiteConfiguration({
        suiteId: 123 as unknown as string,
        benchmarks: [{ benchmarkId: 'one', scenario: 'Smoke' }],
      }),
    ).toThrow('suiteId is required');
  });
});

describe('US196 BenchmarkResult validation edge cases', () => {
  it('rejects invalid timestamps and metric values', () => {
    const base = {
      benchmarkId: 'benchmark-smoke',
      scenario: 'Smoke' as const,
      startedAt: SUITE_START,
      completedAt: SUITE_COMPLETED,
      duration: 1,
      datasetsProcessed: 0,
      windowsProcessed: 0,
      candlesProcessed: 1,
      cyclesProcessed: 1,
      throughputCandlesPerSecond: 1,
      throughputCyclesPerSecond: 1,
      success: true,
    };

    expect(() => createBenchmarkResult({ ...base, startedAt: 'not-a-date' })).toThrow(
      'startedAt must be an ISO-8601 UTC timestamp',
    );
    expect(() => createBenchmarkResult({ ...base, duration: -1 })).toThrow(
      'duration must be a non-negative integer',
    );
    expect(() =>
      createBenchmarkResult({ ...base, throughputCandlesPerSecond: Number.NaN }),
    ).toThrow('throughputCandlesPerSecond must be a non-negative number');
  });
});

describe('US196 BenchmarkSuiteResult validation edge cases', () => {
  it('rejects invalid aggregated values', () => {
    expect(() =>
      createBenchmarkSuiteResult({
        suiteId: SUITE_ID,
        benchmarkResults: [],
        totalDuration: -1,
        averageThroughput: 0,
        maximumDuration: 0,
        minimumDuration: 0,
      }),
    ).toThrow('totalDuration must be a non-negative integer');

    expect(() =>
      createBenchmarkSuiteResult({
        suiteId: SUITE_ID,
        benchmarkResults: [],
        totalDuration: 0,
        averageThroughput: -1,
        maximumDuration: 0,
        minimumDuration: 0,
      }),
    ).toThrow('averageThroughput must be a non-negative number');
  });
});

describe('US196 PerformanceBenchmarkService error codes', () => {
  it('wraps configuration validation failures during service creation', () => {
    expect(() =>
      PerformanceBenchmarkService.create({
        configuration: {
          suiteId: SUITE_ID,
          benchmarks: [],
        },
      }),
    ).toThrow(PerformanceBenchmarkValidationError);
  });

  it('wraps non-error configuration validation failures during service creation', async () => {
    const configurationModule = await import('./benchmark-configuration');
    const spy = vi
      .spyOn(configurationModule, 'createBenchmarkSuiteConfiguration')
      .mockImplementation(() => {
        throw 'configuration invalid';
      });

    expect(() =>
      PerformanceBenchmarkService.create({
        configuration: createPredefinedBenchmarkSuiteConfiguration(),
      }),
    ).toThrow('configuration invalid');

    spy.mockRestore();
  });

  it('exposes typed error codes', () => {
    expect(new PerformanceBenchmarkValidationError('invalid').code).toBe(
      'PERFORMANCE_BENCHMARK_VALIDATION',
    );
    expect(new PerformanceBenchmarkAlreadyCompletedError(SUITE_ID).code).toBe(
      'PERFORMANCE_BENCHMARK_ALREADY_COMPLETED',
    );
    expect(new PerformanceBenchmarkDuplicateExecutionError().code).toBe(
      'PERFORMANCE_BENCHMARK_DUPLICATE_EXECUTION',
    );
    expect(new PerformanceBenchmarkExecutionFailedError('failed').code).toBe(
      'PERFORMANCE_BENCHMARK_EXECUTION_FAILED',
    );
  });

  it('records factory setup failures as failed benchmark results', async () => {
    const service = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-smoke', 'Smoke'),
      clock: defaultClock(),
      createScenarioFactories: () => {
        throw new Error('factory setup failed');
      },
    });

    const suite = await service.execute();
    expect(suite.benchmarkResults[0]?.success).toBe(false);
    expect(service.domainEvents().some((event) => event.eventType === 'BenchmarkFailed')).toBe(
      true,
    );
  });

  it('wraps suite finalization failures', async () => {
    const service = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-smoke', 'Smoke'),
      clock: defaultClock(),
      createSuiteResult: () => {
        throw new PerformanceBenchmarkValidationError('suite finalize failed');
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(PerformanceBenchmarkValidationError);
  });

  it('wraps non-error suite finalization failures', async () => {
    const service = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-smoke', 'Smoke'),
      clock: defaultClock(),
      createSuiteResult: () => {
        throw 'suite finalize failed';
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      PerformanceBenchmarkExecutionFailedError,
    );
  });

  it('rejects unsupported runtime scenarios defensively', async () => {
    const service = createService({ scenario: 'Smoke' });
    await expect(
      (
        service as unknown as {
          runScenario: (
            entry: { benchmarkId: string; scenario: string },
            context: unknown,
            startedAt: string,
          ) => Promise<unknown>;
        }
      ).runScenario(
        { benchmarkId: 'bad', scenario: 'Unsupported' },
        { clock: defaultClock() },
        SUITE_START,
      ),
    ).rejects.toBeInstanceOf(PerformanceBenchmarkValidationError);
  });

  it('supports custom service factories for individual scenarios', async () => {
    const customSmoke = {
      execute: vi.fn(async () =>
        createExecutionResult({
          sessionId: 'custom-smoke',
          runnerStatus: RunnerStatus.STOPPED,
          executionStatus: ExecutionStatus.COMPLETED,
          cyclesExecuted: 5,
          startedAt: SUITE_START,
          completedAt: SUITE_COMPLETED,
          duration: 100,
          eventsPublished: 0,
          errors: Object.freeze([]),
          datasetId: 'smoke-stub',
          candlesProcessed: 5,
          replayCompleted: true,
        }),
      ),
    } as unknown as SmokeBacktestService;

    const service = PerformanceBenchmarkService.create({
      configuration: singleBenchmarkConfiguration('benchmark-smoke', 'Smoke'),
      clock: createClock([SUITE_START, SUITE_COMPLETED, SUITE_COMPLETED]),
      createSmokeBacktestService: () => customSmoke,
    });

    const suite = await service.execute();
    expect(suite.benchmarkResults[0]?.cyclesProcessed).toBe(5);
    expect(customSmoke.execute).toHaveBeenCalledTimes(1);
  });

  it('creates default benchmark execution identifiers', () => {
    expect(createDefaultBenchmarkExecutionId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
