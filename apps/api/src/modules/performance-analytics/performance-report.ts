import {
  createPerformanceDiagnostics,
  type PerformanceDiagnostics,
} from './performance-diagnostics';

/**
 * Immutable performance report for US202.
 *
 * Aggregates execution-level metrics only. No PnL, ROI, or portfolio state.
 */
export type PerformanceReport = Readonly<{
  reportId: string;
  generatedAt: string;
  totalExecutions: number;
  filledExecutions: number;
  partialFilledExecutions: number;
  rejectedExecutions: number;
  totalCommission: number;
  averageCommission: number;
  averageExecutionPrice: number;
  averageSlippage: number;
  executionSuccessRate: number;
  averageExecutionDuration: number;
  diagnostics: PerformanceDiagnostics;
}>;

export function createPerformanceReport(properties: PerformanceReport): PerformanceReport {
  return Object.freeze({
    reportId: required(properties.reportId, 'reportId'),
    generatedAt: canonicalIso(properties.generatedAt, 'generatedAt'),
    totalExecutions: nonNegativeInteger(properties.totalExecutions, 'totalExecutions'),
    filledExecutions: nonNegativeInteger(properties.filledExecutions, 'filledExecutions'),
    partialFilledExecutions: nonNegativeInteger(
      properties.partialFilledExecutions,
      'partialFilledExecutions',
    ),
    rejectedExecutions: nonNegativeInteger(properties.rejectedExecutions, 'rejectedExecutions'),
    totalCommission: nonNegativeNumber(properties.totalCommission, 'totalCommission'),
    averageCommission: nonNegativeNumber(properties.averageCommission, 'averageCommission'),
    averageExecutionPrice: nonNegativeNumber(
      properties.averageExecutionPrice,
      'averageExecutionPrice',
    ),
    averageSlippage: nonNegativeNumber(properties.averageSlippage, 'averageSlippage'),
    executionSuccessRate: rate(properties.executionSuccessRate, 'executionSuccessRate'),
    averageExecutionDuration: nonNegativeInteger(
      properties.averageExecutionDuration,
      'averageExecutionDuration',
    ),
    diagnostics: createPerformanceDiagnostics(properties.diagnostics),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function canonicalIso(value: string, field: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}

function rate(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be a number between 0 and 1`);
  }
  return value;
}
