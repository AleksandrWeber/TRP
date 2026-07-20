import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createHistoricalCandle,
  createHistoricalDataset,
  HistoricalReplayStrategy,
  type HistoricalCandle,
  type HistoricalDataset,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import { type ExecutionResult } from '../smoke-backtest';
import { createEventEmissionFailingNotifier, MULTI_YEAR_COMPLETION_EVENTS } from '../chaos-testing';
import {
  WalkForwardReplayFailedError,
  WalkForwardValidationError,
  WalkForwardValidationService,
} from '../walk-forward-validation';
import {
  createDatasetWalkForwardConfiguration,
  createMultiYearResearchConfiguration,
  createMultiYearResearchMetrics,
  createMultiYearResearchResult,
  createResearchSummary,
  MultiYearResearchAlreadyCompletedError,
  MultiYearResearchDatasetFailedError,
  MultiYearResearchDuplicateExecutionError,
  MultiYearResearchExecutionFailedError,
  MultiYearResearchService,
  MultiYearResearchValidationError,
  type MultiYearResearchServiceDependencies,
  type WalkForwardConfigurationTemplate,
} from './index';

const MYR_START = '2026-07-20T12:00:00.000Z';
const MYR_COMPLETED = '2026-07-20T12:10:00.000Z';
const RESEARCH_ID = 'research-195';
const DATASET_2022 = 'btc-2022';
const DATASET_2023 = 'btc-2023';
const DATASET_2024 = 'btc-2024';

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

function datasetWithCandles(datasetId: string, count: number): HistoricalDataset {
  const candles = Array.from({ length: count }, (_, index) => candleAt(index * 5));
  return createHistoricalDataset({
    datasetId,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles,
  });
}

function defaultWalkForwardTemplate(
  overrides: Partial<WalkForwardConfigurationTemplate> = {},
): WalkForwardConfigurationTemplate {
  return {
    trainingWindow: 2,
    validationWindow: 2,
    stepSize: 4,
    overlap: 0,
    maximumWindows: 10,
    ...overrides,
  };
}

function defaultConfiguration(
  datasets: readonly HistoricalDataset[],
  overrides: Partial<{
    researchId: string;
    walkForwardConfiguration: WalkForwardConfigurationTemplate;
    maximumParallelism: number;
    stopOnFailure: boolean;
  }> = {},
) {
  return createMultiYearResearchConfiguration({
    researchId: RESEARCH_ID,
    datasets,
    walkForwardConfiguration: defaultWalkForwardTemplate(),
    maximumParallelism: 1,
    stopOnFailure: true,
    ...overrides,
  });
}

function createService(
  overrides: Partial<MultiYearResearchServiceDependencies> & {
    datasetIds?: string[];
    candleCount?: number;
    clockTimes?: string[];
    stopOnFailure?: boolean;
  } = {},
): {
  service: MultiYearResearchService;
  datasets: HistoricalDataset[];
  configuration: ReturnType<typeof defaultConfiguration>;
} {
  const { datasetIds, candleCount, clockTimes, stopOnFailure, ...dependencyOverrides } = overrides;

  const ids = datasetIds ?? [DATASET_2022];
  const datasets = ids.map((datasetId) => datasetWithCandles(datasetId, candleCount ?? 12));
  const configuration =
    (dependencyOverrides.configuration as
      ReturnType<typeof defaultConfiguration> | null | undefined) ??
    defaultConfiguration(datasets, {
      stopOnFailure: stopOnFailure ?? true,
    });
  const clock =
    dependencyOverrides.clock ??
    createClock(clockTimes ?? [MYR_START, ...Array.from({ length: 200 }, () => MYR_COMPLETED)]);

  const service = MultiYearResearchService.create({
    createExecutionId: (dataset) => `${RESEARCH_ID}-${dataset.datasetId}`,
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    configuration:
      dependencyOverrides.configuration === undefined
        ? configuration
        : dependencyOverrides.configuration,
    clock,
  });

  return { service, datasets, configuration };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US195 MultiYearResearchConfiguration', () => {
  it('creates an immutable configuration', () => {
    const datasets = [datasetWithCandles(DATASET_2022, 12)];
    const configuration = defaultConfiguration(datasets);
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(Object.isFrozen(configuration.datasets)).toBe(true);
    expect(configuration).toMatchObject({
      researchId: RESEARCH_ID,
      maximumParallelism: 1,
      stopOnFailure: true,
    });
  });

  it('creates per-dataset walk forward configuration', () => {
    const configuration = createDatasetWalkForwardConfiguration(
      DATASET_2022,
      defaultWalkForwardTemplate(),
    );
    expect(configuration.datasetId).toBe(DATASET_2022);
    expect(configuration.trainingWindow).toBe(2);
  });

  it('rejects empty datasets, duplicate identifiers, and invalid walk forward template', () => {
    const dataset = datasetWithCandles(DATASET_2022, 12);

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('datasets must not be empty');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [dataset, dataset],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow(`duplicate dataset identifier: ${DATASET_2022}`);

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: ' ',
        datasets: [dataset],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('researchId is required');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [dataset],
        walkForwardConfiguration: {
          ...defaultWalkForwardTemplate(),
          stepSize: 0,
        },
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('stepSize must be a positive integer');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [dataset],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 0,
        stopOnFailure: true,
      }),
    ).toThrow('maximumParallelism must be a positive integer');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [
          {
            ...dataset,
            candles: Object.freeze([]),
          },
        ],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow(`dataset must not be empty: ${DATASET_2022}`);

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [datasetWithCandles(DATASET_2022, 3)],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('zero windows generated');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: null as unknown as HistoricalDataset[],
        walkForwardConfiguration: defaultWalkForwardTemplate(),
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('datasets are required');

    expect(() =>
      createMultiYearResearchConfiguration({
        researchId: RESEARCH_ID,
        datasets: [dataset],
        walkForwardConfiguration: null as unknown as WalkForwardConfigurationTemplate,
        maximumParallelism: 1,
        stopOnFailure: true,
      }),
    ).toThrow('walkForwardConfiguration is required');
  });
});

