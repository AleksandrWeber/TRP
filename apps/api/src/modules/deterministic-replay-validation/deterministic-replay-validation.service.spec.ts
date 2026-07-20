import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./deterministic-replay-validation-configuration', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./deterministic-replay-validation-configuration')>();
  return {
    ...actual,
    createDeterministicReplayConfiguration: vi.fn(actual.createDeterministicReplayConfiguration),
  };
});

import * as configurationModule from './deterministic-replay-validation-configuration';
import * as historicalReplayModule from '../historical-replay';
import {
  createHistoricalCandle,
  createHistoricalDataset,
  createReplayConfiguration,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  HistoricalReplayValidationError,
  type HistoricalCandle,
  type HistoricalDataset,
  type HistoricalReplayEvent,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import { ExecutionStatus, createExecutionResult, type ExecutionResult } from '../smoke-backtest';
import {
  createEventEmissionFailingNotifier,
  DETERMINISTIC_COMPLETION_EVENTS,
} from '../chaos-testing';
import { RunnerStatus } from '../paper-trading-runner';
import {
  compareReplayToBaseline,
  comparableExecutionSnapshot,
  createDeterministicReplayConfiguration,
  createDeterministicReplayValidationResult,
  createReplayMismatch,
  DeterministicReplayValidationAlreadyCompletedError,
  DeterministicReplayValidationDuplicateExecutionError,
  DeterministicReplayValidationExecutionFailedError,
  DeterministicReplayValidationMismatchError,
  DeterministicReplayValidationReplayFailedError,
  DeterministicReplayValidationService,
  DeterministicReplayValidationValidationError,
  executionOrder,
  stableReplayEvent,
  type DeterministicReplayConfiguration,
  type DeterministicReplayValidationServiceDependencies,
  type CreateDeterministicReplayStrategy,
} from './index';

const VALIDATION_START = '2026-07-20T14:00:00.000Z';
const VALIDATION_COMPLETED = '2026-07-20T14:05:00.000Z';
const VALIDATION_ID = 'validation-197';
const DATASET_ID = 'btc-m5-deterministic';

const REPLAY_CLOCK_TIMES = [
  '2026-07-20T10:00:00.000Z',
  '2026-07-20T10:00:01.000Z',
  '2026-07-20T10:00:02.000Z',
  '2026-07-20T10:00:03.000Z',
  '2026-07-20T10:00:04.000Z',
  '2026-07-20T10:00:05.000Z',
  '2026-07-20T10:00:06.000Z',
  '2026-07-20T10:00:07.000Z',
] as const;

const DEFAULT_CANDLES: readonly HistoricalCandle[] = Object.freeze([
  createHistoricalCandle({
    timestamp: '2026-07-19T20:00:00.000Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1_000,
  }),
  createHistoricalCandle({
    timestamp: '2026-07-19T20:05:00.000Z',
    open: 105,
    high: 115,
    low: 100,
    close: 112,
    volume: 1_100,
  }),
  createHistoricalCandle({
    timestamp: '2026-07-19T20:10:00.000Z',
    open: 112,
    high: 120,
    low: 108,
    close: 118,
    volume: 1_200,
  }),
]);

function createClock(times: string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function defaultDataset(
  overrides: Partial<{
    datasetId: string;
    candles: readonly HistoricalCandle[];
  }> = {},
): HistoricalDataset {
  return createHistoricalDataset({
    datasetId: overrides.datasetId ?? DATASET_ID,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles: overrides.candles ?? DEFAULT_CANDLES,
  });
}

function defaultConfiguration(
  overrides: Partial<DeterministicReplayConfiguration> = {},
): DeterministicReplayConfiguration {
  return createDeterministicReplayConfiguration({
    validationId: VALIDATION_ID,
    replayConfiguration: {
      datasetId: DATASET_ID,
      endIndex: 2,
    },
    iterations: 3,
    rejectOnMismatch: false,
    ...overrides,
  });
}

function validationClockTimes(iterations: number): string[] {
  const perReplay = REPLAY_CLOCK_TIMES.length;
  const validationEvents = iterations + iterations + 1;
  const total = validationEvents + iterations * perReplay;
  return [
    VALIDATION_START,
    ...Array.from({ length: total - 2 }, () => VALIDATION_COMPLETED),
    VALIDATION_COMPLETED,
  ];
}

function createService(
  overrides: Partial<DeterministicReplayValidationServiceDependencies> & {
    clockTimes?: string[];
    iterations?: number;
  } = {},
): {
  service: DeterministicReplayValidationService;
  dataset: HistoricalDataset;
  configuration: DeterministicReplayConfiguration;
} {
  const { clockTimes, iterations, ...dependencyOverrides } = overrides;
  const dataset =
    (dependencyOverrides.dataset as HistoricalDataset | null | undefined) ?? defaultDataset();
  const configuration =
    (dependencyOverrides.configuration as DeterministicReplayConfiguration | null | undefined) ??
    defaultConfiguration({ iterations: iterations ?? 3 });
  const replayClockTimesArray = [...REPLAY_CLOCK_TIMES];
  const clock =
    dependencyOverrides.clock ??
    createClock(
      clockTimes ??
        validationClockTimes((configuration as DeterministicReplayConfiguration).iterations),
    );

  const service = DeterministicReplayValidationService.create({
    createSessionId: () => `${VALIDATION_ID}-session`,
    createRuntimeId: () => `${VALIDATION_ID}-runtime`,
    createClock: () => createClock(replayClockTimesArray),
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    dataset: dependencyOverrides.dataset === undefined ? dataset : dependencyOverrides.dataset,
    configuration:
      dependencyOverrides.configuration === undefined
        ? configuration
        : dependencyOverrides.configuration,
    clock,
  });

  return { service, dataset, configuration };
}

function sampleResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return createExecutionResult({
    sessionId: `${VALIDATION_ID}-session`,
    runnerStatus: RunnerStatus.STOPPED,
    executionStatus: ExecutionStatus.COMPLETED,
    cyclesExecuted: 3,
    startedAt: REPLAY_CLOCK_TIMES[0]!,
    completedAt: REPLAY_CLOCK_TIMES[7]!,
    duration: 7_000,
    eventsPublished: 4,
    errors: [],
    datasetId: DATASET_ID,
    candlesProcessed: 3,
    replayCompleted: true,
    ...overrides,
  });
}

function sampleEvents(): HistoricalReplayEvent[] {
  return [
    Object.freeze({
      eventType: 'HistoricalReplayStarted',
      sessionId: null,
      occurredAt: REPLAY_CLOCK_TIMES[0]!,
      datasetId: DATASET_ID,
      candlesToProcess: 3,
    }),
    Object.freeze({
      eventType: 'HistoricalReplayCompleted',
      sessionId: `${VALIDATION_ID}-session`,
      occurredAt: REPLAY_CLOCK_TIMES[7]!,
      datasetId: DATASET_ID,
      candlesProcessed: 3,
      cyclesExecuted: 3,
      completedAt: REPLAY_CLOCK_TIMES[7]!,
    }),
    Object.freeze({
      eventType: 'HistoricalReplayFinished',
      sessionId: `${VALIDATION_ID}-session`,
      occurredAt: REPLAY_CLOCK_TIMES[7]!,
      datasetId: DATASET_ID,
      replayCompleted: true,
      finishedAt: REPLAY_CLOCK_TIMES[7]!,
    }),
  ];
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US197 DeterministicReplayConfiguration', () => {
  it('creates an immutable configuration', () => {
    const configuration = defaultConfiguration();
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(Object.isFrozen(configuration.replayConfiguration)).toBe(true);
    expect(configuration).toMatchObject({
      validationId: VALIDATION_ID,
      iterations: 3,
      rejectOnMismatch: false,
    });
  });

  it('rejects iterations below 2 and invalid replay configuration', () => {
    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: VALIDATION_ID,
        replayConfiguration: { datasetId: DATASET_ID, endIndex: 2 },
        iterations: 1,
      }),
    ).toThrow('iterations must be an integer greater than or equal to 2');

    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: ' ',
        replayConfiguration: { datasetId: DATASET_ID, endIndex: 2 },
        iterations: 2,
      }),
    ).toThrow('validationId is required');

    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: 197 as unknown as string,
        replayConfiguration: { datasetId: DATASET_ID, endIndex: 2 },
        iterations: 2,
      }),
    ).toThrow('validationId is required');

    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: VALIDATION_ID,
        replayConfiguration: { datasetId: ' ', endIndex: 2 },
        iterations: 2,
      }),
    ).toThrow('datasetId is required');

    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: VALIDATION_ID,
        replayConfiguration: { datasetId: DATASET_ID, endIndex: 2 },
        iterations: '2' as unknown as number,
      }),
    ).toThrow('iterations must be an integer greater than or equal to 2');

    vi.spyOn(historicalReplayModule, 'createReplayConfiguration').mockImplementation(() => {
      throw 'non-error-replay-config';
    });
    expect(() =>
      createDeterministicReplayConfiguration({
        validationId: VALIDATION_ID,
        replayConfiguration: { datasetId: DATASET_ID, endIndex: 2 },
        iterations: 2,
      }),
    ).toThrow('non-error-replay-config');
    vi.restoreAllMocks();
  });
});

