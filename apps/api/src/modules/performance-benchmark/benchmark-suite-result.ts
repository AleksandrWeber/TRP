import type { BenchmarkResult } from './benchmark-result';

/**
 * Immutable aggregated benchmark suite outcome (US196).
 */

export type BenchmarkSuiteResult = Readonly<{
  suiteId: string;
  benchmarkResults: readonly BenchmarkResult[];
  totalDuration: number;
  averageThroughput: number;
  maximumDuration: number;
  minimumDuration: number;
}>;

export function createBenchmarkSuiteResult(properties: BenchmarkSuiteResult): BenchmarkSuiteResult {
  return Object.freeze({
    suiteId: required(properties.suiteId, 'suiteId'),
    benchmarkResults: Object.freeze([...properties.benchmarkResults]),
    totalDuration: nonNegativeInteger(properties.totalDuration, 'totalDuration'),
    averageThroughput: nonNegativeNumber(properties.averageThroughput, 'averageThroughput'),
    maximumDuration: nonNegativeInteger(properties.maximumDuration, 'maximumDuration'),
    minimumDuration: nonNegativeInteger(properties.minimumDuration, 'minimumDuration'),
  });
}

export function aggregateBenchmarkSuiteResult(
  suiteId: string,
  benchmarkResults: readonly BenchmarkResult[],
): BenchmarkSuiteResult {
  const durations = benchmarkResults.map((result) => result.duration);
  const throughputs = benchmarkResults.map((result) => result.throughputCandlesPerSecond);

  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const averageThroughput =
    throughputs.length === 0
      ? 0
      : throughputs.reduce((sum, throughput) => sum + throughput, 0) / throughputs.length;
  const maximumDuration = durations.length === 0 ? 0 : Math.max(...durations);
  const minimumDuration = durations.length === 0 ? 0 : Math.min(...durations);

  return createBenchmarkSuiteResult({
    suiteId,
    benchmarkResults,
    totalDuration,
    averageThroughput,
    maximumDuration,
    minimumDuration,
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

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}
