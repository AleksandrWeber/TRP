/**
 * Immutable diagnostics for US202 Performance Analytics.
 */

export type PerformanceDiagnostics = Readonly<{
  warnings: readonly string[];
  anomalies: readonly string[];
  validationMessages: readonly string[];
}>;

export function createPerformanceDiagnostics(
  properties: PerformanceDiagnostics,
): PerformanceDiagnostics {
  return Object.freeze({
    warnings: freezeStringList(properties.warnings, 'warnings'),
    anomalies: freezeStringList(properties.anomalies, 'anomalies'),
    validationMessages: freezeStringList(properties.validationMessages, 'validationMessages'),
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
