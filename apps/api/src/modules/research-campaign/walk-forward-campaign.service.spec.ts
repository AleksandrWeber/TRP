import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalkForwardCampaignService } from './walk-forward-campaign.service';
import type { WalkForwardCampaignRequest } from './walk-forward-campaign.types';

describe('WalkForwardCampaignService', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: WalkForwardCampaignService;

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    experiments = { run: vi.fn() };
    service = new WalkForwardCampaignService(campaigns as never, experiments as never);
  });

  const validRequest = (
    overrides: Partial<WalkForwardCampaignRequest> = {},
  ): WalkForwardCampaignRequest => ({
    datasetId: 'ds-1',
    strategyId: 'donchian-breakout',
    paramsList: [{ channelPeriod: 10 }],
    windowSize: 40,
    stepSize: 20,
    datasetLength: 100,
    ...overrides,
  });

  const campaignSummary = (campaignId: string) => ({
    campaignId,
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: `exp-${campaignId}`,
    createdAt: '2026-07-16T12:00:00.000Z',
    failedRuns: [],
  });

  const emptyTestEval = {
    trainBestExperimentId: null as string | null,
    testExperimentId: null as string | null,
    trainMetrics: null,
    testMetrics: null,
    trainVerdict: null as string | null,
    testVerdict: null as string | null,
  };

  it('runs one campaign for a single window', async () => {
    campaigns.run.mockResolvedValueOnce({
      summary: campaignSummary('camp-1'),
      experiments: [
        {
          id: 'exp-camp-1',
          verdict: 'pass',
          metrics: { profitFactor: 1.2 },
          report: { params: { channelPeriod: 10 } },
        },
      ],
    });
    experiments.run.mockResolvedValueOnce({
      id: 'test-exp-1',
      verdict: 'fail',
      metrics: { profitFactor: 0.9 },
    });

    const result = await service.run(
      validRequest({
        datasetLength: 60,
        windowSize: 40,
        stepSize: 20,
      }),
    );

    expect(campaigns.run).toHaveBeenCalledTimes(1);
    expect(campaigns.run).toHaveBeenCalledWith({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
      sliceRef: {
        datasetId: 'ds-1',
        startIndex: 0,
        endIndex: 39,
        role: 'TRAIN',
      },
    });
    expect(result.windowCount).toBe(1);
    expect(result.successfulWindows).toBe(1);
    expect(result.failedWindows).toBe(0);
    expect(result.windows[0]).toMatchObject({
      trainStart: 0,
      trainEnd: 39,
      testStart: 40,
      testEnd: 59,
      summary: campaignSummary('camp-1'),
      error: null,
      trainSliceIdentity: 'ds-1:0:39:TRAIN',
      testSliceIdentity: 'ds-1:40:59:TEST',
      trainBestExperimentId: 'exp-camp-1',
      testExperimentId: 'test-exp-1',
      trainVerdict: 'pass',
      testVerdict: 'fail',
    });
  });

  it('runs a campaign for each of several windows', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-1'),
        experiments: [
          {
            id: 'exp-camp-1',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-2'),
        experiments: [
          {
            id: 'exp-camp-2',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-3'),
        experiments: [
          {
            id: 'exp-camp-3',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });
    experiments.run.mockResolvedValue({
      id: 'test-exp',
      verdict: 'pass',
      metrics: { profitFactor: 1 },
    });

    const result = await service.run(validRequest());

    expect(campaigns.run).toHaveBeenCalledTimes(3);
    expect(experiments.run).toHaveBeenCalledTimes(3);
    expect(result.windowCount).toBe(3);
    expect(result.successfulWindows).toBe(3);
    expect(result.failedWindows).toBe(0);
    expect(result.windows.map((w) => w.summary?.campaignId)).toEqual([
      'camp-1',
      'camp-2',
      'camp-3',
    ]);
  });

  it('continues when one window campaign fails', async () => {
    campaigns.run
      .mockRejectedValueOnce(new Error('window campaign failed'))
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-2'),
        experiments: [
          {
            id: 'exp-camp-2',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-3'),
        experiments: [
          {
            id: 'exp-camp-3',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });
    experiments.run.mockResolvedValue({
      id: 'test-exp',
      verdict: 'pass',
      metrics: { profitFactor: 1 },
    });

    const result = await service.run(validRequest());

    expect(campaigns.run).toHaveBeenCalledTimes(3);
    expect(result.windowCount).toBe(3);
    expect(result.successfulWindows).toBe(2);
    expect(result.failedWindows).toBe(1);
    expect(result.windows[0]).toMatchObject({
      trainStart: 0,
      summary: null,
      error: 'window campaign failed',
      ...emptyTestEval,
    });
  });

  it('counts successful and failed windows correctly', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: campaignSummary('camp-1'),
        experiments: [
          {
            id: 'exp-camp-1',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom-2'));
    experiments.run.mockResolvedValue({
      id: 'test-exp',
      verdict: 'pass',
      metrics: { profitFactor: 1 },
    });

    const result = await service.run(validRequest());

    expect(result.windowCount).toBe(3);
    expect(result.successfulWindows).toBe(1);
    expect(result.failedWindows).toBe(2);
  });

  it('rejects invalid windowSize', async () => {
    await expect(
      service.run({
        ...validRequest(),
        windowSize: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid stepSize', async () => {
    await expect(
      service.run({
        ...validRequest(),
        stepSize: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty paramsList', async () => {
    await expect(
      service.run({
        ...validRequest(),
        paramsList: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('WalkForwardCampaignService aggregate report', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: WalkForwardCampaignService;

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    experiments = { run: vi.fn().mockResolvedValue({ id: 't', verdict: 'pass', metrics: {} }) };
    service = new WalkForwardCampaignService(campaigns as never, experiments as never);
  });

  const request = (): WalkForwardCampaignRequest => ({
    datasetId: 'ds-1',
    strategyId: 'donchian-breakout',
    paramsList: [{ channelPeriod: 10 }],
    windowSize: 40,
    stepSize: 20,
    datasetLength: 100,
  });

  const summary = (overrides: {
    campaignId: string;
    passCount?: number;
    failCount?: number;
    needsReviewCount?: number;
    bestExperimentId?: string;
  }) => ({
    campaignId: overrides.campaignId,
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: overrides.passCount ?? 0,
    failCount: overrides.failCount ?? 0,
    needsReviewCount: overrides.needsReviewCount ?? 0,
    bestExperimentId: overrides.bestExperimentId ?? `exp-${overrides.campaignId}`,
    createdAt: '2026-07-16T12:00:00.000Z',
    failedRuns: [],
  });

  const experiment = (
    id: string,
    metrics: {
      profitFactor: number;
      totalReturnPercent: number;
      maxDrawdownPercent: number;
      expectancy: number;
    },
  ) => ({
    id,
    verdict: 'pass',
    metrics,
    report: { params: { channelPeriod: 10 } },
  });

  it('aggregates all PASS windows', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c1', passCount: 1, bestExperimentId: 'e1' }),
        experiments: [
          experiment('e1', {
            profitFactor: 1.0,
            totalReturnPercent: 4,
            maxDrawdownPercent: 8,
            expectancy: 1,
          }),
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c2', passCount: 1, bestExperimentId: 'e2' }),
        experiments: [
          experiment('e2', {
            profitFactor: 1.4,
            totalReturnPercent: 6,
            maxDrawdownPercent: 12,
            expectancy: 3,
          }),
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c3', passCount: 1, bestExperimentId: 'e3' }),
        experiments: [
          experiment('e3', {
            profitFactor: 1.2,
            totalReturnPercent: 5,
            maxDrawdownPercent: 10,
            expectancy: 2,
          }),
        ],
      });

    const result = await service.run(request());

    expect(result.overallVerdict).toBe('PASS');
    expect(result.passCount).toBe(3);
    expect(result.testPassCount).toBe(3);
    expect(result.averageProfitFactor).toBeCloseTo(1.2);
    expect(result.bestWindowIndex).toBe(1);
    expect(result.worstWindowIndex).toBe(0);
  });

  it('resolves PASS + NEEDS_REVIEW as NEEDS_REVIEW', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c1', passCount: 1 }),
        experiments: [
          {
            id: 'exp-c1',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({
          campaignId: 'c2',
          passCount: 0,
          needsReviewCount: 1,
        }),
        experiments: [
          {
            id: 'exp-c2',
            verdict: 'needs_review',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c3', passCount: 1 }),
        experiments: [
          {
            id: 'exp-c3',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });

    experiments.run
      .mockResolvedValueOnce({ id: 't1', verdict: 'pass', metrics: {} })
      .mockResolvedValueOnce({ id: 't2', verdict: 'needs_review', metrics: {} })
      .mockResolvedValueOnce({ id: 't3', verdict: 'pass', metrics: {} });

    const result = await service.run(request());

    expect(result.overallVerdict).toBe('NEEDS_REVIEW');
    expect(result.passCount).toBe(2);
    expect(result.needsReviewCount).toBe(1);
    expect(result.testPassCount).toBe(2);
    expect(result.testNeedsReviewCount).toBe(1);
  });

  it('resolves PASS + FAIL as FAIL', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c1', passCount: 1 }),
        experiments: [
          {
            id: 'exp-c1',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c2', passCount: 0, failCount: 1 }),
        experiments: [
          {
            id: 'exp-c2',
            verdict: 'fail',
            metrics: { profitFactor: 0.5 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c3', passCount: 1 }),
        experiments: [
          {
            id: 'exp-c3',
            verdict: 'pass',
            metrics: { profitFactor: 1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });

    experiments.run
      .mockResolvedValueOnce({ id: 't1', verdict: 'pass', metrics: {} })
      .mockResolvedValueOnce({ id: 't2', verdict: 'fail', metrics: {} })
      .mockResolvedValueOnce({ id: 't3', verdict: 'pass', metrics: {} });

    const result = await service.run(request());

    expect(result.overallVerdict).toBe('FAIL');
    expect(result.passCount).toBe(2);
    expect(result.failCount).toBe(1);
    expect(result.testFailCount).toBe(1);
  });

  it('excludes error windows from averages and counts', async () => {
    campaigns.run
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c2', passCount: 1, bestExperimentId: 'e2' }),
        experiments: [
          experiment('e2', {
            profitFactor: 1.5,
            totalReturnPercent: 7,
            maxDrawdownPercent: 9,
            expectancy: 4,
          }),
        ],
      })
      .mockResolvedValueOnce({
        summary: summary({ campaignId: 'c3', passCount: 1, bestExperimentId: 'e3' }),
        experiments: [
          experiment('e3', {
            profitFactor: 1.1,
            totalReturnPercent: 3,
            maxDrawdownPercent: 11,
            expectancy: 1,
          }),
        ],
      });

    const result = await service.run(request());

    expect(result.successfulWindows).toBe(2);
    expect(result.failedWindows).toBe(1);
    expect(result.overallVerdict).toBe('PASS');
    expect(result.averageProfitFactor).toBeCloseTo(1.3);
  });

  it('returns null aggregates when all windows error', async () => {
    campaigns.run
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockRejectedValueOnce(new Error('c'));

    const result = await service.run(request());

    expect(result.successfulWindows).toBe(0);
    expect(result.failedWindows).toBe(3);
    expect(result.overallVerdict).toBe('FAIL');
    expect(result.averageProfitFactor).toBeNull();
    expect(result.passCount).toBeNull();
  });
});

describe('WalkForwardCampaignService true slice execution', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: WalkForwardCampaignService;

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    experiments = { run: vi.fn().mockResolvedValue({ id: 't', verdict: 'pass', metrics: {} }) };
    service = new WalkForwardCampaignService(campaigns as never, experiments as never);
  });

  const request = (): WalkForwardCampaignRequest => ({
    datasetId: 'ds-1',
    strategyId: 'donchian-breakout',
    paramsList: [{ channelPeriod: 10 }],
    windowSize: 40,
    stepSize: 20,
    datasetLength: 100,
  });

  it('creates Train/Test SliceRef provenance for each window', async () => {
    campaigns.run.mockResolvedValue({
      summary: {
        campaignId: 'camp',
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
      experiments: [
        {
          id: 'exp-1',
          verdict: 'pass',
          metrics: { profitFactor: 1 },
          report: { params: { channelPeriod: 10 } },
        },
      ],
    });

    const result = await service.run(request());

    expect(result.windows.map((w) => w.trainSliceIdentity)).toEqual([
      'ds-1:0:39:TRAIN',
      'ds-1:20:59:TRAIN',
      'ds-1:40:79:TRAIN',
    ]);
    expect(result.windows.map((w) => w.testSliceIdentity)).toEqual([
      'ds-1:40:59:TEST',
      'ds-1:60:79:TEST',
      'ds-1:80:99:TEST',
    ]);
  });

  it('runs Campaign with the Train SliceRef only', async () => {
    campaigns.run.mockResolvedValue({
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
      experiments: [
        {
          id: 'exp-1',
          verdict: 'pass',
          metrics: { profitFactor: 1 },
          report: { params: { channelPeriod: 10 } },
        },
      ],
    });

    await service.run(request());

    for (const call of campaigns.run.mock.calls) {
      expect(call[0].sliceRef.role).toBe('TRAIN');
    }
  });

  it('keeps train/test provenance when campaign rejects an invalid slice', async () => {
    campaigns.run.mockRejectedValue(new Error('Slice endIndex is out of bounds'));

    const result = await service.run(request());

    expect(result.failedWindows).toBe(3);
    expect(result.windows[0].trainSliceIdentity).toBe('ds-1:0:39:TRAIN');
    expect(result.windows[0].testSliceIdentity).toBe('ds-1:40:59:TEST');
    expect(experiments.run).not.toHaveBeenCalled();
  });

  it('leaves train aggregate intact and overallVerdict from test for successful runs', async () => {
    campaigns.run
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'c1',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'e1',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          {
            id: 'e1',
            verdict: 'pass',
            metrics: {
              profitFactor: 1.0,
              totalReturnPercent: 4,
              maxDrawdownPercent: 8,
              expectancy: 1,
            },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'c2',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'e2',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          {
            id: 'e2',
            verdict: 'pass',
            metrics: {
              profitFactor: 1.4,
              totalReturnPercent: 6,
              maxDrawdownPercent: 12,
              expectancy: 3,
            },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'c3',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'e3',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          {
            id: 'e3',
            verdict: 'pass',
            metrics: {
              profitFactor: 1.2,
              totalReturnPercent: 5,
              maxDrawdownPercent: 10,
              expectancy: 2,
            },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });

    const result = await service.run(request());

    expect(result.overallVerdict).toBe('PASS');
    expect(result.averageProfitFactor).toBeCloseTo(1.2);
    expect(result.testPassCount).toBe(3);
    expect(result.bestWindowIndex).toBe(1);
  });
});

describe('WalkForwardCampaignService test evaluation', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let experiments: { run: ReturnType<typeof vi.fn> };
  let service: WalkForwardCampaignService;

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    experiments = { run: vi.fn() };
    service = new WalkForwardCampaignService(campaigns as never, experiments as never);
  });

  const request = (): WalkForwardCampaignRequest => ({
    datasetId: 'ds-1',
    strategyId: 'donchian-breakout',
    paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
    windowSize: 40,
    stepSize: 20,
    datasetLength: 60,
  });

  it('runs train campaign, picks best experiment, then runs test experiment', async () => {
    campaigns.run.mockResolvedValue({
      summary: {
        campaignId: 'camp-1',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        totalRuns: 2,
        passCount: 1,
        failCount: 1,
        needsReviewCount: 0,
        bestExperimentId: 'exp-best',
        createdAt: '2026-07-16T12:00:00.000Z',
        failedRuns: [],
      },
      experiments: [
        {
          id: 'exp-low',
          verdict: 'fail',
          metrics: { profitFactor: 0.5, totalReturnPercent: -1 },
          report: { params: { channelPeriod: 10 } },
        },
        {
          id: 'exp-best',
          verdict: 'pass',
          metrics: {
            profitFactor: 1.5,
            totalReturnPercent: 8,
            maxDrawdownPercent: 5,
            expectancy: 2,
          },
          report: { params: { channelPeriod: 20 } },
        },
      ],
    });
    experiments.run.mockResolvedValue({
      id: 'exp-test',
      verdict: 'needs_review',
      metrics: {
        profitFactor: 1.1,
        totalReturnPercent: 2,
        maxDrawdownPercent: 9,
        expectancy: 0.5,
      },
    });

    const result = await service.run(request());

    expect(campaigns.run).toHaveBeenCalledTimes(1);
    expect(experiments.run).toHaveBeenCalledTimes(1);
    expect(experiments.run).toHaveBeenCalledWith(
      'ds-1',
      'donchian-breakout',
      { channelPeriod: 20 },
      {
        datasetId: 'ds-1',
        startIndex: 40,
        endIndex: 59,
        role: 'TEST',
      },
    );

    const window = result.windows[0];
    expect(window.trainBestExperimentId).toBe('exp-best');
    expect(window.trainVerdict).toBe('pass');
    expect(window.trainMetrics).toEqual({
      profitFactor: 1.5,
      totalReturnPercent: 8,
      maxDrawdownPercent: 5,
      expectancy: 2,
    });
    expect(window.testExperimentId).toBe('exp-test');
    expect(window.testVerdict).toBe('needs_review');
    expect(window.testMetrics?.profitFactor).toBe(1.1);
  });

  it('continues other windows when test evaluation fails', async () => {
    campaigns.run
      .mockResolvedValueOnce({
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
        experiments: [
          {
            id: 'exp-1',
            verdict: 'pass',
            metrics: { profitFactor: 1.2 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-2',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'exp-2',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          {
            id: 'exp-2',
            verdict: 'pass',
            metrics: { profitFactor: 1.3 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      })
      .mockResolvedValueOnce({
        summary: {
          campaignId: 'camp-3',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 1,
          failCount: 0,
          needsReviewCount: 0,
          bestExperimentId: 'exp-3',
          createdAt: '2026-07-16T12:00:00.000Z',
          failedRuns: [],
        },
        experiments: [
          {
            id: 'exp-3',
            verdict: 'pass',
            metrics: { profitFactor: 1.1 },
            report: { params: { channelPeriod: 10 } },
          },
        ],
      });

    experiments.run
      .mockRejectedValueOnce(new Error('test slice failed'))
      .mockResolvedValueOnce({
        id: 'test-2',
        verdict: 'pass',
        metrics: { profitFactor: 1.0 },
      })
      .mockResolvedValueOnce({
        id: 'test-3',
        verdict: 'fail',
        metrics: { profitFactor: 0.8 },
      });

    const result = await service.run({
      ...request(),
      datasetLength: 100,
      paramsList: [{ channelPeriod: 10 }],
    });

    expect(result.successfulWindows).toBe(3);
    expect(result.failedWindows).toBe(0);
    expect(result.windows[0].testExperimentId).toBeNull();
    expect(result.windows[0].trainBestExperimentId).toBe('exp-1');
    expect(result.windows[1].testExperimentId).toBe('test-2');
    expect(result.windows[2].testExperimentId).toBe('test-3');
    expect(result.overallVerdict).toBe('FAIL');
    expect(result.passCount).toBe(3);
    expect(result.testPassCount).toBe(1);
    expect(result.testFailCount).toBe(1);
  });

  it('keeps train aggregate separate while overallVerdict follows test', async () => {
    campaigns.run.mockResolvedValue({
      summary: {
        campaignId: 'camp',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        totalRuns: 1,
        passCount: 1,
        failCount: 0,
        needsReviewCount: 0,
        bestExperimentId: 'exp-train',
        createdAt: '2026-07-16T12:00:00.000Z',
        failedRuns: [],
      },
      experiments: [
        {
          id: 'exp-train',
          verdict: 'pass',
          metrics: {
            profitFactor: 2.0,
            totalReturnPercent: 10,
            maxDrawdownPercent: 4,
            expectancy: 3,
          },
          report: { params: { channelPeriod: 10 } },
        },
      ],
    });
    experiments.run.mockResolvedValue({
      id: 'exp-test',
      verdict: 'fail',
      metrics: {
        profitFactor: 0.1,
        totalReturnPercent: -50,
        maxDrawdownPercent: 80,
        expectancy: -10,
      },
    });

    const result = await service.run(request());

    expect(result.windows[0].testVerdict).toBe('fail');
    expect(result.averageProfitFactor).toBe(2.0);
    expect(result.passCount).toBe(1);
    expect(result.averageTestProfitFactor).toBe(0.1);
    expect(result.averageTestReturnPercent).toBe(-50);
    expect(result.testFailCount).toBe(1);
    expect(result.overallVerdict).toBe('FAIL');
  });
});
