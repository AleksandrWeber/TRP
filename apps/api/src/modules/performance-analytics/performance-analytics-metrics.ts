/**
 * Performance analytics metrics for US202.
 *
 * No financial metrics beyond commission aggregation on execution results.
 */

export type PerformanceAnalyticsMetrics = Readonly<{
  analysisDuration: number;
  reportsGenerated: number;
  executionResultsProcessed: number;
}>;

export function createPerformanceAnalyticsMetrics(
  properties: PerformanceAnalyticsMetrics,
): PerformanceAnalyticsMetrics {
  return Object.freeze({
    analysisDuration: nonNegativeInteger(properties.analysisDuration, 'analysisDuration'),
    reportsGenerated: nonNegativeInteger(properties.reportsGenerated, 'reportsGenerated'),
    executionResultsProcessed: nonNegativeInteger(
      properties.executionResultsProcessed,
      'executionResultsProcessed',
    ),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
