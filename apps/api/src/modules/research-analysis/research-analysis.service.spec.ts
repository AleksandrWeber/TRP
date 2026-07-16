import { describe, expect, it } from 'vitest';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { ResearchAnalysisService } from './research-analysis.service';

function baseReport(overrides: Partial<CampaignReport> = {}): CampaignReport {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 3,
    passCount: 0,
    failCount: 3,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 0.8,
    bestReturn: -2.5,
    bestExpectancy: -1.1,
    lowestDrawdown: 12.5,
    verdict: 'FAIL',
    recommendations: ['No configuration passed validation.'],
    createdAt: '2026-07-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('ResearchAnalysisService', () => {
  const service = new ResearchAnalysisService();

  it('builds deterministic analysis for PASS campaign', () => {
    const report = baseReport({
      passCount: 2,
      failCount: 1,
      needsReviewCount: 0,
      bestExperimentId: 'exp-pass',
      bestProfitFactor: 1.4,
      bestReturn: 8.2,
      bestExpectancy: 0.5,
      lowestDrawdown: 6.1,
      verdict: 'PASS',
      recommendations: ['Best candidate: period 20.'],
    });

    const first = service.buildAnalysis(report);
    const second = service.buildAnalysis(report);

    expect(first).toEqual(second);
    expect(first.executiveSummary).toContain('PASS');
    expect(first.executiveSummary).toContain('2/3');
    expect(first.strengths).toContain('2 configuration(s) passed validation.');
    expect(first.strengths.some((item) => item.includes('profit factor'))).toBe(true);
    expect(first.weaknesses).toContain('1 configuration(s) failed validation.');
    expect(first.recommendations).toEqual(
      expect.arrayContaining([
        'Best candidate: period 20.',
        'Preserve the passing configuration as a benchmark for the next hypothesis.',
      ]),
    );
    expect(first.nextHypothesis).toContain('passing');
    expect(first.nextHypothesis).toContain('donchian-breakout');
  });

  it('builds deterministic analysis for FAIL campaign', () => {
    const report = baseReport();
    const analysis = service.buildAnalysis(report);

    expect(analysis.executiveSummary).toContain('FAIL');
    expect(analysis.executiveSummary).toContain('3/3');
    expect(analysis.strengths.some((item) => item.includes('drawdown'))).toBe(true);
    expect(analysis.weaknesses).toEqual(
      expect.arrayContaining([
        '3 configuration(s) failed validation.',
        'No configuration fully passed validation.',
      ]),
    );
    expect(analysis.recommendations).toEqual(
      expect.arrayContaining([
        'No configuration passed validation.',
        'Do not promote this strategy class from the current campaign.',
      ]),
    );
    expect(analysis.nextHypothesis).toContain('Replace or filter');
  });

  it('builds deterministic analysis for NEEDS_REVIEW campaign', () => {
    const report = baseReport({
      passCount: 0,
      failCount: 1,
      needsReviewCount: 2,
      bestProfitFactor: 1.1,
      bestReturn: 1.5,
      bestExpectancy: 0.2,
      verdict: 'NEEDS_REVIEW',
      recommendations: ['No configuration fully passed; at least one needs manual review.'],
    });

    const analysis = service.buildAnalysis(report);

    expect(analysis.executiveSummary).toContain('NEEDS_REVIEW');
    expect(analysis.executiveSummary).toContain('2/3');
    expect(analysis.strengths).toContain('Best profit factor is 1.1.');
    expect(analysis.weaknesses).toContain('2 configuration(s) need manual review.');
    expect(analysis.recommendations).toEqual(
      expect.arrayContaining([
        'Inspect needs_review configurations before any promotion decision.',
      ]),
    );
    expect(analysis.nextHypothesis).toContain('Manually review');
  });

  it('builds deterministic analysis for empty campaign', () => {
    const report = baseReport({
      totalRuns: 0,
      passCount: 0,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: null,
      bestProfitFactor: null,
      bestReturn: null,
      bestExpectancy: null,
      lowestDrawdown: null,
      verdict: 'FAIL',
      recommendations: ['No configurations were run.'],
    });

    const analysis = service.buildAnalysis(report);

    expect(analysis.executiveSummary).toContain('no completed experiment results');
    expect(analysis.strengths).toEqual([]);
    expect(analysis.weaknesses).toEqual([
      'No configurations completed; campaign evidence is insufficient.',
    ]);
    expect(analysis.recommendations).toEqual([
      'Provide at least one parameter set and re-run the campaign.',
      'Do not promote this strategy until completed experiments exist.',
    ]);
    expect(analysis.nextHypothesis).toContain('non-empty paramsList');
  });
});