describe('US195 MultiYearResearchResult, metrics, and summary', () => {
  it('creates immutable aggregates', () => {
    const result = createMultiYearResearchResult({
      researchId: RESEARCH_ID,
      datasetsProcessed: 2,
      datasetsSucceeded: 2,
      datasetsFailed: 0,
      walkForwardResults: Object.freeze([]),
      startedAt: MYR_START,
      completedAt: MYR_COMPLETED,
      duration: 600_000,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.walkForwardResults)).toBe(true);

    const metrics = createMultiYearResearchMetrics({
      datasetsProcessed: 2,
      windowsExecuted: 6,
      candlesProcessed: 24,
      cyclesExecuted: 24,
      executionDuration: 600_000,
      failedDatasets: 0,
    });
    expect(metrics.windowsExecuted).toBe(6);

    const summary = createResearchSummary({
      researchId: RESEARCH_ID,
      datasetsProcessed: 2,
      datasetsSucceeded: 2,
      datasetsFailed: 0,
      totalWindows: 6,
      totalCandles: 24,
      totalCycles: 24,
      executionDuration: 600_000,
    });
    expect(Object.isFrozen(summary)).toBe(true);

    expect(() =>
      createMultiYearResearchResult({
        ...result,
        startedAt: 'not-iso',
      }),
    ).toThrow('startedAt must be an ISO-8601 UTC timestamp');

    expect(() =>
      createMultiYearResearchMetrics({
        ...metrics,
        failedDatasets: -1,
      }),
    ).toThrow('failedDatasets must be a non-negative integer');

    expect(() =>
      createResearchSummary({
        ...summary,
        researchId: ' ',
      }),
    ).toThrow('researchId is required');

    expect(() =>
      createMultiYearResearchResult({
        ...result,
        researchId: ' ',
      }),
    ).toThrow('researchId is required');

    expect(() =>
      createMultiYearResearchResult({
        ...result,
        duration: 1.5,
      }),
    ).toThrow('duration must be a non-negative integer');

    expect(() =>
      createMultiYearResearchResult({
        ...result,
        researchId: 123 as unknown as string,
      }),
    ).toThrow('researchId is required');

    expect(() =>
      createResearchSummary({
        ...summary,
        researchId: 123 as unknown as string,
      }),
    ).toThrow('researchId is required');

    expect(() =>
      createResearchSummary({
        ...summary,
        totalWindows: 1.5,
      }),
    ).toThrow('totalWindows must be a non-negative integer');
  });
});

