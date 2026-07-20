import {
  createHistoricalCandle,
  createHistoricalDataset,
  HistoricalMarketDataProvider,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  type HistoricalCandle,
  type HistoricalDataset,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import {
  createMultiYearResearchConfiguration,
  MultiYearResearchService,
  type MultiYearResearchServiceDependencies,
  type WalkForwardConfigurationTemplate,
} from '../multi-year-research';
import {
  SmokeBacktestService,
  StubMarketDataProvider,
  StubPaperStrategy,
  type SmokeBacktestServiceDependencies,
} from '../smoke-backtest';
import {
  createWalkForwardConfiguration,
  WalkForwardValidationService,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import {
  createBenchmarkSuiteConfiguration,
  type BenchmarkSuiteConfiguration,
} from './benchmark-configuration';
import type { BenchmarkScenario } from './benchmark-scenario';

/**
 * Deterministic benchmark datasets and service factories (US196).
 *
 * Each predefined scenario uses fixed in-memory data — no external sources.
 */

export const BENCHMARK_SMOKE_CYCLES = 3;
export const BENCHMARK_HISTORICAL_CANDLE_COUNT = 6;
export const BENCHMARK_WALK_FORWARD_CANDLE_COUNT = 12;
export const BENCHMARK_MULTI_YEAR_DATASET_IDS = Object.freeze([
  'benchmark-btc-2022',
  'benchmark-btc-2023',
] as const);
export const BENCHMARK_MULTI_YEAR_CANDLE_COUNT = 12;

export type BenchmarkScenarioContext = Readonly<{
  clock: () => string;
  workspaceId?: string;
  strategyId?: string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

export type BenchmarkScenarioFactories = Readonly<{
  createSmokeBacktestService: () => SmokeBacktestService;
  createHistoricalReplayService: () => HistoricalReplayService;
  createWalkForwardValidationService: () => WalkForwardValidationService;
  createMultiYearResearchService: () => MultiYearResearchService;
}>;

const DEFAULT_WORKSPACE_ID = 'performance-benchmark-workspace';
const DEFAULT_STRATEGY_ID = 'performance-benchmark-strategy';
const BENCHMARK_HISTORICAL_DATASET_ID = 'benchmark-historical-replay';
const BENCHMARK_WALK_FORWARD_DATASET_ID = 'benchmark-walk-forward';
const BENCHMARK_RESEARCH_ID = 'benchmark-multi-year-research';

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

export function createBenchmarkHistoricalDataset(
  datasetId: string,
  candleCount: number,
): HistoricalDataset {
  const candles = Array.from({ length: candleCount }, (_, index) => candleAt(index * 5));
  return createHistoricalDataset({
    datasetId,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles,
  });
}

function defaultWalkForwardTemplate(): WalkForwardConfigurationTemplate {
  return Object.freeze({
    trainingWindow: 2,
    validationWindow: 2,
    stepSize: 4,
    overlap: 0,
    maximumWindows: 10,
  });
}

export function createBenchmarkScenarioFactories(
  context: BenchmarkScenarioContext,
): BenchmarkScenarioFactories {
  const workspaceId = (context.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
  const strategyId = (context.strategyId ?? DEFAULT_STRATEGY_ID).trim();
  const leaseDurationMs = context.leaseDurationMs ?? 60_000;
  const heartbeatTimeoutMs = context.heartbeatTimeoutMs ?? 300_000;

  return Object.freeze({
    createSmokeBacktestService: () =>
      SmokeBacktestService.create(
        createSmokeBenchmarkDependencies({
          clock: context.clock,
          workspaceId,
          strategyId,
          leaseDurationMs,
          heartbeatTimeoutMs,
        }),
      ),
    createHistoricalReplayService: () =>
      HistoricalReplayService.create(
        createHistoricalReplayBenchmarkDependencies({
          clock: context.clock,
          workspaceId,
          strategyId,
          leaseDurationMs,
          heartbeatTimeoutMs,
        }),
      ),
    createWalkForwardValidationService: () =>
      WalkForwardValidationService.create(
        createWalkForwardBenchmarkDependencies({
          clock: context.clock,
          workspaceId,
          strategyId,
          leaseDurationMs,
          heartbeatTimeoutMs,
        }),
      ),
    createMultiYearResearchService: () =>
      MultiYearResearchService.create(
        createMultiYearBenchmarkDependencies({
          clock: context.clock,
          workspaceId,
          strategyId,
          leaseDurationMs,
          heartbeatTimeoutMs,
        }),
      ),
  });
}

export function createSmokeBenchmarkDependencies(
  context: BenchmarkScenarioContext,
): SmokeBacktestServiceDependencies {
  const marketDataProvider = StubMarketDataProvider.create();
  const strategy = StubPaperStrategy.create({ marketDataProvider });

  return Object.freeze({
    strategy,
    marketDataProvider,
    cycles: BENCHMARK_SMOKE_CYCLES,
    workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
    strategyId: context.strategyId ?? DEFAULT_STRATEGY_ID,
    clock: context.clock,
    leaseDurationMs: context.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs ?? 300_000,
  });
}

export function createHistoricalReplayBenchmarkDependencies(
  context: BenchmarkScenarioContext,
): Parameters<typeof HistoricalReplayService.create>[0] {
  const dataset = createBenchmarkHistoricalDataset(
    BENCHMARK_HISTORICAL_DATASET_ID,
    BENCHMARK_HISTORICAL_CANDLE_COUNT,
  );
  const marketDataProvider = HistoricalMarketDataProvider.create({ dataset });
  const strategy = HistoricalReplayStrategy.create({ marketDataProvider });

  return Object.freeze({
    dataset,
    strategy,
    marketDataProvider,
    workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
    strategyId: context.strategyId ?? DEFAULT_STRATEGY_ID,
    clock: context.clock,
    leaseDurationMs: context.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs ?? 300_000,
  });
}

export function createWalkForwardBenchmarkDependencies(
  context: BenchmarkScenarioContext,
): WalkForwardValidationServiceDependencies {
  const dataset = createBenchmarkHistoricalDataset(
    BENCHMARK_WALK_FORWARD_DATASET_ID,
    BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  );

  return Object.freeze({
    dataset,
    configuration: createWalkForwardConfiguration({
      datasetId: BENCHMARK_WALK_FORWARD_DATASET_ID,
      ...defaultWalkForwardTemplate(),
    }),
    workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
    strategyId: context.strategyId ?? DEFAULT_STRATEGY_ID,
    clock: context.clock,
    leaseDurationMs: context.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs ?? 300_000,
  });
}

export function createMultiYearBenchmarkDependencies(
  context: BenchmarkScenarioContext,
): MultiYearResearchServiceDependencies {
  const datasets = BENCHMARK_MULTI_YEAR_DATASET_IDS.map((datasetId) =>
    createBenchmarkHistoricalDataset(datasetId, BENCHMARK_MULTI_YEAR_CANDLE_COUNT),
  );

  return Object.freeze({
    configuration: createMultiYearResearchConfiguration({
      researchId: BENCHMARK_RESEARCH_ID,
      datasets,
      walkForwardConfiguration: defaultWalkForwardTemplate(),
      maximumParallelism: 1,
      stopOnFailure: true,
    }),
    workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
    strategyId: context.strategyId ?? DEFAULT_STRATEGY_ID,
    clock: context.clock,
    leaseDurationMs: context.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs ?? 300_000,
  });
}

export function predefinedBenchmarkSuiteEntries(): readonly Readonly<{
  benchmarkId: string;
  scenario: BenchmarkScenario;
}>[] {
  return Object.freeze([
    Object.freeze({ benchmarkId: 'benchmark-smoke', scenario: 'Smoke' as const }),
    Object.freeze({
      benchmarkId: 'benchmark-historical-replay',
      scenario: 'HistoricalReplay' as const,
    }),
    Object.freeze({
      benchmarkId: 'benchmark-walk-forward',
      scenario: 'WalkForward' as const,
    }),
    Object.freeze({
      benchmarkId: 'benchmark-multi-year-research',
      scenario: 'MultiYearResearch' as const,
    }),
  ]);
}

export function createPredefinedBenchmarkSuiteConfiguration(): BenchmarkSuiteConfiguration {
  return createBenchmarkSuiteConfiguration({
    suiteId: 'benchmark-suite-196',
    benchmarks: predefinedBenchmarkSuiteEntries(),
  });
}
