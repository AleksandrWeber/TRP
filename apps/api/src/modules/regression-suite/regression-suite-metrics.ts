/**
 * Regression suite metrics for US198.
 *
 * No financial metrics.
 */

export type RegressionSuiteMetrics = Readonly<{
  scenariosExecuted: number;
  scenariosPassed: number;
  scenariosFailed: number;
  regressionsDetected: number;
  executionDuration: number;
}>;

export function createRegressionSuiteMetrics(
  properties: RegressionSuiteMetrics,
): RegressionSuiteMetrics {
  return Object.freeze({
    scenariosExecuted: nonNegativeInteger(properties.scenariosExecuted, 'scenariosExecuted'),
    scenariosPassed: nonNegativeInteger(properties.scenariosPassed, 'scenariosPassed'),
    scenariosFailed: nonNegativeInteger(properties.scenariosFailed, 'scenariosFailed'),
    regressionsDetected: nonNegativeInteger(properties.regressionsDetected, 'regressionsDetected'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