describe('US195 MultiYearResearchService creation', () => {
  it('creates a service and exposes datasets before execution', () => {
    const { service, datasets, configuration } = createService({
      datasetIds: [DATASET_2022, DATASET_2023],
    });
    expect(service.datasets()).toEqual(datasets);
    expect(service.researchConfiguration()).toEqual(configuration);
    expect(service.lastResult()).toBeNull();
    expect(service.metrics()).toBeNull();
    expect(service.researchSummary()).toBeNull();
  });

  it('rejects missing configuration, invalid strategy, and empty workspace', () => {
    const datasets = [datasetWithCandles(DATASET_2022, 12)];

    expect(() =>
      MultiYearResearchService.create({
        configuration: null,
      }),
    ).toThrow(MultiYearResearchValidationError);

    expect(() =>
      MultiYearResearchService.create({
        configuration: defaultConfiguration(datasets),
        createStrategy: null,
      }),
    ).toThrow(/strategy is required/);

    expect(() =>
      MultiYearResearchService.create({
        configuration: defaultConfiguration(datasets),
        createStrategy: 'nope' as unknown as MultiYearResearchServiceDependencies['createStrategy'],
      }),
    ).toThrow(/invalid strategy/);

    expect(() =>
      MultiYearResearchService.create({
        configuration: defaultConfiguration(datasets),
        workspaceId: ' ',
      }),
    ).toThrow(/workspaceId is required/);

    expect(() =>
      MultiYearResearchService.create({
        configuration: defaultConfiguration(datasets),
        strategyId: ' ',
      }),
    ).toThrow(/strategyId is required/);

    expect(() =>
      MultiYearResearchService.create({
        configuration: {
          researchId: RESEARCH_ID,
          datasets: [],
          walkForwardConfiguration: defaultWalkForwardTemplate(),
          maximumParallelism: 1,
          stopOnFailure: true,
        },
      }),
    ).toThrow(MultiYearResearchValidationError);
  });
});

describe('US195 MultiYearResearchService single dataset', () => {
  it('executes one walk forward validation and aggregates metadata', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
    });

    const result = await service.execute();

    expect(result).toMatchObject({
      researchId: RESEARCH_ID,
      datasetsProcessed: 1,
      datasetsSucceeded: 1,
      datasetsFailed: 0,
    });
    expect(result.walkForwardResults).toHaveLength(1);
    expect(result.walkForwardResults[0]).toMatchObject({
      datasetId: DATASET_2022,
      totalWindows: 1,
      completedWindows: 1,
      failedWindows: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(service.metrics()).toEqual({
      datasetsProcessed: 1,
      windowsExecuted: 1,
      candlesProcessed: 4,
      cyclesExecuted: 4,
      executionDuration: result.duration,
      failedDatasets: 0,
    });
    expect(service.researchSummary()).toMatchObject({
      researchId: RESEARCH_ID,
      datasetsProcessed: 1,
      datasetsSucceeded: 1,
      datasetsFailed: 0,
      totalWindows: 1,
      totalCandles: 4,
      totalCycles: 4,
    });
    expect(service.lastResult()).toBe(result);
  });
});

describe('US195 MultiYearResearchService multiple datasets', () => {
  it('executes datasets in order with independent walk forward services', async () => {
    const executionOrder: string[] = [];
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023, DATASET_2024],
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        executionOrder.push(dataset.datasetId);
        return WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
      },
    });

    const result = await service.execute();

    expect(executionOrder).toEqual([DATASET_2022, DATASET_2023, DATASET_2024]);
    expect(result.datasetsProcessed).toBe(3);
    expect(result.datasetsSucceeded).toBe(3);
    expect(result.datasetsFailed).toBe(0);
    expect(result.walkForwardResults.map((item) => item.datasetId)).toEqual([
      DATASET_2022,
      DATASET_2023,
      DATASET_2024,
    ]);
    expect(new Set(result.walkForwardResults.map((item) => item.executionId)).size).toBe(3);
    expect(service.metrics()?.windowsExecuted).toBe(9);
    expect(service.metrics()?.candlesProcessed).toBe(36);
    expect(service.metrics()?.cyclesExecuted).toBe(36);
  });

  it('emits started, per-dataset completed, and completed events', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023],
    });

    await service.execute();

    const events = service.domainEvents();
    expect(events.map((event) => event.eventType)).toEqual([
      'MultiYearResearchStarted',
      'DatasetCompleted',
      'DatasetCompleted',
      'MultiYearResearchCompleted',
    ]);
    expect(events[0]).toMatchObject({
      eventType: 'MultiYearResearchStarted',
      researchId: RESEARCH_ID,
      totalDatasets: 2,
    });
    expect(events[1]).toMatchObject({
      eventType: 'DatasetCompleted',
      datasetId: DATASET_2022,
      succeeded: true,
    });
    expect(events[2]).toMatchObject({
      eventType: 'DatasetCompleted',
      datasetId: DATASET_2023,
      succeeded: true,
    });
    expect(events[3]).toMatchObject({
      eventType: 'MultiYearResearchCompleted',
      datasetsProcessed: 2,
      datasetsSucceeded: 2,
      datasetsFailed: 0,
    });
  });
});

