/**
 * Immutable aggregated research metadata for US195.
 *
 * Execution metadata only — no financial metrics.
 */

export type ResearchSummary = Readonly<{
  researchId: string;
  datasetsProcessed: number;
  datasetsSucceeded: number;
  datasetsFailed: number;
  totalWindows: number;
  totalCandles: number;
  totalCycles: number;
  executionDuration: number;
}>;

export function createResearchSummary(properties: ResearchSummary): ResearchSummary {
  return Object.freeze({
    researchId: required(properties.researchId, 'researchId'),
    datasetsProcessed: nonNegativeInteger(properties.datasetsProcessed, 'datasetsProcessed'),
    datasetsSucceeded: nonNegativeInteger(properties.datasetsSucceeded, 'datasetsSucceeded'),
    datasetsFailed: nonNegativeInteger(properties.datasetsFailed, 'datasetsFailed'),
    totalWindows: nonNegativeInteger(properties.totalWindows, 'totalWindows'),
    totalCandles: nonNegativeInteger(properties.totalCandles, 'totalCandles'),
    totalCycles: nonNegativeInteger(properties.totalCycles, 'totalCycles'),
    executionDuration: nonNegativeInteger(properties.executionDuration, 'executionDuration'),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}