describe('US197 ReplayMismatch', () => {
  it('creates an immutable mismatch', () => {
    const mismatch = createReplayMismatch({
      iteration: 2,
      field: 'cyclesExecuted',
      expected: 3,
      actual: 2,
    });
    expect(Object.isFrozen(mismatch)).toBe(true);
    expect(mismatch).toEqual({
      iteration: 2,
      field: 'cyclesExecuted',
      expected: 3,
      actual: 2,
    });
  });

  it('rejects invalid iteration and empty field', () => {
    expect(() =>
      createReplayMismatch({
        iteration: 1,
        field: 'cyclesExecuted',
        expected: 3,
        actual: 2,
      }),
    ).toThrow('iteration must be an integer greater than or equal to 2');

    expect(() =>
      createReplayMismatch({
        iteration: 2,
        field: ' ',
        expected: 3,
        actual: 2,
      }),
    ).toThrow('field is required');

    expect(() =>
      createReplayMismatch({
        iteration: 2,
        field: 123 as unknown as string,
        expected: 3,
        actual: 2,
      }),
    ).toThrow('field is required');
  });
});

describe('US197 DeterministicReplayValidationResult', () => {
  it('creates an immutable validation result', () => {
    const baseline = sampleResult();
    const result = createDeterministicReplayValidationResult({
      validationId: VALIDATION_ID,
      iterations: 3,
      successfulIterations: 3,
      failedIterations: 0,
      deterministic: true,
      mismatches: [],
      baselineResult: baseline,
      comparedResults: [baseline, baseline],
      startedAt: VALIDATION_START,
      completedAt: VALIDATION_COMPLETED,
      duration: 300_000,
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.mismatches)).toBe(true);
    expect(Object.isFrozen(result.comparedResults)).toBe(true);
  });

  it('rejects invalid result fields', () => {
    const baseline = sampleResult();
    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: ' ',
        iterations: 3,
        successfulIterations: 3,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('validationId is required');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: 197 as unknown as string,
        iterations: 3,
        successfulIterations: 3,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('validationId is required');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: VALIDATION_ID,
        iterations: 0,
        successfulIterations: 3,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('iterations must be a positive integer');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: VALIDATION_ID,
        iterations: 3,
        successfulIterations: -1,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('successfulIterations must be a non-negative integer');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: VALIDATION_ID,
        iterations: 3,
        successfulIterations: 3,
        failedIterations: -1,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('failedIterations must be a non-negative integer');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: VALIDATION_ID,
        iterations: 3,
        successfulIterations: 3,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: 'invalid',
        completedAt: VALIDATION_COMPLETED,
        duration: 0,
      }),
    ).toThrow('startedAt must be an ISO-8601 UTC timestamp');

    expect(() =>
      createDeterministicReplayValidationResult({
        validationId: VALIDATION_ID,
        iterations: 3,
        successfulIterations: 3,
        failedIterations: 0,
        deterministic: true,
        mismatches: [],
        baselineResult: baseline,
        comparedResults: [],
        startedAt: VALIDATION_START,
        completedAt: VALIDATION_COMPLETED,
        duration: -1,
      }),
    ).toThrow('duration must be a non-negative integer');
  });
});