describe('US195 MultiYearResearchService walk forward integration', () => {
  it('reuses WalkForwardValidationService without modification', async () => {
    const createSpy = vi.spyOn(WalkForwardValidationService, 'create');
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023],
    });

    await service.execute();

    expect(createSpy).toHaveBeenCalledTimes(2);
    for (const call of createSpy.mock.calls) {
      const dependencies = call[0];
      expect(dependencies?.dataset?.datasetId).toBeTruthy();
      expect(dependencies?.configuration?.datasetId).toBe(dependencies?.dataset?.datasetId);
      expect(dependencies?.createStrategy).toBeTruthy();
    }
    createSpy.mockRestore();
  });
});

describe('US195 MultiYearResearchService failure propagation', () => {
  it('fails the research when stopOnFailure is enabled', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023, DATASET_2024],
      stopOnFailure: true,
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        if (dataset.datasetId === DATASET_2023) {
          return {
            async execute() {
              throw new WalkForwardReplayFailedError('window-0');
            },
            lastResult() {
              return null;
            },
          } as unknown as WalkForwardValidationService;
        }
        return WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchDatasetFailedError);

    const result = service.lastResult();
    expect(result).toMatchObject({
      datasetsProcessed: 2,
      datasetsSucceeded: 1,
      datasetsFailed: 1,
    });
    expect(result?.walkForwardResults).toHaveLength(1);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'MultiYearResearchStarted',
      'DatasetCompleted',
      'DatasetCompleted',
      'MultiYearResearchFailed',
    ]);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'MultiYearResearchFailed',
      datasetId: DATASET_2023,
    });
    expect(service.metrics()).toMatchObject({
      datasetsProcessed: 2,
      failedDatasets: 1,
      windowsExecuted: 3,
    });
  });

  it('continues when stopOnFailure is disabled', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023, DATASET_2024],
      stopOnFailure: false,
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        if (dataset.datasetId === DATASET_2023) {
          return {
            async execute() {
              throw new WalkForwardReplayFailedError('window-0');
            },
            lastResult() {
              return null;
            },
          } as unknown as WalkForwardValidationService;
        }
        return WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
      },
    });

    const result = await service.execute();

    expect(result).toMatchObject({
      datasetsProcessed: 3,
      datasetsSucceeded: 2,
      datasetsFailed: 1,
    });
    expect(result.walkForwardResults).toHaveLength(2);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'MultiYearResearchStarted',
      'DatasetCompleted',
      'DatasetCompleted',
      'DatasetCompleted',
      'MultiYearResearchCompleted',
    ]);
    expect(service.domainEvents()[1]).toMatchObject({
      succeeded: true,
      datasetId: DATASET_2022,
    });
    expect(service.domainEvents()[2]).toMatchObject({
      succeeded: false,
      datasetId: DATASET_2023,
    });
  });

  it('includes partial walk forward results on dataset failure', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022, DATASET_2023],
      stopOnFailure: true,
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        if (dataset.datasetId === DATASET_2023) {
          return {
            async execute() {
              throw new WalkForwardReplayFailedError('window-1');
            },
            lastResult() {
              return {
                executionId: `${RESEARCH_ID}-${DATASET_2023}`,
                datasetId: DATASET_2023,
                totalWindows: 2,
                completedWindows: 1,
                failedWindows: 1,
                replayResults: Object.freeze([]),
                startedAt: MYR_START,
                completedAt: MYR_COMPLETED,
                duration: 100,
              };
            },
          } as unknown as WalkForwardValidationService;
        }
        return WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchDatasetFailedError);

    expect(service.lastResult()?.walkForwardResults).toHaveLength(2);
    expect(service.metrics()?.windowsExecuted).toBe(4);
  });

  it('rejects invalid strategy returned during walk forward setup', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      createWalkForwardService: () => {
        throw new WalkForwardValidationError('invalid strategy');
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchValidationError);
    expect(service.domainEvents().at(-1)?.eventType).toBe('MultiYearResearchFailed');
  });

  it('maps unexpected execution failures while finalizing', async () => {
    let calls = 0;
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw new Error('finalize failed');
        }
        return createMultiYearResearchResult(properties);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchExecutionFailedError);
  });

  it('maps non-error throws while finalizing', async () => {
    let calls = 0;
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      createResult: (properties) => {
        calls += 1;
        if (calls === 1) {
          throw 'finalize-raw';
        }
        return createMultiYearResearchResult(properties);
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchExecutionFailedError);
  });

  it('does not remount multi-year errors when mapping dataset failures', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      createWalkForwardService: () => {
        throw new MultiYearResearchValidationError('already mapped');
      },
    });

    await expect(service.execute()).rejects.toMatchObject({
      message: 'already mapped',
      code: 'MULTI_YEAR_RESEARCH_VALIDATION',
    });
  });

  it('maps walk forward validation errors during dataset execution', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      stopOnFailure: true,
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        const _walkForward = WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
        return {
          async execute() {
            throw new WalkForwardValidationError('bad window');
          },
          lastResult() {
            return null;
          },
        } as unknown as WalkForwardValidationService;
      },
    });

    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchValidationError);
  });

  it('maps non-error throws during dataset setup and execution', async () => {
    const setup = createService({
      datasetIds: [DATASET_2022],
      createWalkForwardService: () => {
        throw 'setup-raw';
      },
    });
    await expect(setup.service.execute()).rejects.toBeInstanceOf(
      MultiYearResearchDatasetFailedError,
    );

    const setupError = createService({
      datasetIds: [DATASET_2022],
      createWalkForwardService: () => {
        throw new Error('setup failed');
      },
    });
    await expect(setupError.service.execute()).rejects.toBeInstanceOf(
      MultiYearResearchDatasetFailedError,
    );

    const execution = createService({
      datasetIds: [DATASET_2022],
      stopOnFailure: true,
      createWalkForwardService: (_dataset, _walkForwardConfiguration, _dependencies) =>
        ({
          async execute() {
            throw 'execution-raw';
          },
          lastResult() {
            return null;
          },
        }) as unknown as WalkForwardValidationService,
    });
    await expect(execution.service.execute()).rejects.toBeInstanceOf(
      MultiYearResearchDatasetFailedError,
    );

    const passthrough = createService({
      datasetIds: [DATASET_2022],
      stopOnFailure: true,
      createWalkForwardService: () =>
        ({
          async execute() {
            throw new MultiYearResearchDatasetFailedError(DATASET_2022);
          },
          lastResult() {
            return null;
          },
        }) as unknown as WalkForwardValidationService,
    });
    await expect(passthrough.service.execute()).rejects.toBeInstanceOf(
      MultiYearResearchDatasetFailedError,
    );
  });
});

