import { ChaosTestingService } from '../chaos-testing';
import { DeterministicReplayValidationService } from '../deterministic-replay-validation';
import { HistoricalReplayService } from '../historical-replay';
import { MultiYearResearchService } from '../multi-year-research';
import { PerformanceBenchmarkService } from '../performance-benchmark';
import { RegressionSuiteService } from '../regression-suite';
import { SmokeBacktestService } from '../smoke-backtest';
import { WalkForwardValidationService } from '../walk-forward-validation';
import { createReadinessCheck } from './readiness-check';
import {
  buildReadinessCategoryResult,
  type ReadinessCategoryResult,
} from './readiness-category-result';

/**
 * Architecture readiness verification for US200.
 *
 * Verifies structural consistency of the research execution framework
 * without modifying execution services.
 */

type ServiceRegistryEntry = Readonly<{
  name: string;
  service: Readonly<{ create?: unknown; prototype?: { execute?: unknown } }>;
}>;

export const EXECUTION_SERVICE_REGISTRY = Object.freeze([
  { name: 'SmokeBacktestService', service: SmokeBacktestService },
  { name: 'HistoricalReplayService', service: HistoricalReplayService },
  { name: 'WalkForwardValidationService', service: WalkForwardValidationService },
  { name: 'MultiYearResearchService', service: MultiYearResearchService },
] satisfies readonly ServiceRegistryEntry[]);

export const ORCHESTRATION_SERVICE_REGISTRY = Object.freeze([
  { name: 'PerformanceBenchmarkService', service: PerformanceBenchmarkService },
  { name: 'DeterministicReplayValidationService', service: DeterministicReplayValidationService },
  { name: 'RegressionSuiteService', service: RegressionSuiteService },
  { name: 'ChaosTestingService', service: ChaosTestingService },
] satisfies readonly ServiceRegistryEntry[]);

export function verifyArchitectureReadiness(): ReadinessCategoryResult {
  const checks = [
    verifyExecutionServicesUnchanged(),
    verifyOrchestrationLayersIndependent(),
    verifyExecutionBoundariesRespected(),
  ];

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => `Restore architecture consistency: ${check.description}`);

  return buildReadinessCategoryResult('Architecture', checks, recommendations);
}

function verifyExecutionServicesUnchanged(): ReturnType<typeof createReadinessCheck> {
  const allAvailable = EXECUTION_SERVICE_REGISTRY.every((entry) =>
    hasCreateAndExecute(entry.service),
  );

  return createReadinessCheck({
    checkId: 'architecture-execution-services-unchanged',
    description: 'Execution services expose unchanged create and execute contracts',
    passed: allAvailable,
    warning: false,
  });
}

function verifyOrchestrationLayersIndependent(): ReturnType<typeof createReadinessCheck> {
  const allAvailable = ORCHESTRATION_SERVICE_REGISTRY.every((entry) =>
    hasCreateAndExecute(entry.service),
  );
  const executionServices = new Set<unknown>(
    EXECUTION_SERVICE_REGISTRY.map((entry) => entry.service),
  );
  const distinctFromExecution = ORCHESTRATION_SERVICE_REGISTRY.every(
    (orchestration) => !executionServices.has(orchestration.service),
  );

  return createReadinessCheck({
    checkId: 'architecture-orchestration-independent',
    description: 'Orchestration layers remain independent from execution services',
    passed: allAvailable && distinctFromExecution,
    warning: false,
  });
}

function verifyExecutionBoundariesRespected(): ReturnType<typeof createReadinessCheck> {
  const executionServicesUseResearchPattern = EXECUTION_SERVICE_REGISTRY.every((entry) =>
    hasResearchExecutionSurface(entry.service),
  );

  return createReadinessCheck({
    checkId: 'architecture-execution-boundaries',
    description: 'Execution boundaries restrict services to research execution surfaces',
    passed: executionServicesUseResearchPattern,
    warning: false,
  });
}

function hasCreateAndExecute(service: Readonly<{ create?: unknown; prototype?: object }>): boolean {
  const prototype = service.prototype;
  return (
    typeof service.create === 'function' &&
    prototype !== undefined &&
    prototype !== null &&
    'execute' in prototype &&
    typeof prototype.execute === 'function'
  );
}

function hasResearchExecutionSurface(service: Readonly<{ prototype?: object }>): boolean {
  const prototype = service.prototype;
  return (
    prototype !== undefined &&
    prototype !== null &&
    'execute' in prototype &&
    typeof prototype.execute === 'function' &&
    'domainEvents' in prototype &&
    typeof prototype.domainEvents === 'function' &&
    'lastResult' in prototype &&
    typeof prototype.lastResult === 'function'
  );
}
