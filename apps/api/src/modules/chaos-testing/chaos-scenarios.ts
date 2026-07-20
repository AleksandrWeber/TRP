import {
  createDeterministicReplayConfiguration,
  DeterministicReplayValidationService,
  type DeterministicReplayValidationServiceDependencies,
} from '../deterministic-replay-validation';
import {
  createReplayConfiguration,
  HistoricalReplayService,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import {
  createMultiYearResearchConfiguration,
  MultiYearResearchService,
  type MultiYearResearchServiceDependencies,
} from '../multi-year-research';
import {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  createHistoricalReplayBenchmarkDependencies,
  createMultiYearBenchmarkDependencies,
  createSmokeBenchmarkDependencies,
  createWalkForwardBenchmarkDependencies,
  type BenchmarkScenarioContext,
} from '../performance-benchmark';
import {
  createDeterministicReplayRegressionDependencies,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
} from '../regression-suite';
import { SmokeBacktestService, type SmokeBacktestServiceDependencies } from '../smoke-backtest';
import {
  WalkForwardValidationService,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import { createChaosScenario, type ChaosScenario } from './chaos-scenario';
import type { ChaosScenarioType } from './chaos-scenario-type';
import {
  createChaosTestingConfiguration,
  type ChaosTestingConfiguration,
} from './chaos-testing-configuration';
import type { ChaosScenarioContext, ChaosServiceFactories } from './failure-injector';
import type { InjectedFailureType } from './injected-failure-type';

/**
 * Deterministic chaos scenarios and service factories (US199).
 */

export const CHAOS_TESTING_SUITE_ID = 'chaos-testing-199';

const DEFAULT_WORKSPACE_ID = 'chaos-testing-workspace';
const DEFAULT_STRATEGY_ID = 'chaos-testing-strategy';

const SMOKE_START_AT = '2026-07-20T09:00:00.000Z';
const SMOKE_CREATE_AT = '2026-07-20T09:00:01.000Z';
const SMOKE_START_SESSION_AT = '2026-07-20T09:00:02.000Z';
const SMOKE_LEASE_EXPIRED_AT = '2026-07-20T09:01:30.000Z';
const SMOKE_FAILED_AT = '2026-07-20T09:01:31.000Z';

const RECOVERY_CLOCK_TICK = '2026-07-20T15:00:00.000Z';

export function createChaosScenarioFactories(context: ChaosScenarioContext): ChaosServiceFactories {
  const benchmarkContext: BenchmarkScenarioContext = Object.freeze({
    clock: context.clock,
    workspaceId: context.workspaceId,
    strategyId: context.strategyId,
    leaseDurationMs: context.leaseDurationMs,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs,
  });

  return Object.freeze({
    createSmokeBacktestService: (overrides = {}) =>
      SmokeBacktestService.create({
        ...createSmokeBenchmarkDependencies(benchmarkContext),
        ...overrides,
      }),
    createHistoricalReplayService: (overrides = {}) =>
      HistoricalReplayService.create({
        ...createHistoricalReplayBenchmarkDependencies(benchmarkContext),
        ...overrides,
      }),
    createWalkForwardValidationService: (overrides = {}) =>
      WalkForwardValidationService.create({
        ...createWalkForwardBenchmarkDependencies(benchmarkContext),
        ...overrides,
      }),
    createMultiYearResearchService: (overrides = {}) =>
      MultiYearResearchService.create({
        ...createMultiYearBenchmarkDependencies(benchmarkContext),
        ...overrides,
      }),
    createDeterministicReplayValidationService: (overrides = {}) =>
      DeterministicReplayValidationService.create({
        ...createDeterministicReplayRegressionDependencies(context),
        ...overrides,
      }),
  });
}

export function createRecoveryScenarioContext(
  overrides: Partial<ChaosScenarioContext> = {},
): ChaosScenarioContext {
  const clock = overrides.clock ?? createRecoveryClock();
  return Object.freeze({
    clock,
    workspaceId: (overrides.workspaceId ?? DEFAULT_WORKSPACE_ID).trim(),
    strategyId: (overrides.strategyId ?? DEFAULT_STRATEGY_ID).trim(),
    leaseDurationMs: overrides.leaseDurationMs ?? 60_000,
    heartbeatTimeoutMs: overrides.heartbeatTimeoutMs ?? 300_000,
  });
}

export function predefinedChaosScenarios(): readonly ChaosScenario[] {
  return Object.freeze([
    smokeMarketDataScenario(),
    smokeStrategyScenario(),
    smokeRepositoryScenario(),
    smokeLeaseScenario(),
    smokeValidationScenario(),
    smokeEventEmissionScenario(),
    historicalReplayStrategyScenario(),
    walkForwardRepositoryScenario(),
    multiYearRepositoryScenario(),
    deterministicValidationScenario(),
  ]);
}

export function createPredefinedChaosTestingConfiguration(): ChaosTestingConfiguration {
  return createChaosTestingConfiguration({
    suiteId: CHAOS_TESTING_SUITE_ID,
    scenarios: predefinedChaosScenarios(),
    failFast: false,
    rejectOnScenarioFailure: false,
  });
}

function smokeMarketDataScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-market-data',
    scenarioType: 'Smoke',
    injectedFailure: 'MarketDataProvider',
    expectedFailure: 'SMOKE_BACKTEST_VALIDATION',
    expectedFailedEventType: 'SmokeBacktestFailed',
  });
}

function smokeStrategyScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-strategy',
    scenarioType: 'Smoke',
    injectedFailure: 'Strategy',
    expectedFailure: 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED',
    expectedFailedEventType: 'SmokeBacktestFailed',
  });
}

function smokeRepositoryScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-repository',
    scenarioType: 'Smoke',
    injectedFailure: 'Repository',
    expectedFailure: 'SMOKE_BACKTEST_EXECUTION_FAILED',
    expectedFailedEventType: 'SmokeBacktestFailed',
  });
}

function smokeLeaseScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-lease',
    scenarioType: 'Smoke',
    injectedFailure: 'SessionLeaseExpiration',
    expectedFailure: 'SMOKE_BACKTEST_EXPIRED_LEASE',
    expectedFailedEventType: 'SmokeBacktestFailed',
    clockTimes: Object.freeze([
      SMOKE_START_AT,
      SMOKE_CREATE_AT,
      SMOKE_START_SESSION_AT,
      SMOKE_LEASE_EXPIRED_AT,
      SMOKE_FAILED_AT,
    ]),
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
  });
}

function smokeValidationScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-validation',
    scenarioType: 'Smoke',
    injectedFailure: 'ValidationFailure',
    expectedFailure: 'SMOKE_BACKTEST_VALIDATION',
    expectedFailedEventType: 'SmokeBacktestFailed',
  });
}

function smokeEventEmissionScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-smoke-event-emission',
    scenarioType: 'Smoke',
    injectedFailure: 'EventEmissionFailure',
    expectedFailure: 'NONE',
    expectedFailedEventType: 'SmokeBacktestCompleted',
  });
}

function historicalReplayStrategyScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-historical-replay-strategy',
    scenarioType: 'HistoricalReplay',
    injectedFailure: 'Strategy',
    expectedFailure: 'HISTORICAL_REPLAY_RUNNER_STARTUP_FAILED',
    expectedFailedEventType: 'HistoricalReplayFailed',
  });
}

function walkForwardRepositoryScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-walk-forward-repository',
    scenarioType: 'WalkForward',
    injectedFailure: 'Repository',
    expectedFailure: 'WALK_FORWARD_REPLAY_FAILED',
    expectedFailedEventType: 'WalkForwardFailed',
  });
}

function multiYearRepositoryScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-multi-year-repository',
    scenarioType: 'MultiYearResearch',
    injectedFailure: 'Repository',
    expectedFailure: 'MULTI_YEAR_RESEARCH_DATASET_FAILED',
    expectedFailedEventType: 'MultiYearResearchFailed',
  });
}

function deterministicValidationScenario(): ChaosScenario {
  return createChaosScenario({
    scenarioId: 'chaos-deterministic-validation',
    scenarioType: 'DeterministicReplayValidation',
    injectedFailure: 'ValidationFailure',
    expectedFailure: 'DETERMINISTIC_REPLAY_VALIDATION_VALIDATION',
    expectedFailedEventType: 'DeterministicValidationFailed',
  });
}

function createRecoveryClock(): () => string {
  const times = Array.from({ length: 10_000 }, () => RECOVERY_CLOCK_TICK);
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

export type {
  ChaosServiceFactories,
  SmokeBacktestServiceDependencies,
  HistoricalReplayServiceDependencies,
  WalkForwardValidationServiceDependencies,
  MultiYearResearchServiceDependencies,
  DeterministicReplayValidationServiceDependencies,
  ChaosScenarioType,
  InjectedFailureType,
};

export {
  BENCHMARK_HISTORICAL_CANDLE_COUNT,
  BENCHMARK_MULTI_YEAR_DATASET_IDS,
  BENCHMARK_SMOKE_CYCLES,
  BENCHMARK_WALK_FORWARD_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
  createDeterministicReplayConfiguration,
  createMultiYearResearchConfiguration,
  createReplayConfiguration,
};
