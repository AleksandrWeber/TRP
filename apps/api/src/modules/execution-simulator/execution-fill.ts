import type { SimulatedExecutionStatus } from './execution-fill-status';
import { isSimulatedExecutionStatus } from './execution-fill-status';

/**
 * Immutable execution fill for US201 Execution Simulator.
 */
export type ExecutionFill = Readonly<{
  fillId: string;
  requestId: string;
  executedPrice: number;
  executedQuantity: number;
  timestamp: string;
  executionStatus: SimulatedExecutionStatus;
}>;

export function createExecutionFill(properties: ExecutionFill): ExecutionFill {
  return Object.freeze({
    fillId: required(properties.fillId, 'fillId'),
    requestId: required(properties.requestId, 'requestId'),
    executedPrice: nonNegativeNumber(properties.executedPrice, 'executedPrice'),
    executedQuantity: nonNegativeInteger(properties.executedQuantity, 'executedQuantity'),
    timestamp: canonicalIso(properties.timestamp, 'timestamp'),
    executionStatus: validExecutionStatus(properties.executionStatus),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function validExecutionStatus(value: SimulatedExecutionStatus): SimulatedExecutionStatus {
  if (!isSimulatedExecutionStatus(value)) {
    throw new Error(`Invalid executionStatus: ${String(value)}`);
  }
  return value;
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function canonicalIso(value: string, field: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}
