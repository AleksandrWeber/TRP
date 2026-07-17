import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiDatasetCampaignService } from './multi-dataset-campaign.service';
import { NoOpLogger } from '../../logging/noop.logger';

describe('MultiDatasetCampaignService', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let service: MultiDatasetCampaignService;

  beforeEach(() => {
    campaigns = {
      run: vi.fn(),
    };
    service = new MultiDatasetCampaignService(campaigns as never, new NoOpLogger());
  });

  it('runs a single dataset campaign', async () => {
    campaigns.run.mockResolvedValueOnce({
      summary: {
        campaignId: 'camp-1',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        totalRuns: 1,
        passCount: 1,
        failCount: 0,
        needsReviewCount: 0,
        bestExperimentId: 'exp-1',
        createdAt: '2026-07-16T12:00:00.000Z',
        failedRuns: [],
      },
      experiments: [{ id: 'exp-1', verdict: 'pass', metrics: { profitFactor: 1.2 } }],
    });

    const result = await service.run({
      strategyId: 'donchian-breakout',
      datasets: ['ds-1'],
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(campaigns.run).toHaveBeenCalledTimes(1);
    expect(campaigns.run).toHaveBeenCalledWith({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
    });
    expect(result.totalDatasets).toBe(1);
    expect(result.completedDatasets).toBe(1);
    expect(result.failedDatasets).toBe(0);
    expect(result.campaignSummaries).toHaveLength(1);
    expect(result.overallBestExperimentId).toBe('exp-1');
    expect(result.overallBestProfitFactor).toBe(1.2);
  });

  it('runs multiple datasets sequentially', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-1',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 0,
          failCount: 1,
          needsReviewCount: 0,
          bestExperimentId: 'exp-a',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [{ id: 'exp-a', verdict: 'fail', metrics: { profitFactor: 0.5 } }],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-2',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-2',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'exp-b',
          createdAt: '2026-07-16T12:01:00.000Z',
          failedRuns: [],
        },
        experiments: [{ id: 'exp-b', verdict: 'pass', metrics: { profitFactor: 1.4 } }],
      });

    const result = await service.run({
      strategyId: 'donchian-breakout',
      datasets: ['ds-1', 'ds-2'],
      paramsList: [{ channelPeriod: 20 }],
    });

    expect(campaigns.run).toHaveBeenCalledTimes(2);
    expect(result.totalDatasets).toBe(2);
    expect(result.completedDatasets).toBe(2);
    expect(result.failedDatasets).toBe(0);
    expect(result.campaignSummaries.map((item) => item.datasetId)).toEqual(['ds-1', 'ds-2']);
  });

  it('continues when one dataset fails', async () => {
    campaigns.run.mockRejectedValueOnce(new Error('dataset missing')).mockResolvedValueOnce({
      summary: {
        campaignId: 'camp-2',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-2',
        totalRuns: 1,
        passCount: 1,
        failCount: 0,
        needsReviewCount: 0,
        bestExperimentId: 'exp-ok',
        createdAt: '2026-07-16T12:01:00.000Z',
        failedRuns: [],
      },
      experiments: [{ id: 'exp-ok', verdict: 'pass', metrics: { profitFactor: 1.1 } }],
    });

    const result = await service.run({
      strategyId: 'donchian-breakout',
      datasets: ['ds-missing', 'ds-2'],
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(campaigns.run).toHaveBeenCalledTimes(2);
    expect(result.totalDatasets).toBe(2);
    expect(result.completedDatasets).toBe(1);
    expect(result.failedDatasets).toBe(1);
    expect(result.failedDatasetErrors).toEqual([
      { datasetId: 'ds-missing', error: 'dataset missing' },
    ]);
    expect(result.campaignSummaries).toHaveLength(1);
    expect(result.overallBestExperimentId).toBe('exp-ok');
    expect(result.overallBestProfitFactor).toBe(1.1);
  });

  it('selects overall best experiment by profit factor across datasets', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-1',
          strategyId: 'ema-crossover',
          datasetId: 'ds-1',
          totalRuns: 2,
          passCount: 1,
          failCount: 1,
          needsReviewCount: 0,
          bestExperimentId: 'exp-mid',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          { id: 'exp-low', verdict: 'fail', metrics: { profitFactor: 0.4 } },
          { id: 'exp-mid', verdict: 'pass', metrics: { profitFactor: 1.2 } },
        ],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-2',
          strategyId: 'ema-crossover',
          datasetId: 'ds-2',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'exp-high',
          createdAt: '2026-07-16T12:01:00.000Z',
          failedRuns: [],
        },
        experiments: [{ id: 'exp-high', verdict: 'pass', metrics: { profitFactor: 1.9 } }],
      });

    const result = await service.run({
      strategyId: 'ema-crossover',
      datasets: ['ds-1', 'ds-2'],
      paramsList: [{ emaFast: 12, emaSlow: 26 }],
    });

    expect(result.overallBestExperimentId).toBe('exp-high');
    expect(result.overallBestProfitFactor).toBe(1.9);
  });
});
