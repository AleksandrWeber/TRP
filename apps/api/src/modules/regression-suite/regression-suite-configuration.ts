import { createRegressionScenario, type RegressionScenario } from './regression-scenario';

/**
 * Immutable regression suite configuration (US198).
 */

export type RegressionSuiteConfiguration = Readonly<{
  suiteId: string;
  scenarios: readonly RegressionScenario[];
  failFast: boolean;
  rejectOnRegression: boolean;
}>;

export type CreateRegressionSuiteConfigurationInput = Readonly<{
  suiteId: string;
  scenarios: readonly RegressionScenario[];
  failFast?: boolean;
  rejectOnRegression?: boolean;
}>;

export function createRegressionSuiteConfiguration(
  input: CreateRegressionSuiteConfigurationInput,
): RegressionSuiteConfiguration {
  const suiteId = required(input.suiteId, 'suiteId');
  const scenarios = validateScenarios(input.scenarios);

  return Object.freeze({
    suiteId,
    scenarios,
    failFast: input.failFast === true,
    rejectOnRegression: input.rejectOnRegression === true,
  });
}

function validateScenarios(
  scenarios: readonly RegressionScenario[] | null | undefined,
): readonly RegressionScenario[] {
  if (scenarios === null || scenarios === undefined) {
    throw new Error('scenarios are required');
  }
  if (scenarios.length === 0) {
    throw new Error('regression suite must not be empty');
  }

  const seen = new Set<string>();
  const frozen: RegressionScenario[] = [];

  for (const scenario of scenarios) {
    const normalized = createRegressionScenario(scenario);
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
