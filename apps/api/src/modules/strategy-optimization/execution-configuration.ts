import { createExecutionPolicy, type ExecutionPolicy } from '../execution-simulator';
import {
  createPerformanceAnalyticsConfiguration,
  type PerformanceAnalyticsConfiguration,
} from '../performance-analytics';
import {
  createExecutionRequest,
  type ExecutionRequest,
} from '../execution-simulator/execution-request';

/**
 * Immutable execution configuration for US203 Strategy Optimization.
 *
 * Supplies execution requests, policy defaults, and optional research settings.
 */
export type ExecutionConfiguration = Readonly<{
  executionRequests: readonly ExecutionRequest[];
  executionPolicy: ExecutionPolicy;
  performanceAnalyticsConfiguration: PerformanceAnalyticsConfiguration;
  researchCycles: number;
  workspaceId: string;
  strategyId: string;
}>;

export type CreateExecutionConfigurationInput = Readonly<{
  executionRequests: readonly ExecutionRequest[];
  executionPolicy: ExecutionPolicy;
  performanceAnalyticsConfiguration?: PerformanceAnalyticsConfiguration;
  researchCycles?: number;
  workspaceId?: string;
  strategyId?: string;
}>;

const DEFAULT_WORKSPACE_ID = 'strategy-optimization-workspace';
const DEFAULT_STRATEGY_ID = 'strategy-optimization-strategy';
const DEFAULT_RESEARCH_CYCLES = 1;

export function createExecutionConfiguration(
  input: CreateExecutionConfigurationInput,
): ExecutionConfiguration {
  const executionRequests = validateExecutionRequests(input.executionRequests);
  const executionPolicy = createExecutionPolicy(input.executionPolicy);
  const performanceAnalyticsConfiguration =
    input.performanceAnalyticsConfiguration === undefined
      ? createPerformanceAnalyticsConfiguration()
      : createPerformanceAnalyticsConfiguration(input.performanceAnalyticsConfiguration);
  const researchCycles = positiveInteger(
    input.researchCycles ?? DEFAULT_RESEARCH_CYCLES,
    'researchCycles',
  );
  const workspaceId = required(input.workspaceId ?? DEFAULT_WORKSPACE_ID, 'workspaceId');
  const strategyId = required(input.strategyId ?? DEFAULT_STRATEGY_ID, 'strategyId');

  return Object.freeze({
    executionRequests,
    executionPolicy,
    performanceAnalyticsConfiguration,
    researchCycles,
    workspaceId,
    strategyId,
  });
}

function validateExecutionRequests(
  requests: readonly ExecutionRequest[] | null | undefined,
): readonly ExecutionRequest[] {
  if (requests === null || requests === undefined) {
    throw new Error('executionRequests are required');
  }
  if (requests.length === 0) {
    throw new Error('executionRequests must not be empty');
  }

  const seen = new Set<string>();
  const frozen: ExecutionRequest[] = [];

  for (const request of requests) {
    const normalized = createExecutionRequest(request);
    if (seen.has(normalized.requestId)) {
      throw new Error(`duplicate execution request id: ${normalized.requestId}`);
    }
    seen.add(normalized.requestId);
    frozen.push(normalized);
  }

  return Object.freeze(frozen);
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