describe('US197 DeterministicReplayValidationMetrics', () => {
  it('rejects invalid metric fields', async () => {
    const { createDeterministicReplayValidationMetrics } =
      await import('./deterministic-replay-validation-metrics');

    expect(() =>
      createDeterministicReplayValidationMetrics({
        iterations: 0,
        successfulIterations: 0,
        failedIterations: 0,
        replayCount: 0,
        validationDuration: 0,
      }),
    ).toThrow('iterations must be a positive integer');

    expect(() =>
      createDeterministicReplayValidationMetrics({
        iterations: 2,
        successfulIterations: -1,
        failedIterations: 0,
        replayCount: 0,
        validationDuration: 0,
      }),
    ).toThrow('successfulIterations must be a non-negative integer');

    expect(() =>
      createDeterministicReplayValidationMetrics({
        iterations: 2,
        successfulIterations: 0,
        failedIterations: -1,
        replayCount: 0,
        validationDuration: 0,
      }),
    ).toThrow('failedIterations must be a non-negative integer');
  });
});

describe('US197 compareReplayToBaseline', () => {
  it('returns no mismatches for identical replays', () => {
    const baseline = sampleResult();
    const events = sampleEvents();
    const mismatches = compareReplayToBaseline(2, baseline, events, baseline, events);
    expect(mismatches).toEqual([]);
  });

  it('detects a single execution field mismatch', () => {
    const baseline = sampleResult();
    const candidate = sampleResult({ cyclesExecuted: 2 });
    const events = sampleEvents();

    const mismatches = compareReplayToBaseline(2, baseline, events, candidate, events);

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      iteration: 2,
      field: 'cyclesExecuted',
      expected: 3,
      actual: 2,
    });
  });

  it('detects execution order and application event mismatches', () => {
    const baseline = sampleResult();
    const candidate = sampleResult();
    const baselineEvents = sampleEvents();
    const candidateEvents = [
      baselineEvents[0]!,
      Object.freeze({
        ...baselineEvents[1]!,
        cyclesExecuted: 2,
      }),
      baselineEvents[2]!,
    ];

    const mismatches = compareReplayToBaseline(
      3,
      baseline,
      baselineEvents,
      candidate,
      candidateEvents,
    );

    expect(mismatches.some((mismatch) => mismatch.field === 'executionOrder')).toBe(false);
    expect(mismatches.some((mismatch) => mismatch.field === 'applicationEvents[1]')).toBe(true);
    expect(executionOrder(baselineEvents)).toEqual([
      'HistoricalReplayStarted',
      'HistoricalReplayCompleted',
      'HistoricalReplayFinished',
    ]);
    expect(stableReplayEvent(baselineEvents[0]!)).toMatchObject({
      eventType: 'HistoricalReplayStarted',
      datasetId: DATASET_ID,
      candlesToProcess: 3,
    });
    expect(comparableExecutionSnapshot(baseline)).toEqual({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 3,
      candlesProcessed: 3,
      replayCompleted: true,
      datasetId: DATASET_ID,
    });
  });

  it('detects nested array differences inside application events', () => {
    const baseline = sampleResult();
    const candidate = sampleResult();
    const baselineEvents = [
      Object.freeze({
        eventType: 'HistoricalReplayStarted',
        sessionId: null,
        occurredAt: REPLAY_CLOCK_TIMES[0]!,
        datasetId: DATASET_ID,
        candlesToProcess: 3,
        markers: ['a', 'b'],
      }),
    ] as unknown as HistoricalReplayEvent[];
    const candidateEvents = [
      Object.freeze({
        eventType: 'HistoricalReplayStarted',
        sessionId: null,
        occurredAt: REPLAY_CLOCK_TIMES[0]!,
        datasetId: DATASET_ID,
        candlesToProcess: 3,
        markers: ['a', 'c'],
      }),
    ] as unknown as HistoricalReplayEvent[];

    const elementMismatches = compareReplayToBaseline(
      2,
      baseline,
      baselineEvents,
      candidate,
      candidateEvents,
    );
    expect(elementMismatches.some((mismatch) => mismatch.field === 'applicationEvents[0]')).toBe(
      true,
    );

    const lengthMismatches = compareReplayToBaseline(2, baseline, baselineEvents, candidate, [
      Object.freeze({
        eventType: 'HistoricalReplayStarted',
        sessionId: null,
        occurredAt: REPLAY_CLOCK_TIMES[0]!,
        datasetId: DATASET_ID,
        candlesToProcess: 3,
        markers: ['a'],
      }),
    ] as unknown as HistoricalReplayEvent[]);
    expect(lengthMismatches.some((mismatch) => mismatch.field === 'applicationEvents[0]')).toBe(
      true,
    );

    const typeMismatches = compareReplayToBaseline(2, baseline, baselineEvents, candidate, [
      Object.freeze({
        eventType: 'HistoricalReplayStarted',
        sessionId: null,
        occurredAt: REPLAY_CLOCK_TIMES[0]!,
        datasetId: DATASET_ID,
        candlesToProcess: 3,
        markers: 'not-an-array',
      }),
    ] as unknown as HistoricalReplayEvent[]);
    expect(typeMismatches.some((mismatch) => mismatch.field === 'applicationEvents[0]')).toBe(true);
  });

  it('detects execution order mismatches and missing events', () => {
    const baseline = sampleResult();
    const candidate = sampleResult();
    const baselineEvents = sampleEvents();
    const reorderedEvents = [baselineEvents[0]!, baselineEvents[2]!, baselineEvents[1]!];

    const orderMismatches = compareReplayToBaseline(
      2,
      baseline,
      baselineEvents,
      candidate,
      reorderedEvents,
    );
    expect(orderMismatches.some((mismatch) => mismatch.field === 'executionOrder')).toBe(true);

    const missingEventMismatches = compareReplayToBaseline(
      2,
      baseline,
      baselineEvents,
      candidate,
      baselineEvents.slice(0, 2),
    );
    expect(
      missingEventMismatches.some((mismatch) => mismatch.field === 'applicationEvents[2]'),
    ).toBe(true);
  });

  it('does not compare execution duration', () => {
    const baseline = sampleResult({ duration: 1_000 });
    const candidate = sampleResult({ duration: 9_999 });
    const events = sampleEvents();

    const mismatches = compareReplayToBaseline(2, baseline, events, candidate, events);
    expect(mismatches).toEqual([]);
  });
});

