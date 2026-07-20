/**
 * Fill-level execution status for US201 Execution Simulator.
 */

export const SIMULATED_EXECUTION_STATUSES = Object.freeze([
  'FILLED',
  'PARTIALLY_FILLED',
  'REJECTED',
] as const);

export type SimulatedExecutionStatus = (typeof SIMULATED_EXECUTION_STATUSES)[number];

export function isSimulatedExecutionStatus(value: unknown): value is SimulatedExecutionStatus {
  return (
    typeof value === 'string' && (SIMULATED_EXECUTION_STATUSES as readonly string[]).includes(value)
  );
}
