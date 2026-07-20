/**
 * Immutable replay comparison mismatch for US197.
 *
 * No aggregate internals exposed.
 */

export type ReplayMismatch = Readonly<{
  iteration: number;
  field: string;
  expected: unknown;
  actual: unknown;
}>;

export function createReplayMismatch(properties: ReplayMismatch): ReplayMismatch {
  if (!Number.isInteger(properties.iteration) || properties.iteration < 2) {
    throw new Error('iteration must be an integer greater than or equal to 2');
  }

  const field = required(properties.field, 'field');

  return Object.freeze({
    iteration: properties.iteration,
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
