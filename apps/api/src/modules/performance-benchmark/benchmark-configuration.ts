import { isBenchmarkScenario, type BenchmarkScenario } from './benchmark-scenario';

/**
 * Immutable benchmark suite configuration (US196).
 */

export type BenchmarkEntryConfiguration = Readonly<{
  benchmarkId: string;
  scenario: BenchmarkScenario;
}>;

export type BenchmarkSuiteConfiguration = Readonly<{
  suiteId: string;
  benchmarks: readonly BenchmarkEntryConfiguration[];
}>;

export type CreateBenchmarkSuiteConfigurationInput = Readonly<{
  suiteId: string;
  benchmarks: readonly BenchmarkEntryConfiguration[];
}>;

export function createBenchmarkSuiteConfiguration(
  input: CreateBenchmarkSuiteConfigurationInput,
): BenchmarkSuiteConfiguration {
  const suiteId = required(input.suiteId, 'suiteId');
  const benchmarks = validateBenchmarks(input.benchmarks);

  return Object.freeze({
    suiteId,
    benchmarks,
  });
}

function validateBenchmarks(
  benchmarks: readonly BenchmarkEntryConfiguration[] | null | undefined,
): readonly BenchmarkEntryConfiguration[] {
  if (benchmarks === null || benchmarks === undefined) {
    throw new Error('benchmarks are required');
  }
  if (benchmarks.length === 0) {
    throw new Error('benchmark suite must not be empty');
  }

  const seen = new Set<string>();
  const frozen: BenchmarkEntryConfiguration[] = [];

  for (const entry of benchmarks) {
    const benchmarkId = required(entry.benchmarkId, 'benchmarkId');
    if (seen.has(benchmarkId)) {
      throw new Error(`duplicate benchmark identifier: ${benchmarkId}`);
    }
    seen.add(benchmarkId);

    if (!isBenchmarkScenario(entry.scenario)) {
      throw new Error(`unsupported scenario: ${String(entry.scenario)}`);
    }

    frozen.push(
      Object.freeze({
        benchmarkId,
        scenario: entry.scenario,
      }),
    );
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
