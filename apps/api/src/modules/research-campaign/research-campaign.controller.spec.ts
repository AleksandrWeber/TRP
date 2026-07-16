import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ResearchCampaignController } from './research-campaign.controller';

describe('ResearchCampaignController', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let reports: { build: ReturnType<typeof vi.fn> };
  let controller: ResearchCampaignController;

  beforeEach(() => {
    campaigns = {
      run: vi.fn(),
    };
    reports = {
      build: vi.fn(),
    };
    controller = new ResearchCampaignController(campaigns as never, reports as never);
  });

  it('runs campaign and returns summary + report', async () => {
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
    const experiments = [
      { id: 'exp-1', verdict: 'fail', metrics: { profitFactor: 0.4 } },
      { id: 'exp-2', verdict: 'fail', metrics: { profitFactor: 0.8 } },
    ];
    const report = {
      campaignId: 'camp-1',
      verdict: 'FAIL',
      bestExperimentId: 'exp-2',
      recommendations: ['No configuration passed validation.'],
    };

    campaigns.run.mockResolvedValue({ summary, experiments });
    reports.build.mockReturnValue(report);

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
    expect(reports.build).toHaveBeenCalledWith(summary, experiments);
    expect(result).toEqual({
      summary,
      report,
      experimentIds: ['exp-1', 'exp-2'],
    });
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
