import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createHistoricalCandle,
  createHistoricalDataset,
  HistoricalMarketDataProvider,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  HistoricalReplayValidationError,
  type HistoricalCandle,
  type HistoricalDataset,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import { ExecutionStatus, type ExecutionResult } from '../smoke-backtest';
import {
  createEventEmissionFailingNotifier,
  WALK_FORWARD_COMPLETION_EVENTS,
} from '../chaos-testing';
import { RunnerStatus } from '../paper-trading-runner';
import {
  createReplayWindow,
  createWalkForwardConfiguration,
  createWalkForwardMetrics,
  createWalkForwardResult,
  generateReplayWindows,
  WalkForwardAlreadyCompletedError,
  WalkForwardDuplicateExecutionError,
  WalkForwardExecutionFailedError,
  WalkForwardReplayFailedError,
  WalkForwardValidationError,
  WalkForwardValidationService,
  walkForwardWindowLength,
  type WalkForwardConfiguration,
  type WalkForwardValidationServiceDependencies,
} from './index';

const WF_START = '2026-07-20T12:00:00.000Z';
const WF_COMPLETED = '2026-07-20T12:10:00.000Z';
const EXECUTION_ID = 'wf-execution-194';
const DATASET_ID = 'btc-m5-walk-forward';

function createClock(times: string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function candleAt(minutes: number): HistoricalCandle {
  const hour = 20 + Math.floor(minutes / 60);
  const minute = minutes % 60;
  const timestamp = `2026-07-19T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
  return createHistoricalCandle({
    timestamp,
    open: 100 + minutes,
    high: 110 + minutes,
    low: 95 + minutes,
    close: 105 + minutes,
    volume: 1_000 + minutes,
  });
}

function datasetWithCandles(count: number): HistoricalDataset {
  const candles = Array.from({ length: count }, (_, index) => candleAt(index * 5));
  return createHistoricalDataset({
    datasetId: DATASET_ID,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles,
  });
}

function defaultConfiguration(
  overrides: Partial<WalkForwardConfiguration> = {},
): WalkForwardConfiguration {
  return createWalkForwardConfiguration({
    datasetId: DATASET_ID,
    trainingWindow: 2,
    validationWindow: 2,
    stepSize: 4,
    overlap: 0,
    maximumWindows: 10,
    ...overrides,
  });
}

function createService(
  overrides: Partial<WalkForwardValidationServiceDependencies> & {
    candleCount?: number;
    clockTimes?: string[];
  } = {},
): {
  service: WalkForwardValidationService;
  dataset: HistoricalDataset;
  configuration: WalkForwardConfiguration;
} {
  const { candleCount, clockTimes, ...dependencyOverrides } = overrides;
  const dataset =
    (dependencyOverrides.dataset as HistoricalDataset | null | undefined) ??
    datasetWithCandles(candleCount ?? 12);
  const configuration =
    (dependencyOverrides.configuration as WalkForwardConfiguration | null | undefined) ??
    defaultConfiguration();
  const clock =
    dependencyOverrides.clock ??
    createClock(clockTimes ?? [WF_START, ...Array.from({ length: 80 }, () => WF_COMPLETED)]);

  const service = WalkForwardValidationService.create({
    createExecutionId: () => EXECUTION_ID,
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

afterEach(() => {
  vi.useRealTimers();
});

describe('US194 WalkForwardConfiguration', () => {
  it('creates an immutable configuration and derives window length', () => {
    const configuration = defaultConfiguration();
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(walkForwardWindowLength(configuration)).toBe(4);
    expect(configuration).toMatchObject({
      datasetId: DATASET_ID,
      trainingWindow: 2,
      validationWindow: 2,
      stepSize: 4,
      overlap: 0,
      maximumWindows: 10,
    });
  });

  it('rejects invalid window size, overlap, step size, and empty dataset id', () => {
    expect(() =>
      createWalkForwardConfiguration({
        datasetId: ' ',
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 4,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow('datasetId is required');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: 123 as unknown as string,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 4,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow('datasetId is required');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 0,
        validationWindow: 2,
        stepSize: 4,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow('trainingWindow must be a positive integer');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: -1,
        stepSize: 4,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow('validationWindow must be a positive integer');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 0,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow('stepSize must be a positive integer');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 4,
        overlap: -1,
        maximumWindows: 1,
      }),
    ).toThrow('overlap must be a non-negative integer');

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 2,
        overlap: 0,
        maximumWindows: 1,
      }),
    ).toThrow(/invalid overlap/);

    expect(() =>
      createWalkForwardConfiguration({
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 2,
        overlap: 2,
        maximumWindows: 0,
      }),
    ).toThrow('maximumWindows must be a positive integer');
  });

  it('accepts overlapping windows when overlap matches step size', () => {
    const configuration = createWalkForwardConfiguration({
      datasetId: DATASET_ID,
      trainingWindow: 3,
      validationWindow: 1,
      stepSize: 2,
      overlap: 2,
      maximumWindows: 5,
    });
    expect(configuration.overlap).toBe(2);
  });
});

describe('US194 ReplayWindow', () => {
  it('creates immutable windows and rejects invalid indices', () => {
    const window = createReplayWindow({
      windowId: 'window-0',
      startIndex: 0,
      endIndex: 3,
      datasetId: DATASET_ID,
    });
    expect(Object.isFrozen(window)).toBe(true);

    expect(() =>
      createReplayWindow({
        windowId: ' ',
        startIndex: 0,
        endIndex: 1,
        datasetId: DATASET_ID,
      }),
    ).toThrow('windowId is required');

    expect(() =>
      createReplayWindow({
        windowId: 'w',
        startIndex: 5,
        endIndex: 1,
        datasetId: DATASET_ID,
      }),
    ).toThrow('startIndex must be less than or equal to endIndex');

    expect(() =>
      createReplayWindow({
        windowId: 'w',
        startIndex: -1,
        endIndex: 1,
        datasetId: DATASET_ID,
      }),
    ).toThrow('startIndex must be a non-negative integer');

    expect(() =>
      createReplayWindow({
        windowId: 'w',
        startIndex: 0,
        endIndex: 1,
        datasetId: ' ',
      }),
    ).toThrow('datasetId is required');
  });
});

describe('US194 window generation', () => {
  it('generates deterministic non-overlapping windows', () => {
    const dataset = datasetWithCandles(12);
    const configuration = defaultConfiguration({ maximumWindows: 10 });
    const windows = generateReplayWindows(dataset, configuration);

    expect(windows).toEqual([
      {
        windowId: 'window-0',
        startIndex: 0,
        endIndex: 3,
        datasetId: DATASET_ID,
      },
      {
        windowId: 'window-1',
        startIndex: 4,
        endIndex: 7,
        datasetId: DATASET_ID,
      },
      {
        windowId: 'window-2',
        startIndex: 8,
        endIndex: 11,
        datasetId: DATASET_ID,
      },
    ]);
    expect(Object.isFrozen(windows)).toBe(true);
  });

  it('respects maximumWindows and overlapping step size', () => {
    const dataset = datasetWithCandles(10);
    const configuration = createWalkForwardConfiguration({
      datasetId: DATASET_ID,
      trainingWindow: 2,
      validationWindow: 2,
      stepSize: 2,
      overlap: 2,
      maximumWindows: 2,
    });
    const windows = generateReplayWindows(dataset, configuration);
    expect(windows).toEqual([
      {
        windowId: 'window-0',
        startIndex: 0,
        endIndex: 3,
        datasetId: DATASET_ID,
      },
      {
        windowId: 'window-1',
        startIndex: 2,
        endIndex: 5,
        datasetId: DATASET_ID,
      },
    ]);
  });

  it('rejects empty dataset, dataset mismatch, and zero windows', () => {
    const dataset = datasetWithCandles(3);
    const configuration = defaultConfiguration();

    expect(() =>
      generateReplayWindows(
        {
          ...dataset,
          candles: Object.freeze([]),
        },
        configuration,
      ),
    ).toThrow('dataset must not be empty');

    expect(() =>
      generateReplayWindows(dataset, {
        ...configuration,
        datasetId: 'other',
      }),
    ).toThrow('configuration datasetId mismatch');

    expect(() => generateReplayWindows(dataset, configuration)).toThrow('zero windows generated');
  });

  it('rejects generated windows that violate the overlap policy', () => {
    const dataset = datasetWithCandles(12);

    expect(() =>
      generateReplayWindows(dataset, {
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 2,
        overlap: 0,
        maximumWindows: 2,
      }),
    ).toThrow('windows must not overlap when overlap is 0');

    expect(() =>
      generateReplayWindows(dataset, {
        datasetId: DATASET_ID,
        trainingWindow: 2,
        validationWindow: 2,
        stepSize: 2,
        overlap: 1,
        maximumWindows: 2,
      }),
    ).toThrow(/window overlap mismatch/);
  });

  it('is deterministic across repeated generation', () => {
    const dataset = datasetWithCandles(12);
    const configuration = defaultConfiguration();
    expect(generateReplayWindows(dataset, configuration)).toEqual(
      generateReplayWindows(dataset, configuration),
    );
  });
});

describe('US194 WalkForwardResult and metrics', () => {
  it('creates immutable result and metrics aggregates', () => {
    const replay = createWalkForwardResult({
      executionId: EXECUTION_ID,
      datasetId: DATASET_ID,
      totalWindows: 1,
      completedWindows: 1,
      failedWindows: 0,
      replayResults: Object.freeze([]),
      startedAt: WF_START,
      completedAt: WF_COMPLETED,
      duration: 600_000,
    });
    expect(Object.isFrozen(replay)).toBe(true);
    expect(Object.isFrozen(replay.replayResults)).toBe(true);

    const metrics = createWalkForwardMetrics({
      windowsExecuted: 1,
      windowsFailed: 0,
      candlesProcessed: 4,
      cyclesExecuted: 4,
      executionDuration: 600_000,
    });
    expect(metrics.candlesProcessed).toBe(4);

    expect(() =>
      createWalkForwardResult({
        ...replay,
        startedAt: 'not-iso',
      }),
    ).toThrow('startedAt must be an ISO-8601 UTC timestamp');

    expect(() =>
      createWalkForwardResult({
        ...replay,
        executionId: ' ',
      }),
    ).toThrow('executionId is required');

    expect(() =>
      createWalkForwardResult({
        ...replay,
        duration: 1.5,
      }),
    ).toThrow('duration must be a non-negative integer');

    expect(() =>
      createWalkForwardMetrics({
        ...metrics,
        windowsExecuted: -1,
      }),
    ).toThrow('windowsExecuted must be a non-negative integer');
  });
});

describe('US194 WalkForwardValidationService creation', () => {
  it('creates a service and exposes windows before execution', () => {
    const { service, dataset, configuration } = createService({ candleCount: 12 });
    expect(service.historicalDataset()).toBe(dataset);
    expect(service.walkForwardConfiguration()).toEqual(configuration);
    expect(service.windows()).toHaveLength(3);
    expect(service.lastResult()).toBeNull();
    expect(service.metrics()).toBeNull();
  });

  it('rejects empty dataset, missing configuration, mismatch, and invalid strategy', () => {
    const dataset = datasetWithCandles(12);

    expect(() =>
      WalkForwardValidationService.create({
        dataset: null,
        configuration: defaultConfiguration(),
      }),
    ).toThrow(WalkForwardValidationError);

    expect(() =>
      WalkForwardValidationService.create({
        dataset: {
          ...dataset,
          candles: Object.freeze([]),
        },
        configuration: defaultConfiguration(),
      }),
    ).toThrow(/dataset must not be empty/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: null,
      }),
    ).toThrow(/configuration is required/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: {
          ...defaultConfiguration(),
          stepSize: 2,
          overlap: 0,
        },
      }),
    ).toThrow(WalkForwardValidationError);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: {
          ...defaultConfiguration(),
          datasetId: 'other',
        },
      }),
    ).toThrow(/datasetId mismatch/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: defaultConfiguration(),
        createStrategy: null,
      }),
    ).toThrow(/strategy is required/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: defaultConfiguration(),
        createStrategy:
          'nope' as unknown as WalkForwardValidationServiceDependencies['createStrategy'],
      }),
    ).toThrow(/invalid strategy/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: defaultConfiguration(),
        workspaceId: ' ',
      }),
    ).toThrow(/workspaceId is required/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset,
        configuration: defaultConfiguration(),
        strategyId: ' ',
      }),
    ).toThrow(/strategyId is required/);

    expect(() =>
      WalkForwardValidationService.create({
        dataset: datasetWithCandles(3),
        configuration: defaultConfiguration(),
      }),
    ).toThrow(/zero windows/);
  });
});

describe('US194 WalkForwardValidationService single window', () => {
  it('executes one historical replay and aggregates metadata', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
    });

    const result = await service.execute();

    expect(result).toMatchObject({
      executionId: EXECUTION_ID,
      datasetId: DATASET_ID,
      totalWindows: 1,
      completedWindows: 1,
      failedWindows: 0,
    });
    expect(result.replayResults).toHaveLength(1);
    expect(result.replayResults[0]).toMatchObject({
      executionStatus: ExecutionStatus.COMPLETED,
      runnerStatus: RunnerStatus.STOPPED,
      datasetId: DATASET_ID,
      candlesProcessed: 4,
      cyclesExecuted: 4,
      replayCompleted: true,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(service.metrics()).toEqual({
      windowsExecuted: 1,
      windowsFailed: 0,
      candlesProcessed: 4,
      cyclesExecuted: 4,
      executionDuration: result.duration,
    });
    expect(service.lastResult()).toBe(result);
  });
});

describe('US194 WalkForwardValidationService multiple windows', () => {
  it('executes windows in order with independent sessions', async () => {
    const sessionIds: string[] = [];
    const { service } = createService({
      candleCount: 12,
      createSessionId: (window, executionId) => {
        const sessionId = `${executionId}-${window.windowId}-session`;
        sessionIds.push(sessionId);
        return sessionId;
      },
    });

    const result = await service.execute();

    expect(result.totalWindows).toBe(3);
    expect(result.completedWindows).toBe(3);
    expect(result.failedWindows).toBe(0);
    expect(result.replayResults.map((item) => item.sessionId)).toEqual(sessionIds);
    expect(new Set(sessionIds).size).toBe(3);
    expect(result.replayResults.every((item) => item.candlesProcessed === 4)).toBe(true);
    expect(service.metrics()?.candlesProcessed).toBe(12);
    expect(service.metrics()?.cyclesExecuted).toBe(12);
  });

  it('emits started, per-window completed, and completed events', async () => {
    const { service } = createService({ candleCount: 8 });

    await service.execute();

    const events = service.domainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'WalkForwardStarted',
      'WalkForwardWindowCompleted',
      'WalkForwardWindowCompleted',
      'WalkForwardCompleted',
    ]);
    expect(events[0]).toMatchObject({
      eventType: 'WalkForwardStarted',
      executionId: EXECUTION_ID,
      datasetId: DATASET_ID,
      totalWindows: 2,
    });
    expect(events[1]).toMatchObject({
      eventType: 'WalkForwardWindowCompleted',
      windowId: 'window-0',
      candlesProcessed: 4,
    });
    expect(events[2]).toMatchObject({
      eventType: 'WalkForwardWindowCompleted',
      windowId: 'window-1',
      candlesProcessed: 4,
    });
    expect(events[3]).toMatchObject({
      eventType: 'WalkForwardCompleted',
      completedWindows: 2,
      failedWindows: 0,
    });
  });
});

describe('US194 WalkForwardValidationService replay integration', () => {
  it('reuses HistoricalReplayService without modification', async () => {
    const createSpy = vi.spyOn(HistoricalReplayService, 'create');
    const { service } = createService({ candleCount: 8 });

    await service.execute();

    expect(createSpy).toHaveBeenCalledTimes(2);
    for (const call of createSpy.mock.calls) {
      const dependencies = call[0];
      expect(dependencies?.dataset?.datasetId).toBe(DATASET_ID);
      expect(dependencies?.marketDataProvider).toBeInstanceOf(HistoricalMarketDataProvider);
      expect(dependencies?.strategy).toBeTruthy();
      expect(dependencies?.repository).toBeTruthy();
    }
    createSpy.mockRestore();
  });

  it('passes replay configuration windows to the market data provider', async () => {
    const configs: Array<{ startIndex: number; endIndex: number }> = [];
    const { service } = createService({
      candleCount: 8,
      createReplayService: (window, dependencies) => {
        const configuration = dependencies.configuration as {
          startIndex: number;
          endIndex: number;
        };
        configs.push({
          startIndex: configuration.startIndex,
          endIndex: configuration.endIndex,
        });
        return HistoricalReplayService.create(dependencies);
      },
    });

    await service.execute();
    expect(configs).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 4, endIndex: 7 },
    ]);
    expect(service.windows().map((window) => window.windowId)).toEqual(['window-0', 'window-1']);
  });
});

describe('US194 WalkForwardValidationService failure propagation', () => {
  it('fails the validation when a window replay fails', async () => {
    const { service } = createService({
      candleCount: 8,
      createReplayService: (window, dependencies) => {
        if (window.windowId === 'window-1') {
          return {
            async execute(): Promise<ExecutionResult> {
              throw new Error('boom');
            },
          } as unknown as HistoricalReplayService;
        }
        return HistoricalReplayService.create(dependencies);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardReplayFailedError);

    const result = service.lastResult();
    expect(result).toMatchObject({
      totalWindows: 2,
      completedWindows: 1,
      failedWindows: 1,
    });
    expect(result?.replayResults).toHaveLength(1);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'WalkForwardStarted',
      'WalkForwardWindowCompleted',
      'WalkForwardFailed',
    ]);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'WalkForwardFailed',
      windowId: 'window-1',
      reason: 'Walk forward replay failed for window: window-1',
    });
    expect(service.metrics()).toMatchObject({
      windowsExecuted: 1,
      windowsFailed: 1,
      candlesProcessed: 4,
    });
  });

  it('rejects non-completed replay execution status', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createReplayService: () =>
        ({
          async execute(): Promise<ExecutionResult> {
            return {
              sessionId: 'failed-session',
              runnerStatus: RunnerStatus.FAILED,
              executionStatus: ExecutionStatus.FAILED,
              cyclesExecuted: 0,
              startedAt: WF_START,
              completedAt: WF_COMPLETED,
              duration: 0,
              eventsPublished: 0,
              errors: Object.freeze(['runner failed']),
              datasetId: DATASET_ID,
              candlesProcessed: 0,
              replayCompleted: false,
            };
          },
        }) as unknown as HistoricalReplayService,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardReplayFailedError);
    expect(service.lastResult()?.failedWindows).toBe(1);
  });

  it('rejects invalid strategy returned by the factory', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createStrategy: () => null as unknown as ReturnType<typeof HistoricalReplayStrategy.create>,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardValidationError);
    expect(service.domainEvents().at(-1)?.eventType).toBe('WalkForwardFailed');
  });

  it('maps unexpected execution failures', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createReplayService: () => {
        throw 'raw-failure';
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardReplayFailedError);
  });

  it('maps HistoricalReplayValidationError from window setup', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createReplayService: () => {
        throw new HistoricalReplayValidationError('bad replay config');
      },
    });

    await expect(service.execute()).rejects.toMatchObject({
      message: 'bad replay config',
      code: 'WALK_FORWARD_VALIDATION',
    });
  });

  it('maps unexpected errors raised while finalizing the result', async () => {
    let calls = 0;
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw new Error('finalize failed');
        }
        return createWalkForwardResult(properties);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardExecutionFailedError);
  });

  it('maps non-error throws while finalizing the result', async () => {
    let calls = 0;
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw 'finalize-raw';
        }
        return createWalkForwardResult(properties);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardExecutionFailedError);
  });
});

describe('US194 WalkForwardValidationService idempotency', () => {
  it('returns the same result on repeated execute()', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
    });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);
  });

  it('produces identical outcomes across independent validations', async () => {
    const dataset = datasetWithCandles(8);
    const configuration = defaultConfiguration();

    const first = createService({
      dataset,
      configuration,
      createExecutionId: () => 'exec-a',
      createSessionId: (window) => `session-${window.windowId}`,
      createRuntimeId: (window) => `runtime-${window.windowId}`,
      clock: createClock([
        '2026-07-20T13:00:00.000Z',
        ...Array.from({ length: 40 }, () => '2026-07-20T13:05:00.000Z'),
      ]),
    }).service;

    const second = createService({
      dataset,
      configuration,
      createExecutionId: () => 'exec-a',
      createSessionId: (window) => `session-${window.windowId}`,
      createRuntimeId: (window) => `runtime-${window.windowId}`,
      clock: createClock([
        '2026-07-20T13:00:00.000Z',
        ...Array.from({ length: 40 }, () => '2026-07-20T13:05:00.000Z'),
      ]),
    }).service;

    const a = await first.execute();
    const b = await second.execute();

    expect(first.windows()).toEqual(second.windows());
    expect(a.replayResults.map(stableReplay)).toEqual(b.replayResults.map(stableReplay));
    expect(stableWalkForward(a)).toEqual(stableWalkForward(b));
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      rejectOnRepeat: true,
    });
    await service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardAlreadyCompletedError);
  });

  it('rejects concurrent execute to avoid duplicate runners', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createReplayService: (window, dependencies) => {
        const replay = HistoricalReplayService.create(dependencies);
        return {
          async execute() {
            await gate;
            return replay.execute();
          },
        } as unknown as HistoricalReplayService;
      },
    });

    const pending = service.execute();
    await Promise.resolve();
    await expect(service.execute()).rejects.toBeInstanceOf(WalkForwardDuplicateExecutionError);
    release();
    await pending;
  });
});

describe('US194 WalkForwardValidationService error codes', () => {
  it('exposes typed application error codes', () => {
    expect(new WalkForwardValidationError('x').code).toBe('WALK_FORWARD_VALIDATION');
    expect(new WalkForwardAlreadyCompletedError('x').code).toBe('WALK_FORWARD_ALREADY_COMPLETED');
    expect(new WalkForwardDuplicateExecutionError().code).toBe('WALK_FORWARD_DUPLICATE_EXECUTION');
    expect(new WalkForwardReplayFailedError('w0').code).toBe('WALK_FORWARD_REPLAY_FAILED');
    expect(new WalkForwardExecutionFailedError('x').code).toBe('WALK_FORWARD_EXECUTION_FAILED');
    expect(new WalkForwardReplayFailedError('w0', new Error('cause')).cause).toBeInstanceOf(Error);
  });

  it('does not remount walk-forward errors when mapping window failures', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createReplayService: () => {
        throw new WalkForwardValidationError('already mapped');
      },
    });

    await expect(service.execute()).rejects.toMatchObject({
      message: 'already mapped',
      code: 'WALK_FORWARD_VALIDATION',
    });
  });
});

describe('US194 WalkForwardValidationService defaults', () => {
  it('uses default clock and identity factories', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T14:00:00.000Z'));

    const dataset = datasetWithCandles(4);
    const service = WalkForwardValidationService.create({
      dataset,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
    });

    const result = await service.execute();
    expect(result.executionId.length).toBeGreaterThan(0);
    expect(result.replayResults[0]?.sessionId).toContain('window-0');
    expect(result.startedAt).toBe('2026-07-20T14:00:00.000Z');
  });

  it('supports a custom strategy factory', async () => {
    const { service } = createService({
      candleCount: 4,
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createStrategy: (provider) =>
        HistoricalReplayStrategy.create({ marketDataProvider: provider }),
    });

    const result = await service.execute();
    expect(result.completedWindows).toBe(1);
  });
});

describe('ADR-019 WalkForwardValidationService EventEmissionFailure (Contract B)', () => {
  function createFailingService(): WalkForwardValidationService {
    return WalkForwardValidationService.create({
      dataset: datasetWithCandles(4),
      configuration: defaultConfiguration({ maximumWindows: 1 }),
      createExecutionId: () => EXECUTION_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      clock: createClock([WF_START, ...Array.from({ length: 80 }, () => WF_COMPLETED)]),
      applicationEventNotifier: createEventEmissionFailingNotifier(WALK_FORWARD_COMPLETION_EVENTS),
    });
  }

  it('preserves completed execution when completion notifications throw', async () => {
    const service = createFailingService();

    const result = await service.execute();

    expect(result.completedWindows).toBe(1);
    expect(result.failedWindows).toBe(0);
    expect(service.eventEmissionDiagnostics().length).toBeGreaterThan(0);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual(['WalkForwardStarted']);
    expect(service.metrics()?.windowsFailed).toBe(0);
  });

  it('caches the completed result after notification failure', async () => {
    const service = createFailingService();

    const result = await service.execute();
    expect(await service.execute()).toBe(result);
    expect(result.completedWindows).toBe(1);
  });

  it('produces identical execution results on repeated notification failure', async () => {
    const first = createFailingService();
    const second = createFailingService();

    expect(stableWalkForward(await first.execute())).toEqual(
      stableWalkForward(await second.execute()),
    );
    expect(first.eventEmissionDiagnostics()).toEqual(second.eventEmissionDiagnostics());
  });
});

function stableReplay(result: ExecutionResult) {
  return {
    runnerStatus: result.runnerStatus,
    executionStatus: result.executionStatus,
    cyclesExecuted: result.cyclesExecuted,
    datasetId: result.datasetId,
    candlesProcessed: result.candlesProcessed,
    replayCompleted: result.replayCompleted,
    errors: result.errors,
  };
}

function stableWalkForward(result: ReturnType<typeof createWalkForwardResult>) {
  return {
    executionId: result.executionId,
    datasetId: result.datasetId,
    totalWindows: result.totalWindows,
    completedWindows: result.completedWindows,
    failedWindows: result.failedWindows,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    duration: result.duration,
    replayResults: result.replayResults.map(stableReplay),
  };
}
