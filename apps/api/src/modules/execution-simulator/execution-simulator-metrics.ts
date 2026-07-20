/**
 * Execution simulator metrics for US201.
 *
 * No financial metrics beyond fixed commission accounting on individual results.
 */

export type ExecutionSimulatorMetrics = Readonly<{
  executionCount: number;
  filled: number;
  rejected: number;
  averageExecutionTime: number;
}>;

export function createExecutionSimulatorMetrics(
  properties: ExecutionSimulatorMetrics,
): ExecutionSimulatorMetrics {
  return Object.freeze({
    executionCount: nonNegativeInteger(properties.executionCount, 'executionCount'),
    filled: nonNegativeInteger(properties.filled, 'filled'),
    rejected: nonNegativeInteger(properties.rejected, 'rejected'),
    averageExecutionTime: nonNegativeInteger(
      properties.averageExecutionTime,
      'averageExecutionTime',
    ),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
