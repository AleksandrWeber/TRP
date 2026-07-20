import { createChaosScenario, type ChaosScenario } from './chaos-scenario';

/**
 * Immutable chaos testing suite configuration (US199).
 */

export type ChaosTestingConfiguration = Readonly<{
  suiteId: string;
  scenarios: readonly ChaosScenario[];
  failFast: boolean;
  rejectOnScenarioFailure: boolean;
}>;

export type CreateChaosTestingConfigurationInput = Readonly<{
  suiteId: string;
  scenarios: readonly ChaosScenario[];
  failFast?: boolean;
  rejectOnScenarioFailure?: boolean;
}>;

export function createChaosTestingConfiguration(
  input: CreateChaosTestingConfigurationInput,
): ChaosTestingConfiguration {
  const suiteId = required(input.suiteId, 'suiteId');
  const scenarios = validateScenarios(input.scenarios);

  return Object.freeze({
    suiteId,
    scenarios,
    failFast: input.failFast === true,
    rejectOnScenarioFailure: input.rejectOnScenarioFailure === true,
  });
}

function validateScenarios(
  scenarios: readonly ChaosScenario[] | null | undefined,
): readonly ChaosScenario[] {
  if (scenarios === null || scenarios === undefined) {
    throw new Error('scenarios are required');
  }
  if (scenarios.length === 0) {
    throw new Error('chaos testing suite must not be empty');
  }

  const seen = new Set<string>();
  const frozen: ChaosScenario[] = [];

  for (const scenario of scenarios) {
    const normalized = createChaosScenario(scenario);
    if (seen.has(normalized.scenarioId)) {
      throw new Error(`duplicate scenario identifier: ${normalized.scenarioId}`);
    }
    seen.add(normalized.scenarioId);
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
