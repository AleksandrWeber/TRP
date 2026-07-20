import type { ExecutionSide } from './execution-side';

/**
 * Immutable execution request for US201 Execution Simulator.
 */
export type ExecutionRequest = Readonly<{
  requestId: string;
  symbol: string;
  side: ExecutionSide;
  quantity: number;
  requestedPrice: number;
  timestamp: string;
}>;

export function createExecutionRequest(properties: ExecutionRequest): ExecutionRequest {
  return Object.freeze({
    requestId: required(properties.requestId, 'requestId'),
    symbol: required(properties.symbol, 'symbol'),
    side: validSide(properties.side),
    quantity: positiveInteger(properties.quantity, 'quantity'),
    requestedPrice: nonNegativeNumber(properties.requestedPrice, 'requestedPrice'),
    timestamp: canonicalIso(properties.timestamp, 'timestamp'),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function validSide(value: ExecutionSide): ExecutionSide {
  if (value !== 'BUY' && value !== 'SELL') {
    throw new Error(`Invalid side: ${String(value)}`);
  }
  return value;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
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
