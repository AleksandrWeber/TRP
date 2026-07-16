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
    it('calls ResearchCampaignService.run and returns CampaignSummary unchanged', async () => {
      const summary = {
        campaignId: 'camp-1',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        totalRuns: 2,
        passCount: 0,
        failCount: 2,
        needsReviewCount: 0,
        bestExperimentId: 'exp-2',
        createdAt: '2026-07-16T12:00:00.000Z',
        failedRuns: [],
      };

      campaigns.run.mockResolvedValue({
        summary,
        experiments: [
          { id: 'exp-1', verdict: 'fail', metrics: { profitFactor: 0.4 } },
          { id: 'exp-2', verdict: 'fail', metrics: { profitFactor: 0.8 } },
        ],
      });

      const result = await controller.run({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
      });

      expect(campaigns.run).toHaveBeenCalledWith({
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
      });
      expect(result).toEqual(summary);
      expect(result).toBe(summary);
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
