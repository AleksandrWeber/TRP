import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignReportService } from './campaign-report.service';
import { ResearchCampaignService } from './research-campaign.service';

describe('ResearchCampaignService', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;

  beforeEach(() => {
    experiments = {
      run: vi.fn(),
    };
    service = new ResearchCampaignService(experiments as never);
  });

  it('runs all configs and creates one experiment per config', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'fail',
        metrics: { profitFactor: 0.5 },
        report: { params: { channelPeriod: 10 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-2',
        verdict: 'pass',
        metrics: { profitFactor: 1.2 },
        report: { params: { channelPeriod: 20 } },
      })
      .mockResolvedValueOnce({
        id: 'exp-3',
        verdict: 'needs_review',
        metrics: { profitFactor: 1.0 },
        report: { params: { channelPeriod: 30 } },
      });

    const paramsList = [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }];

    const { summary, experiments: created } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList,
    });

    expect(experiments.run).toHaveBeenCalledTimes(3);
    expect(created).toHaveLength(3);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(1);
    expect(summary.needsReviewCount).toBe(1);
    expect(summary.failedRuns).toEqual([]);
  });

  it('builds campaign summary aggregates correctly', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-a',
        verdict: 'fail',
        metrics: { profitFactor: 0.4 },
      })
      .mockResolvedValueOnce({
        id: 'exp-b',
        verdict: 'fail',
        metrics: { profitFactor: 0.7 },
      })
      .mockResolvedValueOnce({
        id: 'exp-c',
        verdict: 'pass',
        metrics: { profitFactor: 1.1 },
      });

    const { summary } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'ema-crossover',
      paramsList: [{ emaFast: 5 }, { emaFast: 8 }, { emaFast: 12 }],
    });

    expect(summary.campaignId).toBeTruthy();
    expect(summary.strategyId).toBe('ema-crossover');
    expect(summary.datasetId).toBe('ds-1');
    expect(summary.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(2);
    expect(summary.needsReviewCount).toBe(0);
  });

  it('selects bestExperimentId by highest profit factor', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-low',
        verdict: 'fail',
        metrics: { profitFactor: 0.3 },
      })
      .mockResolvedValueOnce({
        id: 'exp-best',
        verdict: 'fail',
        metrics: { profitFactor: 0.9 },
      })
      .mockResolvedValueOnce({
        id: 'exp-mid',
        verdict: 'fail',
        metrics: { profitFactor: 0.6 },
      });

    const { summary } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
    });

    expect(summary.bestExperimentId).toBe('exp-best');
  });

  it('continues campaign when one run fails and records it in summary', async () => {
    experiments.run
      .mockResolvedValueOnce({
        id: 'exp-1',
        verdict: 'pass',
        metrics: { profitFactor: 1.05 },
      })
      .mockRejectedValueOnce(new Error('dataset missing'))
      .mockResolvedValueOnce({
        id: 'exp-3',
        verdict: 'fail',
        metrics: { profitFactor: 0.8 },
      });

    const { summary, experiments: created } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
    });

    expect(experiments.run).toHaveBeenCalledTimes(3);
    expect(created).toHaveLength(2);
    expect(summary.totalRuns).toBe(3);
    expect(summary.passCount).toBe(1);
    expect(summary.failCount).toBe(1);
    expect(summary.needsReviewCount).toBe(0);
    expect(summary.bestExperimentId).toBe('exp-1');
    expect(summary.failedRuns).toEqual([
      {
        params: { channelPeriod: 20 },
        error: 'dataset missing',
      },
    ]);
  });
});

describe('ResearchCampaignService slice support', () => {
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: ResearchCampaignService;
  let reports: CampaignReportService;

  beforeEach(() => {
    experiments = {
      run: vi.fn(),
    };
    service = new ResearchCampaignService(experiments as never);
    reports = new CampaignReportService();
  });

  it('runs a campaign on the full dataset without sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.2 },
      report: { params: { channelPeriod: 10 } },
    });

    const {
      summary,
      experiments: created,
      sliceIdentity,
    } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      undefined,
    );
    expect(sliceIdentity).toBeUndefined();
    expect(created).toHaveLength(1);

    const report = reports.build(summary, created);
    expect(report).not.toHaveProperty('sliceIdentity');
  });

  it('runs a campaign on a TRAIN slice and records sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-train',
      verdict: 'pass',
      metrics: { profitFactor: 1.1 },
      report: { params: { channelPeriod: 10 }, sliceIdentity: 'ds-1:0:39:TRAIN' },
    });

    const sliceRef = {
      datasetId: 'ds-1',
      startIndex: 0,
      endIndex: 39,
      role: 'TRAIN' as const,
    };

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
      sliceRef,
    });

    expect(experiments.run).toHaveBeenCalledTimes(2);
    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      sliceRef,
    );
    expect(result.sliceIdentity).toBe('ds-1:0:39:TRAIN');

    const report = reports.build(result.summary, result.experiments, {
      sliceIdentity: result.sliceIdentity,
    });
    expect(report.sliceIdentity).toBe('ds-1:0:39:TRAIN');
  });

  it('runs a campaign on a TEST slice and records sliceIdentity', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-test',
      verdict: 'fail',
      metrics: { profitFactor: 0.8 },
    });

    const sliceRef = {
      datasetId: 'ds-1',
      startIndex: 40,
      endIndex: 59,
      role: 'TEST' as const,
    };

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      sliceRef,
    });

    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 10 },
      sliceRef,
    );
    expect(result.sliceIdentity).toBe('ds-1:40:59:TEST');

    const report = reports.build(result.summary, result.experiments, {
      sliceIdentity: result.sliceIdentity,
    });
    expect(report.sliceIdentity).toBe('ds-1:40:59:TEST');
  });

  it('records failed runs when the slice is invalid for experiments', async () => {
    experiments.run.mockRejectedValue(new Error('Slice endIndex 99 is out of bounds'));

    const result = await service.run({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      sliceRef: {
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 99,
        role: 'TRAIN',
      },
    });

    expect(result.experiments).toHaveLength(0);
    expect(result.summary.failedRuns).toHaveLength(1);
    expect(result.summary.failedRuns[0].error).toContain('out of bounds');
    expect(result.sliceIdentity).toBe('ds-1:0:99:TRAIN');
  });

  it('does not put sliceIdentity on full-dataset campaign reports', async () => {
    experiments.run.mockResolvedValue({
      id: 'exp-1',
      verdict: 'pass',
      metrics: { profitFactor: 1.0 },
    });

    const {
      summary,
      experiments: created,
      sliceIdentity,
    } = await service.run({
      datasetId: 'ds-1',
      strategyId: 'ema-crossover',
      paramsList: [{ emaFast: 12, emaSlow: 26 }],
    });

    expect(sliceIdentity).toBeUndefined();
    const report = reports.build(summary, created);
    expect('sliceIdentity' in report).toBe(false);
  });
});
