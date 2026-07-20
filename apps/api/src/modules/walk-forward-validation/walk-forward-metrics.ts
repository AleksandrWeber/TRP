/**
 * Walk-forward-only metrics for US194.
 *
 * No trading metrics, PnL, Sharpe, drawdown, or equity curve.
 */

export type WalkForwardMetrics = Readonly<{
  windowsExecuted: number;
  windowsFailed: number;
  candlesProcessed: number;
  cyclesExecuted: number;
  executionDuration: number;
}>;

export function createWalkForwardMetrics(properties: WalkForwardMetrics): WalkForwardMetrics {
  return Object.freeze({
    windowsExecuted: nonNegativeInteger(properties.windowsExecuted, 'windowsExecuted'),
    windowsFailed: nonNegativeInteger(properties.windowsFailed, 'windowsFailed'),
    candlesProcessed: nonNegativeInteger(properties.candlesProcessed, 'candlesProcessed'),
    cyclesExecuted: nonNegativeInteger(properties.cyclesExecuted, 'cyclesExecuted'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
