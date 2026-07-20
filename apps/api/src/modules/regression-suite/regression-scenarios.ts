import {
  createHistoricalCandle,
  createHistoricalDataset,
  createReplayConfiguration,
  HistoricalReplayService,
  type HistoricalDataset,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import {
  createDeterministicReplayConfiguration,
  DeterministicReplayValidationService,
  type DeterministicReplayValidationServiceDependencies,
} from '../deterministic-replay-validation';
import {
  createMultiYearResearchConfiguration,
  MultiYearResearchService,
  type MultiYearResearchServiceDependencies,
} from '../multi-year-research';
import {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  createBenchmarkHistoricalDataset,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
  type BenchmarkScenarioContext,
} from '../performance-benchmark';
import { SmokeBacktestService, type SmokeBacktestServiceDependencies } from '../smoke-backtest';
import {
  WalkForwardValidationService,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import { ExecutionStatus } from '../smoke-backtest';
import {
  createRegressionScenario,
  type RegressionExpectedResult,
  type RegressionScenario,
} from './regression-scenario';
import {
  createRegressionSuiteConfiguration,
  type RegressionSuiteConfiguration,
} from './regression-suite-configuration';
import type { RegressionScenarioType } from './regression-scenario-type';
import { stableApplicationEvents, type ExecutionBaseline } from './execution-baseline-comparator';

/**
 * Deterministic regression datasets and service factories (US198).
 *
 * Each predefined scenario uses fixed in-memory data — no external sources.
 */

export const REGRESSION_SUITE_ID = 'regression-suite-198';
export const REGRESSION_DETERMINISTIC_DATASET_ID = 'regression-deterministic-replay';
export const REGRESSION_DETERMINISTIC_CANDLE_COUNT = 3;
export const REGRESSION_DETERMINISTIC_ITERATIONS = 2;
export const REGRESSION_DETERMINISTIC_VALIDATION_ID = 'regression-deterministic-validation';

const DEFAULT_WORKSPACE_ID = 'regression-suite-workspace';
const DEFAULT_STRATEGY_ID = 'regression-suite-strategy';
const REGRESSION_HISTORICAL_DATASET_ID = 'benchmark-historical-replay';
const REGRESSION_WALK_FORWARD_DATASET_ID = 'benchmark-walk-forward';

export type RegressionScenarioContext = Readonly<{
  clock: () => string;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

export type RegressionScenarioFactories = Readonly<{
  createSmokeBacktestService: () => SmokeBacktestService;
  createHistoricalReplayService: () => HistoricalReplayService;
  createWalkForwardValidationService: () => WalkForwardValidationService;
  createMultiYearResearchService: () => MultiYearResearchService;
  createDeterministicReplayValidationService: () => DeterministicReplayValidationService;
}>;

function createDeterministicRegressionDataset(): HistoricalDataset {
  const candles = Array.from({ length: REGRESSION_DETERMINISTIC_CANDLE_COUNT }, (_, index) =>
    createHistoricalCandle({
      timestamp: `2026-07-19T20:${String(index * 5).padStart(2, '0')}:00.000Z`,
      open: 100 + index,
      high: 110 + index,
      low: 95 + index,
      close: 105 + index,
      volume: 1_000 + index,
    }),
  );

  return createHistoricalDataset({
    datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles,
  });
}

export function createRegressionScenarioFactories(
  context: RegressionScenarioContext,
): RegressionScenarioFactories {
  const workspaceId = (context.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
  const strategyId = (context.strategyId ?? DEFAULT_STRATEGY_ID).trim();
  const leaseDurationMs = context.leaseDurationMs ?? 60_000;
  const heartbeatTimeoutMs = context.heartbeatTimeoutMs ?? 300_000;
  const benchmarkContext: BenchmarkScenarioContext = Object.freeze({
    clock: context.clock,
    workspaceId,
    strategyId,
    leaseDurationMs,
    heartbeatTimeoutMs,
  });

  return Object.freeze({
    createSmokeBacktestService: () =>
      SmokeBacktestService.create(createSmokeBenchmarkDependencies(benchmarkContext)),
    createHistoricalReplayService: () =>
      HistoricalReplayService.create(createHistoricalReplayBenchmarkDependencies(benchmarkContext)),
    createWalkForwardValidationService: () =>
      WalkForwardValidationService.create(createWalkForwardBenchmarkDependencies(benchmarkContext)),
    createMultiYearResearchService: () =>
      MultiYearResearchService.create(createMultiYearBenchmarkDependencies(benchmarkContext)),
    createDeterministicReplayValidationService: () =>
      DeterministicReplayValidationService.create(
        createDeterministicReplayRegressionDependencies(context),
      ),
  });
}

export function createDeterministicReplayRegressionDependencies(
  context: RegressionScenarioContext,
): DeterministicReplayValidationServiceDependencies {
  const dataset = createDeterministicRegressionDataset();

  return Object.freeze({
    dataset,
    configuration: createDeterministicReplayConfiguration({
      validationId: REGRESSION_DETERMINISTIC_VALIDATION_ID,
      replayConfiguration: createReplayConfiguration({
        datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
        endIndex: REGRESSION_DETERMINISTIC_CANDLE_COUNT - 1,
      }),
      iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
      rejectOnMismatch: false,
    }),
    workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
    strategyId: context.strategyId ?? DEFAULT_STRATEGY_ID,
    clock: context.clock,
    createSessionId: () => `${REGRESSION_DETERMINISTIC_VALIDATION_ID}-session`,
    createRuntimeId: () => `${REGRESSION_DETERMINISTIC_VALIDATION_ID}-runtime`,
    leaseDurationMs: context.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs ?? 300_000,
  });
}

export function predefinedRegressionScenarioEntries(): readonly Readonly<{
  scenarioId: string;
  scenarioType: RegressionScenarioType;
}>[] {
  return Object.freeze([
    Object.freeze({ scenarioId: 'regression-smoke', scenarioType: 'Smoke' as const }),
    Object.freeze({
      scenarioId: 'regression-historical-replay',
      scenarioType: 'HistoricalReplay' as const,
    }),
    Object.freeze({
      scenarioId: 'regression-walk-forward',
      scenarioType: 'WalkForward' as const,
    }),
    Object.freeze({
      scenarioId: 'regression-multi-year-research',
      scenarioType: 'MultiYearResearch' as const,
    }),
    Object.freeze({
      scenarioId: 'regression-deterministic-replay-validation',
      scenarioType: 'DeterministicReplayValidation' as const,
    }),
  ]);
}

function smokeRegressionScenario(): RegressionScenario {
  return createRegressionScenario({
    scenarioId: 'regression-smoke',
    scenarioType: 'Smoke',
    expectedResult: Object.freeze({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: BENCHMARK_SMOKE_CYCLES,
      candlesProcessed: BENCHMARK_SMOKE_CYCLES,
      replayCompleted: true,
      datasetId: 'smoke-stub',
    }),
    expectedEvents: Object.freeze([
      Object.freeze({ eventType: 'SmokeBacktestStarted', cycles: BENCHMARK_SMOKE_CYCLES }),
      Object.freeze({
        eventType: 'SmokeBacktestCompleted',
        cyclesExecuted: BENCHMARK_SMOKE_CYCLES,
      }),
    ]),
    expectedMetrics: Object.freeze({
      cyclesExecuted: BENCHMARK_SMOKE_CYCLES,
      candlesProcessed: BENCHMARK_SMOKE_CYCLES,
    }),
  });
}

function historicalReplayRegressionScenario(): RegressionScenario {
  return createRegressionScenario({
    scenarioId: 'regression-historical-replay',
    scenarioType: 'HistoricalReplay',
    expectedResult: Object.freeze({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      candlesProcessed: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      replayCompleted: true,
      datasetId: REGRESSION_HISTORICAL_DATASET_ID,
    }),
    expectedEvents: Object.freeze([
      Object.freeze({
        eventType: 'HistoricalReplayStarted',
        datasetId: REGRESSION_HISTORICAL_DATASET_ID,
        candlesToProcess: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      }),
      Object.freeze({
        eventType: 'HistoricalReplayCompleted',
        datasetId: REGRESSION_HISTORICAL_DATASET_ID,
        candlesProcessed: BENCHMARK_HISTORICAL_CANDLE_COUNT,
        cyclesExecuted: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      }),
      Object.freeze({
        eventType: 'HistoricalReplayFinished',
        datasetId: REGRESSION_HISTORICAL_DATASET_ID,
        replayCompleted: true,
      }),
    ]),
    expectedMetrics: Object.freeze({
      cyclesExecuted: BENCHMARK_HISTORICAL_CANDLE_COUNT,
      candlesProcessed: BENCHMARK_HISTORICAL_CANDLE_COUNT,
    }),
  });
}

function walkForwardRegressionScenario(): RegressionScenario {
  const totalWindows = 3;
  const candlesProcessed = totalWindows * 4;

  return createRegressionScenario({
    scenarioId: 'regression-walk-forward',
    scenarioType: 'WalkForward',
    expectedResult: Object.freeze({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: candlesProcessed,
      candlesProcessed,
      replayCompleted: true,
      datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
      totalWindows,
      completedWindows: totalWindows,
      failedWindows: 0,
    }),
    expectedEvents: Object.freeze([
      Object.freeze({
        eventType: 'WalkForwardStarted',
        datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
        totalWindows,
      }),
      Object.freeze({
        eventType: 'WalkForwardWindowCompleted',
        datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
        windowId: 'window-0',
        candlesProcessed: 4,
        cyclesExecuted: 4,
      }),
      Object.freeze({
        eventType: 'WalkForwardWindowCompleted',
        datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
        windowId: 'window-1',
        candlesProcessed: 4,
        cyclesExecuted: 4,
      }),
      Object.freeze({
        eventType: 'WalkForwardWindowCompleted',
        datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
        windowId: 'window-2',
        candlesProcessed: 4,
        cyclesExecuted: 4,
      }),
      Object.freeze({
        eventType: 'WalkForwardCompleted',
        datasetId: REGRESSION_WALK_FORWARD_DATASET_ID,
        totalWindows,
        completedWindows: totalWindows,
        failedWindows: 0,
      }),
    ]),
    expectedMetrics: Object.freeze({
      cyclesExecuted: candlesProcessed,
      candlesProcessed,
      windowsProcessed: totalWindows,
    }),
  });
}

function multiYearRegressionScenario(): RegressionScenario {
  const datasetsProcessed = BENCHMARK_MULTI_YEAR_DATASET_IDS.length;
  const windowsPerDataset = 3;
  const totalWindows = datasetsProcessed * windowsPerDataset;
  const candlesProcessed = totalWindows * 4;

  return createRegressionScenario({
    scenarioId: 'regression-multi-year-research',
    scenarioType: 'MultiYearResearch',
    expectedResult: Object.freeze({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: candlesProcessed,
      candlesProcessed,
      replayCompleted: true,
      datasetId: null,
      datasetsProcessed,
      datasetsSucceeded: datasetsProcessed,
      datasetsFailed: 0,
      totalWindows,
      completedWindows: totalWindows,
      failedWindows: 0,
    }),
    expectedEvents: Object.freeze([
      Object.freeze({
        eventType: 'MultiYearResearchStarted',
        totalDatasets: datasetsProcessed,
      }),
      Object.freeze({
        eventType: 'DatasetCompleted',
        datasetId: BENCHMARK_MULTI_YEAR_DATASET_IDS[0],
        succeeded: true,
        totalWindows: windowsPerDataset,
        completedWindows: windowsPerDataset,
        failedWindows: 0,
        reason: null,
      }),
      Object.freeze({
        eventType: 'DatasetCompleted',
        datasetId: BENCHMARK_MULTI_YEAR_DATASET_IDS[1],
        succeeded: true,
        totalWindows: windowsPerDataset,
        completedWindows: windowsPerDataset,
        failedWindows: 0,
        reason: null,
      }),
      Object.freeze({
        eventType: 'MultiYearResearchCompleted',
        datasetsProcessed,
        datasetsSucceeded: datasetsProcessed,
        datasetsFailed: 0,
      }),
    ]),
    expectedMetrics: Object.freeze({
      cyclesExecuted: candlesProcessed,
      candlesProcessed,
      windowsProcessed: totalWindows,
      datasetsProcessed,
    }),
  });
}

function deterministicReplayRegressionScenario(): RegressionScenario {
  return createRegressionScenario({
    scenarioId: 'regression-deterministic-replay-validation',
    scenarioType: 'DeterministicReplayValidation',
    expectedResult: Object.freeze({
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: REGRESSION_DETERMINISTIC_CANDLE_COUNT,
      candlesProcessed: REGRESSION_DETERMINISTIC_CANDLE_COUNT,
      replayCompleted: true,
      datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
      deterministic: true,
      iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
      successfulIterations: REGRESSION_DETERMINISTIC_ITERATIONS,
      failedIterations: 0,
    }),
    expectedEvents: Object.freeze([
      Object.freeze({
        eventType: 'DeterministicValidationStarted',
        datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
        iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
      }),
      Object.freeze({
        eventType: 'ReplayCompared',
        iteration: 2,
        matched: true,
        mismatchCount: 0,
      }),
      Object.freeze({
        eventType: 'DeterministicValidationCompleted',
        datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
        iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
        successfulIterations: REGRESSION_DETERMINISTIC_ITERATIONS,
        failedIterations: 0,
        deterministic: true,
      }),
    ]),
    expectedMetrics: Object.freeze({
      cyclesExecuted: REGRESSION_DETERMINISTIC_CANDLE_COUNT,
      candlesProcessed: REGRESSION_DETERMINISTIC_CANDLE_COUNT,
      iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
    }),
  });
}

export function predefinedRegressionScenarios(): readonly RegressionScenario[] {
  return Object.freeze([
    smokeRegressionScenario(),
    historicalReplayRegressionScenario(),
    walkForwardRegressionScenario(),
    multiYearRegressionScenario(),
    deterministicReplayRegressionScenario(),
  ]);
}

export function createPredefinedRegressionSuiteConfiguration(): RegressionSuiteConfiguration {
  return createRegressionSuiteConfiguration({
    suiteId: REGRESSION_SUITE_ID,
    scenarios: predefinedRegressionScenarios(),
  });
}

export type CaptureRegressionBaselineFn = (
  scenarioType: RegressionScenarioType,
  context: RegressionScenarioContext,
) => Promise<ExecutionBaseline>;

export async function captureRegressionBaseline(
  scenarioType: RegressionScenarioType,
  context: RegressionScenarioContext,
  factories: RegressionScenarioFactories = createRegressionScenarioFactories(context),
): Promise<ExecutionBaseline> {
  switch (scenarioType) {
    case 'Smoke': {
      const service = factories.createSmokeBacktestService();
      const result = await service.execute();
      const metrics = service.metrics();
      return Object.freeze({
        result: extractSmokeResult(result),
        events: stableApplicationEvents(
          service.domainEvents() as readonly Readonly<Record<string, unknown>>[],
        ),
        metrics: Object.freeze({
          cyclesExecuted: metrics?.cyclesExecuted ?? result.cyclesExecuted,
          candlesProcessed: result.candlesProcessed,
        }),
      });
    }
    case 'HistoricalReplay': {
      const service = factories.createHistoricalReplayService();
      const result = await service.execute();
      const metrics = service.metrics();
      return Object.freeze({
        result: extractHistoricalResult(result),
        events: stableApplicationEvents(
          service.domainEvents() as readonly Readonly<Record<string, unknown>>[],
        ),
        metrics: Object.freeze({
          cyclesExecuted: metrics?.cyclesExecuted ?? result.cyclesExecuted,
          candlesProcessed: metrics?.candlesProcessed ?? result.candlesProcessed,
        }),
      });
    }
    case 'WalkForward': {
      const service = factories.createWalkForwardValidationService();
      const walkForward = await service.execute();
      const metrics = service.metrics();
      const lastReplay = walkForward.replayResults.at(-1);
      return Object.freeze({
        result: extractWalkForwardResult(walkForward, lastReplay),
        events: stableApplicationEvents(
          service.domainEvents() as readonly Readonly<Record<string, unknown>>[],
        ),
        metrics: Object.freeze({
          cyclesExecuted: metrics?.cyclesExecuted ?? 0,
          candlesProcessed: metrics?.candlesProcessed ?? 0,
          windowsProcessed: metrics?.windowsExecuted ?? walkForward.completedWindows,
        }),
      });
    }
    case 'MultiYearResearch': {
      const service = factories.createMultiYearResearchService();
      const research = await service.execute();
      const metrics = service.metrics();
      const candlesProcessed =
        metrics?.candlesProcessed ??
        research.walkForwardResults.reduce(
          (total, walkForward) =>
            total +
            walkForward.replayResults.reduce(
              (windowTotal, replay) => windowTotal + replay.candlesProcessed,
              0,
            ),
          0,
        );
      const cyclesExecuted =
        metrics?.cyclesExecuted ??
        research.walkForwardResults.reduce(
          (total, walkForward) =>
            total +
            walkForward.replayResults.reduce(
              (windowTotal, replay) => windowTotal + replay.cyclesExecuted,
              0,
            ),
          0,
        );
      return Object.freeze({
        result: extractMultiYearResult(research, candlesProcessed, cyclesExecuted),
        events: stableApplicationEvents(
          service.domainEvents() as readonly Readonly<Record<string, unknown>>[],
        ),
        metrics: Object.freeze({
          cyclesExecuted,
          candlesProcessed,
          windowsProcessed: metrics?.windowsExecuted ?? 0,
          datasetsProcessed: metrics?.datasetsProcessed ?? research.datasetsProcessed,
        }),
      });
    }
    case 'DeterministicReplayValidation': {
      const service = factories.createDeterministicReplayValidationService();
      const validation = await service.execute();
      const metrics = service.metrics();
      return Object.freeze({
        result: extractDeterministicResult(validation),
        events: stableApplicationEvents(
          service.domainEvents() as readonly Readonly<Record<string, unknown>>[],
        ),
        metrics: Object.freeze({
          cyclesExecuted: validation.baselineResult.cyclesExecuted,
          candlesProcessed: validation.baselineResult.candlesProcessed,
          iterations: metrics?.iterations ?? validation.iterations,
        }),
      });
    }
    default:
      throw new Error(`unsupported scenario: ${String(scenarioType)}`);
  }
}

function extractSmokeResult(
  result: Parameters<typeof extractHistoricalResult>[0],
): RegressionExpectedResult {
  return Object.freeze({
    executionStatus: result.executionStatus,
    cyclesExecuted: result.cyclesExecuted,
    candlesProcessed: result.candlesProcessed,
    replayCompleted: result.replayCompleted,
    datasetId: result.datasetId,
  });
}

function extractHistoricalResult(result: {
  executionStatus: ExecutionStatus;
  cyclesExecuted: number;
  candlesProcessed: number;
  replayCompleted: boolean;
  datasetId: string | null;
}): RegressionExpectedResult {
  return Object.freeze({
    executionStatus: result.executionStatus,
    cyclesExecuted: result.cyclesExecuted,
    candlesProcessed: result.candlesProcessed,
    replayCompleted: result.replayCompleted,
    datasetId: result.datasetId,
  });
}

function extractWalkForwardResult(
  walkForward: {
    datasetId: string;
    totalWindows: number;
    completedWindows: number;
    failedWindows: number;
    replayResults: readonly { cyclesExecuted: number; candlesProcessed: number }[];
  },
  lastReplay: { executionStatus: ExecutionStatus; replayCompleted: boolean } | undefined,
): RegressionExpectedResult {
  const candlesProcessed = walkForward.replayResults.reduce(
    (total, replay) => total + replay.candlesProcessed,
    0,
  );
  const cyclesExecuted = walkForward.replayResults.reduce(
    (total, replay) => total + replay.cyclesExecuted,
    0,
  );

  return Object.freeze({
    executionStatus: lastReplay?.executionStatus ?? ExecutionStatus.COMPLETED,
    cyclesExecuted,
    candlesProcessed,
    replayCompleted: lastReplay?.replayCompleted ?? true,
    datasetId: walkForward.datasetId,
    totalWindows: walkForward.totalWindows,
    completedWindows: walkForward.completedWindows,
    failedWindows: walkForward.failedWindows,
  });
}

function extractMultiYearResult(
  research: {
    datasetsProcessed: number;
    datasetsSucceeded: number;
    datasetsFailed: number;
    walkForwardResults: readonly {
      totalWindows: number;
      completedWindows: number;
      failedWindows: number;
    }[];
  },
  candlesProcessed: number,
  cyclesExecuted: number,
): RegressionExpectedResult {
  const totalWindows = research.walkForwardResults.reduce(
    (total, walkForward) => total + walkForward.totalWindows,
    0,
  );
  const completedWindows = research.walkForwardResults.reduce(
    (total, walkForward) => total + walkForward.completedWindows,
    0,
  );
  const failedWindows = research.walkForwardResults.reduce(
    (total, walkForward) => total + walkForward.failedWindows,
    0,
  );

  return Object.freeze({
    executionStatus: ExecutionStatus.COMPLETED,
    cyclesExecuted,
    candlesProcessed,
    replayCompleted: true,
    datasetId: null,
    datasetsProcessed: research.datasetsProcessed,
    datasetsSucceeded: research.datasetsSucceeded,
    datasetsFailed: research.datasetsFailed,
    totalWindows,
    completedWindows,
    failedWindows,
  });
}

function extractDeterministicResult(validation: {
  deterministic: boolean;
  iterations: number;
  successfulIterations: number;
  failedIterations: number;
  baselineResult: {
    executionStatus: ExecutionStatus;
    cyclesExecuted: number;
    candlesProcessed: number;
    replayCompleted: boolean;
    datasetId: string | null;
  };
}): RegressionExpectedResult {
  return Object.freeze({
    executionStatus: validation.baselineResult.executionStatus,
    cyclesExecuted: validation.baselineResult.cyclesExecuted,
    candlesProcessed: validation.baselineResult.candlesProcessed,
    replayCompleted: validation.baselineResult.replayCompleted,
    datasetId: validation.baselineResult.datasetId,
    deterministic: validation.deterministic,
    iterations: validation.iterations,
    successfulIterations: validation.successfulIterations,
    failedIterations: validation.failedIterations,
  });
}

export type {
  SmokeBacktestServiceDependencies,
  WalkForwardValidationServiceDependencies,
  MultiYearResearchServiceDependencies,
};

export {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  createBenchmarkHistoricalDataset,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createMultiYearResearchConfiguration,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
};
