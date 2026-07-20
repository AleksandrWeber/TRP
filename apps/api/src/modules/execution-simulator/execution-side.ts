/**
 * Order side for US201 Execution Simulator.
 */

export const EXECUTION_SIDES = Object.freeze(['BUY', 'SELL'] as const);

export type ExecutionSide = (typeof EXECUTION_SIDES)[number];

export function isExecutionSide(value: unknown): value is ExecutionSide {
  return typeof value === 'string' && (EXECUTION_SIDES as readonly string[]).includes(value);
}
