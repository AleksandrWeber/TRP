import type { BenchmarkScenario } from './benchmark-scenario';

/**
 * Immutable single-benchmark outcome (US196).
 *
 * Execution metrics only — no financial metrics.
 */

export type BenchmarkResult = Readonly<{
  benchmarkId: string;
  scenario: BenchmarkScenario;
  startedAt: string;
  completedAt: string;
  duration: number;
  datasetsProcessed: number;
  windowsProcessed: number;
  candlesProcessed: number;
  cyclesProcessed: number;
  throughputCandlesPerSecond: number;
  throughputCyclesPerSecond: number;
  success: boolean;
}>;

export function createBenchmarkResult(properties: BenchmarkResult): BenchmarkResult {
  return Object.freeze({
    benchmarkId: required(properties.benchmarkId, 'benchmarkId'),
    scenario: properties.scenario,
    startedAt: canonicalIso(properties.startedAt, 'startedAt'),
    completedAt: canonicalIso(properties.completedAt, 'completedAt'),
    duration: nonNegativeInteger(properties.duration, 'duration'),
    datasetsProcessed: nonNegativeInteger(properties.datasetsProcessed, 'datasetsProcessed'),
    windowsProcessed: nonNegativeInteger(properties.windowsProcessed, 'windowsProcessed'),
    candlesProcessed: nonNegativeInteger(properties.candlesProcessed, 'candlesProcessed'),
    cyclesProcessed: nonNegativeInteger(properties.cyclesProcessed, 'cyclesProcessed'),
    throughputCandlesPerSecond: nonNegativeNumber(
      properties.throughputCandlesPerSecond,
      'throughputCandlesPerSecond',
    ),
    throughputCyclesPerSecond: nonNegativeNumber(
      properties.throughputCyclesPerSecond,
      'throughputCyclesPerSecond',
    ),
    success: properties.success === true,
  });
}

export function calculateThroughput(count: number, durationMs: number): number {
  if (!Number.isFinite(count) || count < 0 || durationMs <= 0) {
    return 0;
  }
  return count / (durationMs / 1_000);
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
