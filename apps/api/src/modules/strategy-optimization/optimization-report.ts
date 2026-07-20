import {
  createOptimizationDiagnostics,
  type OptimizationDiagnostics,
} from './optimization-diagnostics';
import { createOptimizationResult, type OptimizationResult } from './optimization-result';

/**
 * Immutable optimization report for US203.
 */
export type OptimizationReport = Readonly<{
  reportId: string;
  bestConfiguration: OptimizationResult;
  rankedResults: readonly OptimizationResult[];
  diagnostics: OptimizationDiagnostics;
}>;

export function createOptimizationReport(properties: OptimizationReport): OptimizationReport {
  const rankedResults = validateRankedResults(properties.rankedResults);
  const bestConfiguration = createOptimizationResult(properties.bestConfiguration);

  if (rankedResults[0]?.configurationId !== bestConfiguration.configurationId) {
    throw new Error('bestConfiguration must match the highest-ranked result');
  }

  return Object.freeze({
    reportId: required(properties.reportId, 'reportId'),
    bestConfiguration,
    rankedResults,
    diagnostics: createOptimizationDiagnostics(properties.diagnostics),
  });
}

export function deterministicOptimizationReportId(optimizationId: string): string {
  return `optimization-report-${required(optimizationId, 'optimizationId')}`;
}

function validateRankedResults(
  results: readonly OptimizationResult[] | null | undefined,
): readonly OptimizationResult[] {
  if (results === null || results === undefined) {
    throw new Error('rankedResults are required');
  }
  if (results.length === 0) {
    throw new Error('rankedResults must not be empty');
  }

  const frozen = results.map((result) => createOptimizationResult(result));
  for (let index = 0; index < frozen.length; index += 1) {
    const expectedRank = index + 1;
    if (frozen[index]!.rank !== expectedRank) {
      throw new Error(`rankedResults[${index}] must have rank ${expectedRank}`);
    }
  }

  return Object.freeze(frozen);
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
