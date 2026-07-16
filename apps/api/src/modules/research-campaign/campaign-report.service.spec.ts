import { describe, expect, it } from 'vitest';
import { CampaignReportService } from './campaign-report.service';
import type { CampaignSummary } from './research-campaign.types';

function summary(partial: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 3,
    passCount: 0,
    failCount: 3,
    needsReviewCount: 0,
    bestExperimentId: 'exp-best',
    createdAt: '2026-07-16T12:00:00.000Z',
    failedRuns: [],
    ...partial,
  };
}

describe('CampaignReportService', () => {
  const service = new CampaignReportService();

  it('aggregates campaign statistics into the report', () => {
    const report = service.build(
      summary({
        passCount: 1,
        failCount: 1,
        needsReviewCount: 1,
        bestExperimentId: 'exp-2',
      }),
      [
        {
          id: 'exp-1',
          verdict: 'fail',
          metrics: {
            profitFactor: 0.5,
            totalReturnPercent: -10,
            expectancy: -20,
            maxDrawdownPercent: 30,
          },
          report: { params: { channelPeriod: 10 } },
        },
        {
          id: 'exp-2',
          verdict: 'pass',
          metrics: {
            profitFactor: 1.2,
            totalReturnPercent: 5,
            expectancy: 12,
            maxDrawdownPercent: 15,
          },
          report: { params: { channelPeriod: 20 } },
        },
        {
          id: 'exp-3',
          verdict: 'needs_review',
          metrics: {
            profitFactor: 1.0,
            totalReturnPercent: 1,
            expectancy: 2,
            maxDrawdownPercent: 20,
          },
          report: { params: { channelPeriod: 30 } },
        },
      ],
    );

    expect(report.campaignId).toBe('camp-1');
    expect(report.strategyId).toBe('donchian-breakout');
    expect(report.datasetId).toBe('ds-1');
    expect(report.totalRuns).toBe(3);
    expect(report.passCount).toBe(1);
    expect(report.failCount).toBe(1);
    expect(report.needsReviewCount).toBe(1);
    expect(report.createdAt).toBe('2026-07-16T12:00:00.000Z');
  });

  it('resolves verdict PASS / NEEDS_REVIEW / FAIL correctly', () => {
    expect(
      service.build(summary({ passCount: 1, failCount: 2, needsReviewCount: 0 }), []).verdict,
    ).toBe('PASS');

    expect(
      service.build(summary({ passCount: 0, failCount: 2, needsReviewCount: 1 }), []).verdict,
    ).toBe('NEEDS_REVIEW');

    expect(
      service.build(summary({ passCount: 0, failCount: 3, needsReviewCount: 0 }), []).verdict,
    ).toBe('FAIL');
  });

  it('selects best experiment metrics and lowest drawdown', () => {
    const report = service.build(summary({ bestExperimentId: 'exp-best', failCount: 2 }), [
      {
        id: 'exp-a',
        verdict: 'fail',
        metrics: {
          profitFactor: 0.4,
          totalReturnPercent: -12,
          expectancy: -30,
          maxDrawdownPercent: 40,
        },
        report: { params: { channelPeriod: 10 } },
      },
      {
        id: 'exp-best',
        verdict: 'fail',
        metrics: {
          profitFactor: 0.9,
          totalReturnPercent: -4,
          expectancy: -5,
          maxDrawdownPercent: 22,
        },
        report: { params: { channelPeriod: 20 } },
      },
    ]);

    expect(report.bestExperimentId).toBe('exp-best');
    expect(report.bestProfitFactor).toBe(0.9);
    expect(report.bestReturn).toBe(-4);
    expect(report.bestExpectancy).toBe(-5);
    expect(report.lowestDrawdown).toBe(22);
  });

  it('builds deterministic recommendations for a failing campaign', () => {
    const report = service.build(summary({ bestExperimentId: 'exp-best' }), [
      {
        id: 'exp-best',
        verdict: 'fail',
        metrics: {
          profitFactor: 0.8,
          totalReturnPercent: -5,
          expectancy: -8,
          maxDrawdownPercent: 18,
        },
        report: { params: { channelPeriod: 20 } },
      },
    ]);

    expect(report.verdict).toBe('FAIL');
    expect(report.recommendations).toEqual([
      'No configuration passed validation.',
      'Best candidate: period 20.',
      'Consider testing another strategy class.',
    ]);
  });

  it('returns a valid empty report for an empty campaign', () => {
    const report = service.build(
      summary({
        totalRuns: 0,
        passCount: 0,
        failCount: 0,
        needsReviewCount: 0,
        bestExperimentId: null,
      }),
      [],
    );

    expect(report.totalRuns).toBe(0);
    expect(report.bestExperimentId).toBeNull();
    expect(report.bestProfitFactor).toBeNull();
    expect(report.bestReturn).toBeNull();
    expect(report.bestExpectancy).toBeNull();
    expect(report.lowestDrawdown).toBeNull();
    expect(report.verdict).toBe('FAIL');
    expect(report.recommendations).toEqual([
      'No configurations were run.',
      'Provide at least one parameter set before starting a campaign.',
    ]);
  });
});