describe('US195 MultiYearResearchService idempotency', () => {
  it('returns the same result on repeated execute()', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
    });
    const first = await service.execute();
    const second = await service.execute();
    expect(second).toBe(first);
  });

  it('produces identical outcomes across independent research executions', async () => {
    const datasets = [datasetWithCandles(DATASET_2022, 8), datasetWithCandles(DATASET_2023, 8)];
    const configuration = defaultConfiguration(datasets);
    const clockTimes = [
      '2026-07-20T13:00:00.000Z',
      ...Array.from({ length: 80 }, () => '2026-07-20T13:05:00.000Z'),
    ];

    const first = createService({
      configuration,
      clock: createClock(clockTimes),
      createSessionId: (window) => `session-${window.windowId}`,
      createRuntimeId: (window) => `runtime-${window.windowId}`,
    }).service;

    const second = createService({
      configuration,
      clock: createClock(clockTimes),
      createSessionId: (window) => `session-${window.windowId}`,
      createRuntimeId: (window) => `runtime-${window.windowId}`,
    }).service;

    const a = await first.execute();
    const b = await second.execute();

    expect(a.walkForwardResults.map(stableWalkForward)).toEqual(
      b.walkForwardResults.map(stableWalkForward),
    );
    expect(stableMultiYear(a)).toEqual(stableMultiYear(b));
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      rejectOnRepeat: true,
    });
    await service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(MultiYearResearchAlreadyCompletedError);
  });

  it('rejects concurrent execute to avoid duplicate runners', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      createWalkForwardService: (dataset, walkForwardConfiguration, dependencies) => {
        const walkForward = WalkForwardValidationService.create({
          dataset,
          configuration: walkForwardConfiguration,
          ...dependencies,
        });
        return {
          async execute() {
            await gate;
            return walkForward.execute();
          },
        } as unknown as WalkForwardValidationService;
      },
    });

    const pending = service.execute();
    await Promise.resolve();
    await expect(service.execute()).rejects.toBeInstanceOf(
      MultiYearResearchDuplicateExecutionError,
    );
    release();
    await pending;
  });
});

