import { describe, expect, it } from 'vitest';
import { ENGINEERING_KINDS, OPTIMIZATION_CRITERIA, RESEARCH_KINDS } from './api';

describe('US192 Research Control Center API client', () => {
  it('exposes supported research kinds', () => {
    expect(RESEARCH_KINDS).toContain('SmokeBacktest');
    expect(RESEARCH_KINDS).toContain('MultiYearResearch');
  });

  it('exposes engineering suites', () => {
    expect(ENGINEERING_KINDS).toEqual([
      'PerformanceBenchmark',
      'DeterministicReplayValidation',
      'RegressionSuite',
      'ChaosTesting',
      'LiveReadinessReview',
    ]);
  });

  it('exposes optimization criteria', () => {
    expect(OPTIMIZATION_CRITERIA).toContain('highestExecutionSuccessRate');
  });
});
