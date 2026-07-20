/**
 * Individual readiness check outcome for US200 Live Readiness Review.
 */

export type ReadinessCheck = Readonly<{
  checkId: string;
  description: string;
  passed: boolean;
  warning: boolean;
}>;

export function createReadinessCheck(properties: ReadinessCheck): ReadinessCheck {
  return Object.freeze({
    checkId: required(properties.checkId, 'checkId'),
    description: required(properties.description, 'description'),
    passed: properties.passed === true,
    warning: properties.warning === true,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
