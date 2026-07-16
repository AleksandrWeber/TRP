import { describe, expect, it } from 'vitest';
import type { CampaignSummary } from './research-campaign.types';
import {
  buildWalkForwardAggregate,
  type WalkForwardAggregateWindow,
  type WalkForwardWindowMetrics,
} from './walk-forward-aggregate';

describe('buildWalkForwardAggregate', () => {
  const metrics = (
    overrides: Partial<WalkForwardWindowMetrics> = {},
  ): WalkForwardWindowMetrics => ({
    profitFactor: 1.2,
    totalReturnPercent: 5,
    maxDrawdownPercent: 10,
    expectancy: 2,
    ...overrides,
  });

  const summary = (
    overrides: Partial<CampaignSummary> & Pick<CampaignSummary, 'campaignId'>,
  ): CampaignSummary => ({
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    createdAt: '2026-07-16T12:00:00.000Z',
    failedRuns: [],
    ...overrides,
  });

  const window = (
    windowIndex: number,
    summaryOverrides: Partial<CampaignSummary> & Pick<CampaignSummary, 'campaignId'>,
    metricsOverrides: Partial<WalkForwardWindowMetrics> = {},
    test?: {
      verdict?: string | null;
      metrics?: Partial<WalkForwardWindowMetrics> | null;
    },
  ): WalkForwardAggregateWindow => ({
    windowIndex,
    summary: summary(summaryOverrides),
    metrics: metrics(metricsOverrides),
    testVerdict: test?.verdict,
    testMetrics:
      test?.metrics === null ? null : test?.metrics != null ? metrics(test.metrics) : undefined,
  });

  it('aggregates only train when test evaluation is absent', () => {
    const result = buildWalkForwardAggregate([
      window(0, { campaignId: 'c1', passCount: 1 }, { profitFactor: 1.0, totalReturnPercent: 4 }),
      window(1, { campaignId: 'c2', passCount: 1 }, { profitFactor: 1.4, totalReturnPercent: 6 }),
    ]);

    expect(result.passCount).toBe(2);
    expect(result.needsReviewCount).toBe(0);
    expect(result.failCount).toBe(0);
    expect(result.averageProfitFactor).toBe(1.2);
    expect(result.averageReturnPercent).toBe(5);
    expect(result.bestWindowIndex).toBe(1);
    expect(result.worstWindowIndex).toBe(0);
    expect(result.testPassCount).toBeNull();
    expect(result.testNeedsReviewCount).toBeNull();
    expect(result.testFailCount).toBeNull();
    expect(result.averageTestProfitFactor).toBeNull();
    expect(result.averageTestReturnPercent).toBeNull();
    expect(result.averageTestMaxDrawdownPercent).toBeNull();
    expect(result.overallVerdict).toBe('FAIL');
  });

  it('aggregates train + test and sets overallVerdict from test', () => {
    const result = buildWalkForwardAggregate([
      window(
        0,
        { campaignId: 'c1', passCount: 1 },
        { profitFactor: 1.0, totalReturnPercent: 4, maxDrawdownPercent: 8 },
        {
          verdict: 'pass',
          metrics: { profitFactor: 0.9, totalReturnPercent: 1, maxDrawdownPercent: 12 },
        },
      ),
      window(
        1,
        { campaignId: 'c2', passCount: 1 },
        { profitFactor: 1.4, totalReturnPercent: 6, maxDrawdownPercent: 10 },
        {
          verdict: 'pass',
          metrics: { profitFactor: 1.1, totalReturnPercent: 3, maxDrawdownPercent: 14 },
        },
      ),
    ]);

    expect(result.passCount).toBe(2);
    expect(result.averageProfitFactor).toBe(1.2);
    expect(result.testPassCount).toBe(2);
    expect(result.testNeedsReviewCount).toBe(0);
    expect(result.testFailCount).toBe(0);
    expect(result.averageTestProfitFactor).toBe(1.0);
    expect(result.averageTestReturnPercent).toBe(2);
    expect(result.averageTestMaxDrawdownPercent).toBe(13);
    expect(result.overallVerdict).toBe('PASS');
  });

  it('resolves mixed test verdicts for overallVerdict', () => {
    const result = buildWalkForwardAggregate([
      window(0, { campaignId: 'c1', passCount: 1 }, {}, { verdict: 'pass', metrics: {} }),
      window(
        1,
        { campaignId: 'c2', passCount: 1 },
        {},
        { verdict: 'needs_review', metrics: { profitFactor: 1.0 } },
      ),
    ]);

    expect(result.passCount).toBe(2);
    expect(result.testPassCount).toBe(1);
    expect(result.testNeedsReviewCount).toBe(1);
    expect(result.testFailCount).toBe(0);
    expect(result.overallVerdict).toBe('NEEDS_REVIEW');
  });

  it('resolves FAIL overall when any test window fails', () => {
    const result = buildWalkForwardAggregate([
      window(0, { campaignId: 'c1', passCount: 1 }, {}, { verdict: 'pass', metrics: null }),
      window(
        1,
        { campaignId: 'c2', passCount: 1 },
        {},
        { verdict: 'fail', metrics: { profitFactor: 0.4, totalReturnPercent: -5 } },
      ),
    ]);

    expect(result.passCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(result.testPassCount).toBe(1);
    expect(result.testFailCount).toBe(1);
    expect(result.averageTestProfitFactor).toBe(0.4);
    expect(result.overallVerdict).toBe('FAIL');
  });

  it('keeps train aggregate when test metrics are empty', () => {
    const result = buildWalkForwardAggregate([
      window(
        0,
        { campaignId: 'c1', passCount: 1 },
        { profitFactor: 1.5 },
        {
          verdict: 'pass',
          metrics: null,
        },
      ),
      window(
        1,
        { campaignId: 'c2', passCount: 0, failCount: 1 },
        { profitFactor: 0.8 },
        {
          verdict: 'pass',
          metrics: null,
        },
      ),
    ]);

    expect(result.passCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(result.averageProfitFactor).toBe(1.15);
    expect(result.testPassCount).toBe(2);
    expect(result.averageTestProfitFactor).toBeNull();
    expect(result.averageTestReturnPercent).toBeNull();
    expect(result.averageTestMaxDrawdownPercent).toBeNull();
    expect(result.overallVerdict).toBe('PASS');
  });

  it('ignores train NEEDS_REVIEW / FAIL for overallVerdict when tests pass', () => {
    const result = buildWalkForwardAggregate([
      window(
        0,
        { campaignId: 'c1', passCount: 0, needsReviewCount: 1 },
        {},
        { verdict: 'pass', metrics: { profitFactor: 1.2 } },
      ),
      window(
        1,
        { campaignId: 'c2', passCount: 0, failCount: 1 },
        {},
        { verdict: 'pass', metrics: { profitFactor: 1.0 } },
      ),
    ]);

    expect(result.needsReviewCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(result.testPassCount).toBe(2);
    expect(result.overallVerdict).toBe('PASS');
  });

  it('ignores error windows by only aggregating successful inputs', () => {
    const result = buildWalkForwardAggregate([
      window(
        1,
        { campaignId: 'c2', passCount: 1 },
        { profitFactor: 1.5 },
        {
          verdict: 'pass',
          metrics: { profitFactor: 1.2 },
        },
      ),
    ]);

    expect(result.overallVerdict).toBe('PASS');
    expect(result.passCount).toBe(1);
    expect(result.averageProfitFactor).toBe(1.5);
    expect(result.testPassCount).toBe(1);
    expect(result.averageTestProfitFactor).toBe(1.2);
    expect(result.bestWindowIndex).toBe(1);
    expect(result.worstWindowIndex).toBe(1);
  });

  it('returns null aggregates and FAIL when there are no successful windows', () => {
    const result = buildWalkForwardAggregate([]);

    expect(result).toEqual({
      averageProfitFactor: null,
      averageReturnPercent: null,
      averageMaxDrawdownPercent: null,
      averageExpectancy: null,
      bestWindowIndex: null,
      worstWindowIndex: null,
      passCount: null,
      needsReviewCount: null,
      failCount: null,
      testPassCount: null,
      testNeedsReviewCount: null,
      testFailCount: null,
      averageTestReturnPercent: null,
      averageTestProfitFactor: null,
      averageTestMaxDrawdownPercent: null,
      overallVerdict: 'FAIL',
    });
  });

  it('picks best and worst train window by profit factor', () => {
    const result = buildWalkForwardAggregate([
      window(0, { campaignId: 'c1' }, { profitFactor: 1.1 }),
      window(2, { campaignId: 'c2' }, { profitFactor: 0.4 }),
      window(4, { campaignId: 'c3' }, { profitFactor: 1.9 }),
    ]);

    expect(result.bestWindowIndex).toBe(4);
    expect(result.worstWindowIndex).toBe(2);
    expect(result.averageProfitFactor).toBeCloseTo((1.1 + 0.4 + 1.9) / 3);
    expect(result.overallVerdict).toBe('FAIL');
  });
});
