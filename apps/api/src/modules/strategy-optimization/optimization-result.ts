import type { PerformanceReport } from '../performance-analytics';

/**
 * Per-configuration optimization outcome for US203.
 */
export type OptimizationResult = Readonly<{
  configurationId: string;
  performanceReport: PerformanceReport;
  score: number;
  rank: number;
}>;

export function createOptimizationResult(properties: OptimizationResult): OptimizationResult {
  return Object.freeze({
    configurationId: required(properties.configurationId, 'configurationId'),
    performanceReport: properties.performanceReport,
    score: finiteScore(properties.score, 'score'),
    rank: positiveInteger(properties.rank, 'rank'),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function finiteScore(value: number, field: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
