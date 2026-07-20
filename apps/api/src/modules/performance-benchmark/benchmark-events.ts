import type { BenchmarkScenario } from './benchmark-scenario';

/**
 * Application events for US196 Performance Benchmark.
 *
 * Collected in-memory by PerformanceBenchmarkService. No transport layer
 * and no message bus.
 */

export const PERFORMANCE_BENCHMARK_EVENT_TYPES = Object.freeze([
  'BenchmarkStarted',
  'BenchmarkCompleted',
  'BenchmarkFailed',
  'SuiteCompleted',
] as const);

export type PerformanceBenchmarkEventType = (typeof PERFORMANCE_BENCHMARK_EVENT_TYPES)[number];

type BenchmarkEventBase<Type extends string> = Readonly<{
  eventType: Type;
  suiteId: string;
  occurredAt: string;
}>;

export type BenchmarkStarted = BenchmarkEventBase<'BenchmarkStarted'> &
  Readonly<{
    benchmarkId: string;
    scenario: BenchmarkScenario;
  }>;

export type BenchmarkCompleted = BenchmarkEventBase<'BenchmarkCompleted'> &
  Readonly<{
    benchmarkId: string;
    scenario: BenchmarkScenario;
    duration: number;
    candlesProcessed: number;
    cyclesProcessed: number;
    completedAt: string;
  }>;

export type BenchmarkFailed = BenchmarkEventBase<'BenchmarkFailed'> &
  Readonly<{
    benchmarkId: string;
    scenario: BenchmarkScenario;
    reason: string;
    failedAt: string;
  }>;

export type SuiteCompleted = BenchmarkEventBase<'SuiteCompleted'> &
  Readonly<{
    totalBenchmarks: number;
    succeededBenchmarks: number;
    failedBenchmarks: number;
    totalDuration: number;
    completedAt: string;
  }>;

export type PerformanceBenchmarkEvent =
  BenchmarkStarted | BenchmarkCompleted | BenchmarkFailed | SuiteCompleted;
