import type { BenchmarkSuiteConfiguration } from '../performance-benchmark';
import type { RegressionSuiteConfiguration } from '../regression-suite';
import type { ChaosTestingConfiguration } from '../chaos-testing';
import type { DeterministicReplayConfiguration } from '../deterministic-replay-validation';
import type { HistoricalDataset } from '../historical-replay';

/**
 * Live readiness review configuration for US200.
 */

export type LiveReadinessReviewConfiguration = Readonly<{
  reviewId: string;
  benchmarkConfiguration: BenchmarkSuiteConfiguration;
  regressionConfiguration: RegressionSuiteConfiguration;
  chaosConfiguration: ChaosTestingConfiguration;
  deterministicDataset: HistoricalDataset;
  deterministicConfiguration: DeterministicReplayConfiguration;
}>;

export type CreateLiveReadinessReviewConfigurationInput = Readonly<{
  reviewId: string;
  benchmarkConfiguration: BenchmarkSuiteConfiguration | null;
  regressionConfiguration: RegressionSuiteConfiguration | null;
  chaosConfiguration: ChaosTestingConfiguration | null;
  deterministicDataset: HistoricalDataset | null;
  deterministicConfiguration: DeterministicReplayConfiguration | null;
}>;

export function createLiveReadinessReviewConfiguration(
  input: CreateLiveReadinessReviewConfigurationInput,
): LiveReadinessReviewConfiguration {
  if (input.benchmarkConfiguration === null || input.benchmarkConfiguration === undefined) {
    throw new Error('benchmarkConfiguration is required');
  }
  if (input.regressionConfiguration === null || input.regressionConfiguration === undefined) {
    throw new Error('regressionConfiguration is required');
  }
  if (input.chaosConfiguration === null || input.chaosConfiguration === undefined) {
    throw new Error('chaosConfiguration is required');
  }
  if (input.deterministicDataset === null || input.deterministicDataset === undefined) {
    throw new Error('deterministicDataset is required');
  }
  if (input.deterministicDataset.candles.length === 0) {
    throw new Error('deterministicDataset must not be empty');
  }
  if (input.deterministicConfiguration === null || input.deterministicConfiguration === undefined) {
    throw new Error('deterministicConfiguration is required');
  }

  return Object.freeze({
    reviewId: required(input.reviewId, 'reviewId'),
    benchmarkConfiguration: input.benchmarkConfiguration,
    regressionConfiguration: input.regressionConfiguration,
    chaosConfiguration: input.chaosConfiguration,
    deterministicDataset: input.deterministicDataset,
    deterministicConfiguration: input.deterministicConfiguration,
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}