describe('US197 DeterministicReplayValidationService validation', () => {
  it('rejects null dataset, empty dataset, and null configuration', () => {
    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: null,
        configuration: defaultConfiguration(),
      }),
    ).toThrow('dataset is required');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: undefined as unknown as HistoricalDataset,
        configuration: defaultConfiguration(),
      }),
    ).toThrow('dataset is required');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: Object.freeze({
          datasetId: DATASET_ID,
          symbol: 'BTCUSDT',
          timeframe: Timeframe.M5,
          candles: Object.freeze([]),
        }) as HistoricalDataset,
        configuration: defaultConfiguration(),
      }),
    ).toThrow('dataset must not be empty');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: null,
      }),
    ).toThrow('configuration is required');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: undefined as unknown as DeterministicReplayConfiguration,
      }),
    ).toThrow('configuration is required');
  });

  it('wraps non-error configuration factory failures', () => {
    vi.mocked(configurationModule.createDeterministicReplayConfiguration).mockImplementationOnce(
      () => {
        throw 'non-error-config';
      },
    );

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration(),
      }),
    ).toThrow('non-error-config');
  });

  it('rejects iterations below 2 and dataset id mismatch', () => {
    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration({ iterations: 1 }),
      }),
    ).toThrow('iterations must be an integer greater than or equal to 2');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration({
          replayConfiguration: createReplayConfiguration({
            datasetId: 'other-dataset',
            endIndex: 2,
          }),
        }),
      }),
    ).toThrow('configuration datasetId mismatch');
  });

  it('rejects null and invalid strategy factories', () => {
    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration(),
        createStrategy: null,
      }),
    ).toThrow('strategy is required');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration(),
        createStrategy: 'not-a-function' as unknown as () => never,
      }),
    ).toThrow('invalid strategy');
  });

  it('rejects empty workspaceId and strategyId', () => {
    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration(),
        workspaceId: ' ',
      }),
    ).toThrow('workspaceId is required');

    expect(() =>
      DeterministicReplayValidationService.create({
        dataset: defaultDataset(),
        configuration: defaultConfiguration(),
        strategyId: ' ',
      }),
    ).toThrow('strategyId is required');
  });
});

