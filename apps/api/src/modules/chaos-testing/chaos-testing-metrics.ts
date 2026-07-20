/**
 * Chaos testing metrics for US199.
 */

export type ChaosTestingMetrics = Readonly<{
  scenariosExecuted: number;
  scenariosPassed: number;
  scenariosFailed: number;
  executionDuration: number;
}>;

export function createChaosTestingMetrics(properties: ChaosTestingMetrics): ChaosTestingMetrics {
  return Object.freeze({
    scenariosExecuted: nonNegativeInteger(properties.scenariosExecuted, 'scenariosExecuted'),
    scenariosPassed: nonNegativeInteger(properties.scenariosPassed, 'scenariosPassed'),
    scenariosFailed: nonNegativeInteger(properties.scenariosFailed, 'scenariosFailed'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
