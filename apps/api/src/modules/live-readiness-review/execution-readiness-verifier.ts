import {
  HistoricalReplayService,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import {
  MultiYearResearchService,
  type MultiYearResearchServiceDependencies,
} from '../multi-year-research';
import {
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
import { createReadinessCheck } from './readiness-check';
import {
  buildReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';

/**
 * Execution readiness verification for US200.
 */

export type ExecutionServiceFactories = Readonly<{
  createSmokeBacktestService: () => SmokeBacktestService;
  createHistoricalReplayService: () => HistoricalReplayService;
  createWalkForwardValidationService: () => WalkForwardValidationService;
  createMultiYearResearchService: () => MultiYearResearchService;
}>;

export type ExecutionReadinessContext = Readonly<{
  factories: ExecutionServiceFactories;
}>;

export async function verifyExecutionReadiness(
  context: ExecutionReadinessContext,
): Promise<ReadinessCategoryResult> {
  const checks = [];

  checks.push(
    await verifyServiceAvailable(
      'execution-smoke-available',
      'Smoke backtest execution service is available',
      () => context.factories.createSmokeBacktestService(),
    ),
  );
  checks.push(
    await verifyServiceAvailable(
      'execution-historical-available',
      'Historical replay execution service is available',
      () => context.factories.createHistoricalReplayService(),
    ),
  );
  checks.push(
    await verifyServiceAvailable(
      'execution-walk-forward-available',
      'Walk-forward validation execution service is available',
      () => context.factories.createWalkForwardValidationService(),
    ),
  );
  checks.push(
    await verifyServiceAvailable(
      'execution-multi-year-available',
      'Multi-year research execution service is available',
      () => context.factories.createMultiYearResearchService(),
    ),
  );
  checks.push(await verifyExecutionPipelineComplete(context));

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => `Resolve execution readiness issue: ${check.description}`);

  return buildReadinessCategoryResult('Execution', checks, recommendations);
}

export function createExecutionServiceFactories(
  context: BenchmarkScenarioContext,
): ExecutionServiceFactories {
  return Object.freeze({
    createSmokeBacktestService: () =>
      SmokeBacktestService.create(createSmokeBenchmarkDependencies(context)),
    createHistoricalReplayService: () =>
      HistoricalReplayService.create(createHistoricalReplayBenchmarkDependencies(context)),
    createWalkForwardValidationService: () =>
      WalkForwardValidationService.create(createWalkForwardBenchmarkDependencies(context)),
    createMultiYearResearchService: () =>
      MultiYearResearchService.create(createMultiYearBenchmarkDependencies(context)),
  });
}

async function verifyServiceAvailable(
  checkId: string,
  description: string,
  createService: () => unknown,
): Promise<ReturnType<typeof createReadinessCheck>> {
  try {
    const service = createService();
    const hasExecute =
      typeof service === 'object' &&
      service !== null &&
      'execute' in service &&
      typeof (service as { execute: unknown }).execute === 'function';
    return createReadinessCheck({
      checkId,
      description,
      passed: hasExecute,
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId,
      description,
      passed: false,
      warning: false,
    });
  }
}

async function verifyExecutionPipelineComplete(
  context: ExecutionReadinessContext,
): Promise<ReturnType<typeof createReadinessCheck>> {
  try {
    const service = context.factories.createSmokeBacktestService();
    const result = await service.execute();
    const pipelineComplete =
      result.cyclesExecuted > 0 &&
      service.lastResult() !== null &&
      service.domainEvents().length > 0;

    return createReadinessCheck({
      checkId: 'execution-pipeline-complete',
      description: 'Execution pipeline completes a smoke backtest cycle',
      passed: pipelineComplete,
      warning: false,
    });
  } catch {
    return createReadinessCheck({
      checkId: 'execution-pipeline-complete',
      description: 'Execution pipeline completes a smoke backtest cycle',
      passed: false,
      warning: false,
    });
  }
}

export type {
  SmokeBacktestServiceDependencies,
  HistoricalReplayServiceDependencies,
  WalkForwardValidationServiceDependencies,
  MultiYearResearchServiceDependencies,
};