describe('US197 DeterministicReplayValidationService execution', () => {
  it('executes multiple iterations and validates deterministic replay behavior', async () => {
    const { service } = createService({ iterations: 3 });
    const result = await service.execute();

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toMatchObject({
      validationId: VALIDATION_ID,
      iterations: 3,
      successfulIterations: 3,
      failedIterations: 0,
      deterministic: true,
    });
    expect(result.mismatches).toEqual([]);
    expect(result.comparedResults).toHaveLength(2);
    expect(result.baselineResult.executionStatus).toBe(ExecutionStatus.COMPLETED);
    expect(result.baselineResult.replayCompleted).toBe(true);
    expect(result.baselineResult.candlesProcessed).toBe(3);
  });

  it('emits validation lifecycle events', async () => {
    const { service } = createService({ iterations: 2 });
    await service.execute();

    const events = service.domainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'DeterministicValidationStarted',
      'ReplayCompared',
      'DeterministicValidationCompleted',
    ]);
    expect(events[0]).toMatchObject({
      validationId: VALIDATION_ID,
      datasetId: DATASET_ID,
      iterations: 2,
    });
    expect(events[1]).toMatchObject({
      eventType: 'ReplayCompared',
      iteration: 2,
      matched: true,
      mismatchCount: 0,
    });
    expect(events[2]).toMatchObject({
      deterministic: true,
      successfulIterations: 2,
      failedIterations: 0,
    });
  });

  it('collects validation metrics without trading metrics', async () => {
    const { service } = createService({ iterations: 3 });
    await service.execute();

    const metrics = service.metrics();
    expect(metrics).not.toBeNull();
    expect(metrics).toMatchObject({
      iterations: 3,
      successfulIterations: 3,
      failedIterations: 0,
      replayCount: 3,
    });
    expect(Number.isInteger(metrics!.validationDuration)).toBe(true);
    expect(metrics!.validationDuration).toBeGreaterThanOrEqual(0);
    expect(metrics).not.toHaveProperty('pnl');
    expect(metrics).not.toHaveProperty('sharpe');
  });
});

