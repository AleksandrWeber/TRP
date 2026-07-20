/**
 * Multi-year research metrics for US195.
 *
 * No trading metrics, PnL, Sharpe, drawdown, or equity curve.
 */

export type MultiYearResearchMetrics = Readonly<{
  datasetsProcessed: number;
  windowsExecuted: number;
  candlesProcessed: number;
  cyclesExecuted: number;
  executionDuration: number;
  failedDatasets: number;
}>;

export function createMultiYearResearchMetrics(
  properties: MultiYearResearchMetrics,
): MultiYearResearchMetrics {
  return Object.freeze({
    datasetsProcessed: nonNegativeInteger(properties.datasetsProcessed, 'datasetsProcessed'),
    windowsExecuted: nonNegativeInteger(properties.windowsExecuted, 'windowsExecuted'),
    candlesProcessed: nonNegativeInteger(properties.candlesProcessed, 'candlesProcessed'),
    cyclesExecuted: nonNegativeInteger(properties.cyclesExecuted, 'cyclesExecuted'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
    failedDatasets: nonNegativeInteger(properties.failedDatasets, 'failedDatasets'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
