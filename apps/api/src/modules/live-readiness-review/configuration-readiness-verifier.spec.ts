import { describe, expect, it, vi } from 'vitest';
import { createPredefinedChaosTestingConfiguration } from '../chaos-testing';
import { createPredefinedRegressionSuiteConfiguration } from '../regression-suite';
import { createLiveReadinessReviewConfiguration } from './live-readiness-review-configuration';
import {
  createLiveReadinessDeterministicConfiguration,
  createLiveReadinessDeterministicDataset,
  LIVE_READINESS_REVIEW_ID,
} from './live-readiness-scenarios';

vi.mock('../performance-benchmark', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../performance-benchmark')>();
  return {
    ...actual,
    createPredefinedBenchmarkSuiteConfiguration: vi.fn(() => {
      throw new Error('invalid benchmark configuration');
    }),
  };
});

import { verifyConfigurationReadiness } from './configuration-readiness-verifier';

describe('US200 configuration-readiness-verifier mocked failures', () => {
  it('marks predefined configuration invalid when suite factory throws', () => {
    const configuration = createLiveReadinessReviewConfiguration({
      reviewId: LIVE_READINESS_REVIEW_ID,
      benchmarkConfiguration: {
        suiteId: 'benchmark-suite-196',
        benchmarks: Object.freeze([]),
      } as never,
      regressionConfiguration: createPredefinedRegressionSuiteConfiguration(),
      chaosConfiguration: createPredefinedChaosTestingConfiguration(),
      deterministicDataset: createLiveReadinessDeterministicDataset(),
      deterministicConfiguration: createLiveReadinessDeterministicConfiguration(),
    });

    const result = verifyConfigurationReadiness({ configuration });

    expect(
      result.checks.find((check) => check.checkId === 'configuration-predefined-valid')?.passed,
    ).toBe(false);
  });
});