describe('US195 MultiYearResearchService error codes', () => {
  it('exposes typed application error codes', () => {
    expect(new MultiYearResearchValidationError('x').code).toBe('MULTI_YEAR_RESEARCH_VALIDATION');
    expect(new MultiYearResearchAlreadyCompletedError('x').code).toBe(
      'MULTI_YEAR_RESEARCH_ALREADY_COMPLETED',
    );
    expect(new MultiYearResearchDuplicateExecutionError().code).toBe(
      'MULTI_YEAR_RESEARCH_DUPLICATE_EXECUTION',
    );
    expect(new MultiYearResearchDatasetFailedError('d').code).toBe(
      'MULTI_YEAR_RESEARCH_DATASET_FAILED',
    );
    expect(new MultiYearResearchExecutionFailedError('x').code).toBe(
      'MULTI_YEAR_RESEARCH_EXECUTION_FAILED',
    );
    expect(new MultiYearResearchDatasetFailedError('d', new Error('cause')).cause).toBeInstanceOf(
      Error,
    );
  });
});

describe('US195 MultiYearResearchService defaults', () => {
  it('uses default clock and identity factories', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T14:00:00.000Z'));

    const datasets = [datasetWithCandles(DATASET_2022, 4)];
    const service = MultiYearResearchService.create({
      configuration: defaultConfiguration(datasets, {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
    });

    const result = await service.execute();
    expect(result.walkForwardResults[0]?.executionId).toContain(DATASET_2022);
    expect(result.startedAt).toBe('2026-07-20T14:00:00.000Z');
  });

  it('supports a custom strategy factory', async () => {
    const { service } = createService({
      datasetIds: [DATASET_2022],
      candleCount: 4,
      configuration: defaultConfiguration([datasetWithCandles(DATASET_2022, 4)], {
        walkForwardConfiguration: defaultWalkForwardTemplate({
          maximumWindows: 1,
        }),
      }),
      createStrategy: (provider) =>
        HistoricalReplayStrategy.create({ marketDataProvider: provider }),
    });

    const result = await service.execute();
    expect(result.datasetsSucceeded).toBe(1);
  });
});

describe('ADR-019 MultiYearResearchService EventEmissionFailure (Contract B)', () => {
  function createFailingService(): MultiYearResearchService {
    const datasets = [datasetWithCandles(DATASET_2022, 4)];
    return MultiYearResearchService.create({
      configuration: defaultConfiguration(datasets, {
        walkForwardConfiguration: defaultWalkForwardTemplate({ maximumWindows: 1 }),
      }),
      createExecutionId: (dataset) => `${RESEARCH_ID}-${dataset.datasetId}`,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      clock: createClock([MYR_START, ...Array.from({ length: 200 }, () => MYR_COMPLETED)]),
      applicationEventNotifier: createEventEmissionFailingNotifier(MULTI_YEAR_COMPLETION_EVENTS),
    });
  }

  it('preserves completed execution when completion notifications throw', async () => {
    const service = createFailingService();

    const result = await service.execute();

    expect(result.datasetsSucceeded).toBe(1);
    expect(result.datasetsFailed).toBe(0);
    expect(service.eventEmissionDiagnostics().length).toBeGreaterThan(0);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'MultiYearResearchStarted',
    ]);
    expect(service.metrics()?.failedDatasets).toBe(0);
  });

  it('caches the completed result after notification failure', async () => {
    const service = createFailingService();

    const result = await service.execute();
    expect(await service.execute()).toBe(result);
    expect(result.datasetsSucceeded).toBe(1);
  });

  it('produces identical execution results on repeated notification failure', async () => {
    const first = createFailingService();
    const second = createFailingService();

    expect(stableMultiYear(await first.execute())).toEqual(stableMultiYear(await second.execute()));
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

function stableWalkForward(
  result: ReturnType<typeof createMultiYearResearchResult>['walkForwardResults'][number],
) {
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

function stableMultiYear(result: ReturnType<typeof createMultiYearResearchResult>) {
  return {
    researchId: result.researchId,
    datasetsProcessed: result.datasetsProcessed,
    datasetsSucceeded: result.datasetsSucceeded,
    datasetsFailed: result.datasetsFailed,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    duration: result.duration,
    walkForwardResults: result.walkForwardResults.map(stableWalkForward),
  };
}
