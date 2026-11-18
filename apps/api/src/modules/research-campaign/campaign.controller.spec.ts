import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignController } from './campaign.controller';

describe('CampaignController', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let multiDatasetCampaigns: { run: ReturnType<typeof vi.fn> };
  let walkForwardCampaigns: { run: ReturnType<typeof vi.fn> };
  let controller: CampaignController;

  beforeEach(() => {
    campaigns = {
      run: vi.fn(),
    };
    multiDatasetCampaigns = {
      run: vi.fn(),
    };
    walkForwardCampaigns = {
      run: vi.fn(),
    };
    controller = new CampaignController(
      campaigns as never,
      multiDatasetCampaigns as never,
      walkForwardCampaigns as never,
    );
  });

  describe('POST /campaigns/run', () => {
    const summary = {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 3,
      passCount: 1,
      failCount: 2,
      needsReviewCount: 0,
      bestExperimentId: 'exp-high',
      createdAt: '2026-07-16T12:00:00.000Z',
      failedRuns: [] as Array<{ params: Record<string, number>; error: string }>,
    };

    it('returns completed candidates in descending profit-factor order and keeps the summary', async () => {
      campaigns.run.mockResolvedValue({
        summary,
        experiments: [
          {
            id: 'exp-mid',
            verdict: 'fail',
            metrics: {
              profitFactor: 0.6,
              totalReturnPercent: 1,
              expectancy: 0.2,
              maxDrawdownPercent: 8,
            },
            report: { params: { channelPeriod: 10 } },
          },
          {
            id: 'exp-high',
            verdict: 'pass',
            metrics: {
              profitFactor: 1.4,
              totalReturnPercent: 6,
              expectancy: 1.1,
              maxDrawdownPercent: 4,
            },
            report: { params: { channelPeriod: 20 } },
          },
          {
            id: 'exp-low',
            verdict: 'fail',
            metrics: {
              profitFactor: 0.2,
              totalReturnPercent: -3,
              expectancy: -0.4,
              maxDrawdownPercent: 15,
            },
            report: { params: { channelPeriod: 30 } },
          },
        ],
      });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
      });

      expect(campaigns.run).toHaveBeenCalledWith({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
      });
      expect(result).toMatchObject(summary);
      expect(result.failedRuns).toBe(summary.failedRuns);
      expect(result.candidates.map((candidate) => candidate.experimentId)).toEqual([
        'exp-high',
        'exp-mid',
        'exp-low',
      ]);
      expect(result.candidates[0]).toEqual({
        rank: 1,
        experimentId: 'exp-high',
        params: { channelPeriod: 20 },
        verdict: 'pass',
        profitFactor: 1.4,
        totalReturnPercent: 6,
        expectancy: 1.1,
        maxDrawdownPercent: 4,
      });
      expect(result.bestExperimentId).toBe(result.candidates[0]?.experimentId);
    });

    it('keeps failed runs out of the ranking', async () => {
      const failedRuns = [{ params: { channelPeriod: 20 }, error: 'dataset missing' }];
      const withFailure = { ...summary, failedRuns, totalRuns: 3, passCount: 1, failCount: 1 };

      campaigns.run.mockResolvedValue({
        summary: withFailure,
        experiments: [
          {
            id: 'exp-low',
            verdict: 'fail',
            metrics: { profitFactor: 0.4 },
            report: { params: { channelPeriod: 10 } },
          },
          {
            id: 'exp-high',
            verdict: 'pass',
            metrics: { profitFactor: 1.5 },
            report: { params: { channelPeriod: 30 } },
          },
        ],
      });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
      });

      expect(result.failedRuns).toEqual(failedRuns);
      expect(result.candidates.map((candidate) => candidate.experimentId)).toEqual([
        'exp-high',
        'exp-low',
      ]);
      expect(result.candidates).toHaveLength(2);
    });

    it('ranks missing and non-finite profit factors after scores that can win', async () => {
      const withWinner = { ...summary, bestExperimentId: 'exp-infinite' };
      campaigns.run.mockResolvedValue({
        summary: withWinner,
        experiments: [
          {
            id: 'exp-missing',
            verdict: 'fail',
            metrics: null,
            report: { params: { channelPeriod: 10 } },
          },
          {
            id: 'exp-nan',
            verdict: 'fail',
            metrics: { profitFactor: Number.NaN },
            report: { params: { channelPeriod: 20 } },
          },
          {
            id: 'exp-infinite',
            verdict: 'pass',
            metrics: { profitFactor: Number.POSITIVE_INFINITY },
            report: { params: { channelPeriod: 30 } },
          },
          {
            id: 'exp-negative-infinity',
            verdict: 'fail',
            metrics: { profitFactor: Number.NEGATIVE_INFINITY },
            report: { params: { channelPeriod: 40 } },
          },
          {
            id: 'exp-finite',
            verdict: 'fail',
            metrics: { profitFactor: 0.5 },
            report: { params: { channelPeriod: 50 } },
          },
        ],
      });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      });

      expect(result.candidates.map((candidate) => candidate.experimentId)).toEqual([
        'exp-infinite',
        'exp-finite',
        'exp-missing',
        'exp-nan',
        'exp-negative-infinity',
      ]);
      expect(result.bestExperimentId).toBe('exp-infinite');
      expect(result.candidates[0]?.profitFactor).toBe(Number.POSITIVE_INFINITY);
      expect(result.candidates[2]?.profitFactor).toBeNull();
      expect(result.candidates[3]?.profitFactor).toBeNaN();
      expect(result.candidates[4]?.profitFactor).toBe(Number.NEGATIVE_INFINITY);
      expect(result.candidates[1]?.profitFactor).toBe(0.5);
    });

    it('keeps the earlier experiment first when profit factors are equal', async () => {
      const tied = { ...summary, bestExperimentId: 'exp-first' };
      campaigns.run.mockResolvedValue({
        summary: tied,
        experiments: [
          { id: 'exp-first', verdict: 'pass', metrics: { profitFactor: 1.2 } },
          { id: 'exp-second', verdict: 'pass', metrics: { profitFactor: 1.2 } },
          { id: 'exp-lower', verdict: 'fail', metrics: { profitFactor: 0.4 } },
        ],
      });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }, { channelPeriod: 30 }],
      });

      expect(result.candidates.map((candidate) => candidate.experimentId)).toEqual([
        'exp-first',
        'exp-second',
        'exp-lower',
      ]);
      expect(result.candidates.map((candidate) => candidate.rank)).toEqual([1, 2, 3]);
      expect(result.bestExperimentId).toBe(result.candidates[0]?.experimentId);
    });

    it('returns an empty candidate list when every run failed before completion', async () => {
      const failedRuns = [{ params: { channelPeriod: 10 }, error: 'dataset missing' }];
      const empty = {
        ...summary,
        totalRuns: 1,
        passCount: 0,
        failCount: 0,
        bestExperimentId: null,
        failedRuns,
      };
      campaigns.run.mockResolvedValue({ summary: empty, experiments: [] });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
      });

      expect(result).toMatchObject(empty);
      expect(result.candidates).toEqual([]);
      expect(result.failedRuns).toEqual(failedRuns);
    });

    it('rejects missing datasetId', async () => {
      await expect(
        controller.run({
          strategyId: 'donchian-breakout',
          paramsList: [{ channelPeriod: 10 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing strategyId', async () => {
      await expect(
        controller.run({
          datasetId: 'ds-1',
          paramsList: [{ channelPeriod: 10 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects empty paramsList', async () => {
      await expect(
        controller.run({
          datasetId: 'ds-1',
          strategyId: 'donchian-breakout',
          paramsList: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('POST /campaigns/run-multi', () => {
    it('validates request and returns MultiDatasetCampaignSummary', async () => {
      const summary = {
        totalDatasets: 2,
        completedDatasets: 2,
        failedDatasets: 0,
        campaignSummaries: [
          {
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
        ],
        overallBestExperimentId: 'exp-1',
        overallBestProfitFactor: 1.2,
        failedDatasetErrors: [],
      };

      multiDatasetCampaigns.run.mockResolvedValue(summary);

      const result = await controller.runMulti({
        strategyId: 'donchian-breakout',
        datasets: ['ds-1', 'ds-2'],
        paramsList: [{ channelPeriod: 10 }],
      });

      expect(multiDatasetCampaigns.run).toHaveBeenCalledWith({
        strategyId: 'donchian-breakout',
        datasets: ['ds-1', 'ds-2'],
        paramsList: [{ channelPeriod: 10 }],
      });
      expect(result).toEqual(summary);
      expect(result).toBe(summary);
    });

    it('rejects empty datasets', async () => {
      await expect(
        controller.runMulti({
          strategyId: 'donchian-breakout',
          datasets: [],
          paramsList: [{ channelPeriod: 10 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(multiDatasetCampaigns.run).not.toHaveBeenCalled();
    });

    it('propagates service exceptions', async () => {
      multiDatasetCampaigns.run.mockRejectedValue(new Error('campaign runner failed'));

      await expect(
        controller.runMulti({
          strategyId: 'donchian-breakout',
          datasets: ['ds-1'],
          paramsList: [{ channelPeriod: 10 }],
        }),
      ).rejects.toThrow('campaign runner failed');
    });
  });

  describe('POST /campaigns/run-walk-forward', () => {
    const validBody = () => ({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      datasetLength: 100,
      windowSize: 40,
      stepSize: 20,
    });

    it('validates request and returns WalkForwardCampaignSummary unchanged', async () => {
      const summary = {
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
        averageMaxDrawdownPercent: 10,
        averageExpectancy: 1,
        bestWindowIndex: 1,
        worstWindowIndex: 0,
        passCount: 3,
        needsReviewCount: 0,
        failCount: 0,
        overallVerdict: 'PASS' as const,
      };

      walkForwardCampaigns.run.mockResolvedValue(summary);

      const result = await controller.runWalkForward(validBody());

      expect(walkForwardCampaigns.run).toHaveBeenCalledWith({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }],
        datasetLength: 100,
        windowSize: 40,
        stepSize: 20,
      });
      expect(result).toEqual(summary);
      expect(result).toBe(summary);
    });

    it('rejects invalid windowSize', async () => {
      await expect(
        controller.runWalkForward({
          ...validBody(),
          windowSize: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(walkForwardCampaigns.run).not.toHaveBeenCalled();
    });

    it('rejects invalid stepSize', async () => {
      await expect(
        controller.runWalkForward({
          ...validBody(),
          stepSize: -5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(walkForwardCampaigns.run).not.toHaveBeenCalled();
    });

    it('propagates service exceptions', async () => {
      walkForwardCampaigns.run.mockRejectedValue(new Error('walk-forward runner failed'));

      await expect(controller.runWalkForward(validBody())).rejects.toThrow(
        'walk-forward runner failed',
      );
    });

    it('passes through service response without transformation', async () => {
      const summary = { marker: 'passthrough' };
      walkForwardCampaigns.run.mockResolvedValue(summary);

      const result = await controller.runWalkForward(validBody());

      expect(result).toBe(summary);
    });
  });
});
