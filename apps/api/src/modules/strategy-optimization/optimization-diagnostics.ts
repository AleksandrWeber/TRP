/**
 * Immutable diagnostics for US203 Strategy Optimization.
 */

export type OptimizationDiagnostics = Readonly<{
  warnings: readonly string[];
  validationMessages: readonly string[];
  criteriaApplied: string;
}>;

export function createOptimizationDiagnostics(
  properties: OptimizationDiagnostics,
): OptimizationDiagnostics {
  return Object.freeze({
    warnings: freezeStringList(properties.warnings, 'warnings'),
    validationMessages: freezeStringList(properties.validationMessages, 'validationMessages'),
    criteriaApplied: required(properties.criteriaApplied, 'criteriaApplied'),
  });
}

function freezeStringList(values: readonly string[], field: string): readonly string[] {
  if (values === null || values === undefined) {
    throw new Error(`${field} are required`);
  }

  return Object.freeze(
    values.map((value, index) => {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${field}[${index}] must be a non-empty string`);
      }
      return value;
    }),
  );
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
