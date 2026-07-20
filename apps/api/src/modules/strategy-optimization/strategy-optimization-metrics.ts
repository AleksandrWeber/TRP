/**
 * Operational metrics for US203 Strategy Optimization.
 *
 * No financial metrics — only execution counters and duration.
 */

export type StrategyOptimizationMetrics = Readonly<{
  configurationsEvaluated: number;
  optimizationDuration: number;
  reportsGenerated: number;
}>;

export function createStrategyOptimizationMetrics(
  properties: StrategyOptimizationMetrics,
): StrategyOptimizationMetrics {
  return Object.freeze({
    configurationsEvaluated: nonNegativeInteger(
      properties.configurationsEvaluated,
      'configurationsEvaluated',
    ),
    optimizationDuration: nonNegativeInteger(
      properties.optimizationDuration,
      'optimizationDuration',
    ),
    reportsGenerated: nonNegativeInteger(properties.reportsGenerated, 'reportsGenerated'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
