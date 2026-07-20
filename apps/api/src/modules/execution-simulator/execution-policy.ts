/**
 * Immutable execution policy for US201 Execution Simulator.
 */
export type ExecutionPolicy = Readonly<{
  allowPartialFill: boolean;
  deterministicSlippage: number;
  fixedCommission: number;
}>;

export function createExecutionPolicy(properties: ExecutionPolicy): ExecutionPolicy {
  return Object.freeze({
    allowPartialFill: properties.allowPartialFill === true,
    deterministicSlippage: nonNegativeNumber(
      properties.deterministicSlippage,
      'deterministicSlippage',
    ),
    fixedCommission: nonNegativeNumber(properties.fixedCommission, 'fixedCommission'),
  });
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}
