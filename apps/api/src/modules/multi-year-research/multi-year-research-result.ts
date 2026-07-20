import type { WalkForwardResult } from '../walk-forward-validation';

/**
 * Immutable Multi-Year Research outcome (US195).
 *
 * Aggregates execution metadata only — no financial metrics.
 */

export type MultiYearResearchResult = Readonly<{
  researchId: string;
  datasetsProcessed: number;
  datasetsSucceeded: number;
  datasetsFailed: number;
  walkForwardResults: readonly WalkForwardResult[];
  startedAt: string;
  completedAt: string;
  duration: number;
}>;

export function createMultiYearResearchResult(
  properties: MultiYearResearchResult,
): MultiYearResearchResult {
  return Object.freeze({
    researchId: required(properties.researchId, 'researchId'),
    datasetsProcessed: nonNegativeInteger(properties.datasetsProcessed, 'datasetsProcessed'),
    datasetsSucceeded: nonNegativeInteger(properties.datasetsSucceeded, 'datasetsSucceeded'),
    datasetsFailed: nonNegativeInteger(properties.datasetsFailed, 'datasetsFailed'),
    walkForwardResults: Object.freeze([...properties.walkForwardResults]),
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
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
