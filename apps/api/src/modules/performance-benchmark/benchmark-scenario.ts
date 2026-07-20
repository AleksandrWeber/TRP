/**
 * Supported benchmark scenario identifiers (US196).
 */

export const BENCHMARK_SCENARIOS = Object.freeze([
  'Smoke',
  'HistoricalReplay',
  'WalkForward',
  'MultiYearResearch',
] as const);

export type BenchmarkScenario = (typeof BENCHMARK_SCENARIOS)[number];

export function isBenchmarkScenario(value: unknown): value is BenchmarkScenario {
  return typeof value === 'string' && (BENCHMARK_SCENARIOS as readonly string[]).includes(value);
}
