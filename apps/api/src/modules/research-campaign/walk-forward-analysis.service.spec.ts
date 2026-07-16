import { describe, expect, it } from 'vitest';
import { WalkForwardAnalysisService } from './walk-forward-analysis.service';
import type { WalkForwardCampaignSummary } from './walk-forward-campaign.types';

function baseSummary(
  overrides: Partial<WalkForwardCampaignSummary> = {},
): WalkForwardCampaignSummary {
  return {
    datasetId: 'ds-1',
    strategyId: 'donchian-breakout',
    windowSize: 40,
    stepSize: 20,
    paramsCount: 1,
    windowCount: 3,
    successfulWindows: 3,
    failedWindows: 0,
    windows: [],
    averageProfitFactor: 1.2,
    averageReturnPercent: 4,
    averageMaxDrawdownPercent: 12,
    averageExpectancy: 1,
    bestWindowIndex: 1,
    worstWindowIndex: 0,
    passCount: 3,
    needsReviewCount: 0,
    failCount: 0,
    testPassCount: null,
    testNeedsReviewCount: null,
    testFailCount: null,
    averageTestReturnPercent: null,
    averageTestProfitFactor: null,
    averageTestMaxDrawdownPercent: null,
    overallVerdict: 'PASS',
    ...overrides,
  };
}

describe('WalkForwardAnalysisService', () => {
  const service = new WalkForwardAnalysisService();

  it('builds deterministic ROBUST analysis', () => {
    const summary = baseSummary({
      averageProfitFactor: 1.5,
      averageReturnPercent: 6,
      averageMaxDrawdownPercent: 8,
      passCount: 3,
      failCount: 0,
      failedWindows: 0,
      overallVerdict: 'PASS',
    });

    const first = service.buildAnalysis(summary);
    const second = service.buildAnalysis(summary);

    expect(first).toEqual(second);
    expect(first.overallAssessment).toBe('ROBUST');
    expect(first.stabilityScore).toBeGreaterThanOrEqual(70);
    expect(first.consistencyScore).toBeGreaterThanOrEqual(70);
    expect(first.strengths.some((item) => item.includes('passed'))).toBe(true);
    expect(first.recommendations).toEqual(
      expect.arrayContaining(['Preserve current configuration as a walk-forward benchmark.']),
    );
  });

  it('builds PROMISING analysis for moderate PASS campaign', () => {
    const summary = baseSummary({
      passCount: 2,
      failCount: 1,
      averageProfitFactor: 1.1,
      averageReturnPercent: 2,
      averageMaxDrawdownPercent: 18,
      overallVerdict: 'PASS',
    });

    const analysis = service.buildAnalysis(summary);

    expect(analysis.overallAssessment).toBe('PROMISING');
    expect(analysis.stabilityScore).toBeGreaterThanOrEqual(50);
    expect(analysis.consistencyScore).toBeGreaterThanOrEqual(50);
    expect(analysis.recommendations).toEqual(expect.arrayContaining(['Improve robustness']));
  });

  it('builds UNSTABLE analysis for weak mixed campaign', () => {
    const summary = baseSummary({
      passCount: 1,
      failCount: 2,
      failedWindows: 1,
      successfulWindows: 2,
      averageProfitFactor: 0.8,
      averageReturnPercent: -5,
      averageMaxDrawdownPercent: 35,
      overallVerdict: 'FAIL',
    });

    const analysis = service.buildAnalysis(summary);

    expect(analysis.overallAssessment).toBe('UNSTABLE');
    expect(analysis.weaknesses.some((item) => item.includes('failed validation'))).toBe(true);
    expect(analysis.recommendations).toEqual(
      expect.arrayContaining(['Improve robustness', 'Investigate unstable windows']),
    );
  });

  it('builds UNUSABLE analysis when all windows failed validation', () => {
    const summary = baseSummary({
      passCount: 0,
      failCount: 3,
      needsReviewCount: 0,
      averageProfitFactor: 0.5,
      averageReturnPercent: -10,
      averageMaxDrawdownPercent: 40,
      overallVerdict: 'FAIL',
    });

    const analysis = service.buildAnalysis(summary);

    expect(analysis.overallAssessment).toBe('UNUSABLE');
    expect(analysis.recommendations).toEqual(
      expect.arrayContaining(['Investigate unstable windows']),
    );
  });

  it('builds UNUSABLE analysis for empty summary', () => {
    const summary = baseSummary({
      windowCount: 0,
      successfulWindows: 0,
      failedWindows: 0,
      passCount: null,
      failCount: null,
      needsReviewCount: null,
      averageProfitFactor: null,
      averageReturnPercent: null,
      averageMaxDrawdownPercent: null,
      averageExpectancy: null,
      bestWindowIndex: null,
      worstWindowIndex: null,
      overallVerdict: 'FAIL',
    });

    const analysis = service.buildAnalysis(summary);

    expect(analysis.overallAssessment).toBe('UNUSABLE');
    expect(analysis.stabilityScore).toBe(0);
    expect(analysis.consistencyScore).toBe(0);
    expect(analysis.strengths).toEqual([]);
    expect(analysis.weaknesses).toContain(
      'No walk-forward windows were generated; evidence is insufficient.',
    );
    expect(analysis.recommendations).toEqual(expect.arrayContaining(['Increase sample size']));
  });

  it('penalizes consistency when error windows are present', () => {
    const clean = service.buildAnalysis(
      baseSummary({
        failedWindows: 0,
        successfulWindows: 3,
        averageReturnPercent: 4,
      }),
    );

    const withErrors = service.buildAnalysis(
      baseSummary({
        failedWindows: 2,
        successfulWindows: 1,
        averageReturnPercent: 4,
      }),
    );

    expect(withErrors.consistencyScore).toBeLessThan(clean.consistencyScore);
    expect(withErrors.weaknesses.some((item) => item.includes('execution errors'))).toBe(true);
    expect(withErrors.recommendations).toEqual(expect.arrayContaining(['Increase sample size']));
  });
});
