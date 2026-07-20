/**
 * Immutable regression comparison mismatch for US198.
 */

export type RegressionMismatch = Readonly<{
  scenarioId: string;
  field: string;
  expected: unknown;
  actual: unknown;
}>;

export function createRegressionMismatch(properties: RegressionMismatch): RegressionMismatch {
  const scenarioId = required(properties.scenarioId, 'scenarioId');
  const field = required(properties.field, 'field');

  return Object.freeze({
    scenarioId,
    field,
    expected: properties.expected,
    actual: properties.actual,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
