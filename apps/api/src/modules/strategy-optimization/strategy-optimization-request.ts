import type { ExecutionConfiguration } from './execution-configuration';
import { createOptimizationCriteria, type OptimizationCriteria } from './optimization-criteria';
import { createStrategyConfiguration, type StrategyConfiguration } from './strategy-configuration';

/**
 * Immutable strategy optimization request for US203.
 */
export type StrategyOptimizationRequest = Readonly<{
  optimizationId: string;
  strategyConfigurations: readonly StrategyConfiguration[];
  optimizationCriteria: OptimizationCriteria;
  executionConfiguration: ExecutionConfiguration;
}>;

export type CreateStrategyOptimizationRequestInput = Readonly<{
  optimizationId: string;
  strategyConfigurations: readonly StrategyConfiguration[];
  optimizationCriteria: OptimizationCriteria;
  executionConfiguration: ExecutionConfiguration;
}>;

export function createStrategyOptimizationRequest(
  input: CreateStrategyOptimizationRequestInput,
): StrategyOptimizationRequest {
  const optimizationId = required(input.optimizationId, 'optimizationId');
  const strategyConfigurations = validateStrategyConfigurations(input.strategyConfigurations);
  const optimizationCriteria = createOptimizationCriteria(input.optimizationCriteria);
  const executionConfiguration = input.executionConfiguration;

  if (executionConfiguration === null || executionConfiguration === undefined) {
    throw new Error('executionConfiguration is required');
  }

  return Object.freeze({
    optimizationId,
    strategyConfigurations,
    optimizationCriteria,
    executionConfiguration,
  });
}

function validateStrategyConfigurations(
  configurations: readonly StrategyConfiguration[] | null | undefined,
): readonly StrategyConfiguration[] {
  if (configurations === null || configurations === undefined) {
    throw new Error('strategyConfigurations are required');
  }
  if (configurations.length === 0) {
    throw new Error('strategyConfigurations must not be empty');
  }

  const seen = new Set<string>();
  const frozen: StrategyConfiguration[] = [];

  for (const configuration of configurations) {
    const normalized = createStrategyConfiguration(configuration);
    if (seen.has(normalized.configurationId)) {
      throw new Error(`duplicate configuration id: ${normalized.configurationId}`);
    }
    seen.add(normalized.configurationId);
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