describe('US197 DeterministicReplayValidationService comparison logic', () => {
  it('returns deterministic false for a single mismatch without rejecting', async () => {
    let replayCount = 0;
    const { service } = createService({
      iterations: 2,
      createReplayService: (iteration, dependencies) => {
        const replay = HistoricalReplayService.create(dependencies);
        return {
          async execute() {
            replayCount += 1;
            const result = await replay.execute();
            if (iteration === 2) {
              return createExecutionResult({
                ...result,
                cyclesExecuted: result.cyclesExecuted - 1,
              });
            }
            return result;
          },
          domainEvents: () => replay.domainEvents(),
        } as unknown as HistoricalReplayService;
      },
    });

    const result = await service.execute();
    expect(result.deterministic).toBe(false);
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.field).toBe('cyclesExecuted');
    expect(replayCount).toBe(2);
    expect(service.domainEvents().at(-1)?.eventType).toBe('DeterministicValidationCompleted');
  });

  it('rejects mismatches when rejectOnMismatch is enabled', async () => {
    const { service } = createService({
      iterations: 2,
      configuration: defaultConfiguration({ iterations: 2, rejectOnMismatch: true }),
      createReplayService: (iteration, dependencies) => {
        const replay = HistoricalReplayService.create(dependencies);
        return {
          async execute() {
            const result = await replay.execute();
            if (iteration === 2) {
              return createExecutionResult({
                ...result,
                candlesProcessed: 0,
              });
            }
            return result;
          },
          domainEvents: () => replay.domainEvents(),
        } as unknown as HistoricalReplayService;
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationMismatchError,
    );
    expect(service.lastResult()?.deterministic).toBe(false);
    expect(service.domainEvents().at(-1)?.eventType).toBe('DeterministicValidationFailed');
  });
});

describe('US197 DeterministicReplayValidationService failure propagation', () => {
  it('propagates replay failure and emits DeterministicValidationFailed', async () => {
    const { service } = createService({
      iterations: 2,
      createReplayService: (iteration, dependencies) => {
        const replay = HistoricalReplayService.create(dependencies);
        return {
          async execute() {
            if (iteration === 2) {
              return createExecutionResult({
                sessionId: `${VALIDATION_ID}-session`,
                runnerStatus: RunnerStatus.STOPPED,
                executionStatus: ExecutionStatus.FAILED,
                cyclesExecuted: 0,
                startedAt: REPLAY_CLOCK_TIMES[0]!,
                completedAt: REPLAY_CLOCK_TIMES[1]!,
                duration: 1_000,
                eventsPublished: 0,
                errors: ['forced failure'],
                datasetId: DATASET_ID,
                candlesProcessed: 0,
                replayCompleted: false,
              });
            }
            return replay.execute();
          },
          domainEvents: () => replay.domainEvents(),
        } as unknown as HistoricalReplayService;
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationReplayFailedError,
    );
    expect(service.lastResult()?.failedIterations).toBe(1);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'DeterministicValidationFailed',
      iteration: 2,
    });
  });

  it('uses a placeholder baseline when the first replay fails', async () => {
    const { service } = createService({
      iterations: 2,
      createReplayService: () => {
        throw 'raw-replay-failure';
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationReplayFailedError,
    );
    expect(service.lastResult()?.baselineResult.sessionId).toBe(`${VALIDATION_ID}-placeholder`);
  });

  it('maps historical replay validation errors from replay startup', async () => {
    const { service } = createService({
      iterations: 2,
      createReplayService: () => {
        throw new HistoricalReplayValidationError('invalid replay');
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationValidationError,
    );
  });

  it('rejects invalid strategy instances returned at runtime', async () => {
    const { service } = createService({
      iterations: 2,
      createStrategy: () => null as unknown as ReturnType<CreateDeterministicReplayStrategy>,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationValidationError,
    );
  });

  it('wraps generic replay errors and non-error finalize failures', async () => {
    const generic = createService({
      iterations: 2,
      createReplayService: () => {
        throw new Error('generic replay failure');
      },
    });
    await expect(generic.service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationReplayFailedError,
    );

    let calls = 0;
    const finalize = createService({
      iterations: 2,
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw new Error('finalize-error');
        }
        return createDeterministicReplayValidationResult(properties);
      },
    });
    await expect(finalize.service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationExecutionFailedError,
    );
  });

  it('wraps unknown finalize failures as execution failed errors', async () => {
    let calls = 0;
    const { service } = createService({
      iterations: 2,
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw 'finalize-raw';
        }
        return createDeterministicReplayValidationResult(properties);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationExecutionFailedError,
    );
  });
});

describe('US197 DeterministicReplayValidationService idempotency', () => {
  it('returns the same result on repeated execute()', async () => {
    const { service } = createService({ iterations: 2 });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);
  });

  it('produces identical outcomes across independent validations', async () => {
    const dataset = defaultDataset();
    const configuration = defaultConfiguration({ iterations: 2 });
    const clockTimes = validationClockTimes(2);

    const first = createService({
      dataset,
      configuration,
      clockTimes,
    }).service;
    const second = createService({
      dataset,
      configuration,
      clockTimes,
    }).service;

    const a = await first.execute();
    const b = await second.execute();

    expect(stableValidation(a)).toEqual(stableValidation(b));
    expect(first.domainEvents()).toEqual(second.domainEvents());
    expect(first.metrics()).toEqual(second.metrics());
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const { service } = createService({ iterations: 2, rejectOnRepeat: true });
    await service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationAlreadyCompletedError,
    );
  });

  it('rejects concurrent execute to avoid duplicate validations', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const { service } = createService({
      iterations: 2,
      createReplayService: (_iteration, dependencies) => {
        const replay = HistoricalReplayService.create(dependencies);
        return {
          async execute() {
            await gate;
            return replay.execute();
          },
          domainEvents: () => replay.domainEvents(),
        } as unknown as HistoricalReplayService;
      },
    });

    const pending = service.execute();
    await Promise.resolve();
    await expect(service.execute()).rejects.toBeInstanceOf(
      DeterministicReplayValidationDuplicateExecutionError,
    );
    release();
    await pending;
  });
});

describe('US197 DeterministicReplayValidationService error codes', () => {
  it('exposes typed application error codes', () => {
    expect(new DeterministicReplayValidationValidationError('x').code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_VALIDATION',
    );
    expect(new DeterministicReplayValidationAlreadyCompletedError('x').code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_ALREADY_COMPLETED',
    );
    expect(new DeterministicReplayValidationDuplicateExecutionError().code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_DUPLICATE_EXECUTION',
    );
    expect(new DeterministicReplayValidationReplayFailedError(2).code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_REPLAY_FAILED',
    );
    expect(new DeterministicReplayValidationMismatchError('x', 1).code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_MISMATCH',
    );
    expect(new DeterministicReplayValidationExecutionFailedError('x').code).toBe(
      'DETERMINISTIC_REPLAY_VALIDATION_EXECUTION_FAILED',
    );
  });

  it('does not remount deterministic validation errors when mapping replay failures', async () => {
    const { service } = createService({
      iterations: 2,
      createReplayService: () => {
        throw new DeterministicReplayValidationValidationError('already mapped');
      },
    });

    await expect(service.execute()).rejects.toMatchObject({
      message: 'already mapped',
      code: 'DETERMINISTIC_REPLAY_VALIDATION_VALIDATION',
    });
  });
});

describe('US197 DeterministicReplayValidationService defaults', () => {
  it('uses default clock and identity factories', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T15:00:00.000Z'));

    const dataset = defaultDataset();
    const service = DeterministicReplayValidationService.create({
      dataset,
      configuration: defaultConfiguration({ iterations: 2 }),
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
    });

    const result = await service.execute();
    expect(result.baselineResult.sessionId).toContain(VALIDATION_ID);
    expect(result.startedAt).toBe('2026-07-20T15:00:00.000Z');
  });

  it('supports a custom strategy factory', async () => {
    const { service, dataset, configuration } = createService({
      iterations: 2,
      createStrategy: (provider) =>
        HistoricalReplayStrategy.create({ marketDataProvider: provider }),
    });

    const result = await service.execute();
    expect(result.successfulIterations).toBe(2);
    expect(service.validationConfiguration()).toEqual(configuration);
    expect(service.historicalDataset()).toBe(dataset);
  });
});

