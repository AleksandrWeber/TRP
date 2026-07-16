import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignController } from './campaign.controller';

describe('CampaignController (POST /campaigns/run)', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let controller: CampaignController;

  beforeEach(() => {
    campaigns = {
      run: vi.fn(),
    };
    controller = new CampaignController(campaigns as never);
  });

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
