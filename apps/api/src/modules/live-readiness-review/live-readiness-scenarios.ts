import {
  createHistoricalCandle,
  createHistoricalDataset,
  createReplayConfiguration,
  type HistoricalDataset,
} from '../historical-replay';
import { Timeframe } from '../market-data/timeframe';
import { createPredefinedChaosTestingConfiguration } from '../chaos-testing';
import { createDeterministicReplayConfiguration } from '../deterministic-replay-validation';
import {
  createPredefinedBenchmarkSuiteConfiguration,
  predefinedBenchmarkSuiteEntries,
} from '../performance-benchmark';
import {
  createPredefinedRegressionSuiteConfiguration,
  REGRESSION_DETERMINISTIC_CANDLE_COUNT,
  REGRESSION_DETERMINISTIC_DATASET_ID,
  REGRESSION_DETERMINISTIC_ITERATIONS,
  REGRESSION_DETERMINISTIC_VALIDATION_ID,
} from '../regression-suite';
import {
  createLiveReadinessReviewConfiguration,
  type LiveReadinessReviewConfiguration,
} from './live-readiness-review-configuration';

/**
 * Predefined live readiness review configuration and datasets (US200).
 */

export const LIVE_READINESS_REVIEW_ID = 'live-readiness-review-200';

export function createLiveReadinessDeterministicDataset(): HistoricalDataset {
  const candles = Array.from({ length: REGRESSION_DETERMINISTIC_CANDLE_COUNT }, (_, index) =>
    createHistoricalCandle({
      timestamp: `2026-07-19T20:${String(index * 5).padStart(2, '0')}:00.000Z`,
      open: 100 + index,
      high: 110 + index,
      low: 95 + index,
      close: 105 + index,
      volume: 1_000 + index,
    }),
  );

  return createHistoricalDataset({
    datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    candles,
  });
}

export function createLiveReadinessDeterministicConfiguration() {
  return createDeterministicReplayConfiguration({
    validationId: REGRESSION_DETERMINISTIC_VALIDATION_ID,
    replayConfiguration: createReplayConfiguration({
      datasetId: REGRESSION_DETERMINISTIC_DATASET_ID,
      endIndex: REGRESSION_DETERMINISTIC_CANDLE_COUNT - 1,
    }),
    iterations: REGRESSION_DETERMINISTIC_ITERATIONS,
    rejectOnMismatch: false,
  });
}

export function createPredefinedLiveReadinessReviewConfiguration(): LiveReadinessReviewConfiguration {
  return createLiveReadinessReviewConfiguration({
    reviewId: LIVE_READINESS_REVIEW_ID,
    benchmarkConfiguration: createPredefinedBenchmarkSuiteConfiguration(),
    regressionConfiguration: createPredefinedRegressionSuiteConfiguration(),
    chaosConfiguration: createPredefinedChaosTestingConfiguration(),
    deterministicDataset: createLiveReadinessDeterministicDataset(),
    deterministicConfiguration: createLiveReadinessDeterministicConfiguration(),
  });
}

export function predefinedLiveReadinessBenchmarkEntries(): readonly Readonly<{
  benchmarkId: string;
  scenario: string;
}>[] {
  return predefinedBenchmarkSuiteEntries();
}