describe('ADR-019 DeterministicReplayValidationService EventEmissionFailure (Contract B)', () => {
  function createFailingService(): DeterministicReplayValidationService {
    const dataset = defaultDataset();
    return DeterministicReplayValidationService.create({
      dataset,
      configuration: defaultConfiguration({ iterations: 2 }),
      createSessionId: () => `${VALIDATION_ID}-session`,
      createRuntimeId: () => `${VALIDATION_ID}-runtime`,
      createClock: () => createClock([...REPLAY_CLOCK_TIMES]),
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      clock: createClock(validationClockTimes(2)),
      applicationEventNotifier: createEventEmissionFailingNotifier(DETERMINISTIC_COMPLETION_EVENTS),
    });
  }

  it('preserves completed execution when completion notifications throw', async () => {
    const service = createFailingService();

    const result = await service.execute();

    expect(result.successfulIterations).toBe(2);
    expect(result.failedIterations).toBe(0);
    expect(result.deterministic).toBe(true);
    expect(service.eventEmissionDiagnostics().length).toBeGreaterThan(0);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'DeterministicValidationStarted',
    ]);
    expect(service.metrics()?.failedIterations).toBe(0);
  });

  it('caches the completed result after notification failure', async () => {
    const service = createFailingService();

    const result = await service.execute();
    expect(await service.execute()).toBe(result);
    expect(result.successfulIterations).toBe(2);
  });

  it('produces identical execution results on repeated notification failure', async () => {
    const first = createFailingService();
    const second = createFailingService();

    expect(stableValidation(await first.execute())).toEqual(
      stableValidation(await second.execute()),
    );
    expect(first.eventEmissionDiagnostics()).toEqual(second.eventEmissionDiagnostics());
  });
});

function stableValidation(result: ReturnType<typeof createDeterministicReplayValidationResult>) {
  return {
    validationId: result.validationId,
    iterations: result.iterations,
    successfulIterations: result.successfulIterations,
    failedIterations: result.failedIterations,
    deterministic: result.deterministic,
    mismatches: result.mismatches,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    duration: result.duration,
    baselineResult: stableReplay(result.baselineResult),
    comparedResults: result.comparedResults.map(stableReplay),
  };
}

function stableReplay(result: ExecutionResult) {
  return {
    executionStatus: result.executionStatus,
    cyclesExecuted: result.cyclesExecuted,
    datasetId: result.datasetId,
    candlesProcessed: result.candlesProcessed,
    replayCompleted: result.replayCompleted,
    errors: result.errors,
  };
}
