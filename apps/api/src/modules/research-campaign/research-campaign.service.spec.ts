import { beforeEach, describe, expect, it, vi } from 'vitest';
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
