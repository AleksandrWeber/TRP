import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/api', () => ({
  runWalkForwardCampaign: vi.fn(),
}));

import { runWalkForwardCampaign } from '../shared/api';
import {
  WalkForwardCampaignPage,
  WalkForwardCampaignSummaryView,
  parsePositiveNumber,
  submitWalkForwardCampaign,
} from './WalkForwardCampaignPage';

describe('WalkForwardCampaignPage', () => {
  beforeEach(() => {
    vi.mocked(runWalkForwardCampaign).mockReset();
  });

  it('renders initial form', () => {
    const html = renderToStaticMarkup(<WalkForwardCampaignPage />);
    expect(html).toContain('data-testid="walk-forward-campaign-page"');
    expect(html).toContain('data-testid="strategy-select"');
    expect(html).toContain('data-testid="dataset-input"');
    expect(html).toContain('data-testid="params-input"');
    expect(html).toContain('data-testid="dataset-length-input"');
    expect(html).toContain('data-testid="window-size-input"');
    expect(html).toContain('data-testid="step-size-input"');
    expect(html).toContain('data-testid="run-walk-forward-button"');
    expect(html).toContain('Run Walk-Forward');
    expect(html).not.toContain('data-testid="walk-forward-summary"');
  });

  it('submits successful walk-forward request', async () => {
    const summary = {
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      windowSize: 40,
      stepSize: 20,
      paramsCount: 1,
      windowCount: 2,
      successfulWindows: 2,
      failedWindows: 0,
      windows: [
        {
          trainStart: 0,
          trainEnd: 39,
          testStart: 40,
          testEnd: 59,
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
          error: null,
        },
        {
          trainStart: 20,
          trainEnd: 59,
          testStart: 60,
          testEnd: 79,
          summary: {
            campaignId: 'camp-2',
            strategyId: 'donchian-breakout',
            datasetId: 'ds-1',
            totalRuns: 1,
            passCount: 0,
            failCount: 1,
            needsReviewCount: 0,
            bestExperimentId: 'exp-2',
            createdAt: '2026-07-16T12:01:00.000Z',
            failedRuns: [],
          },
          error: null,
        },
      ],
      averageProfitFactor: 1.1,
      averageReturnPercent: 2,
      averageMaxDrawdownPercent: 12,
      averageExpectancy: 0.5,
      bestWindowIndex: 0,
      worstWindowIndex: 1,
      passCount: 1,
      needsReviewCount: 0,
      failCount: 1,
      overallVerdict: 'FAIL' as const,
    };

    vi.mocked(runWalkForwardCampaign).mockResolvedValue(summary);

    const result = await submitWalkForwardCampaign({
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      paramsListRaw: '[{"channelPeriod":10}]',
      datasetLengthRaw: '100',
      windowSizeRaw: '40',
      stepSizeRaw: '20',
    });

    expect(runWalkForwardCampaign).toHaveBeenCalledWith({
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      paramsList: [{ channelPeriod: 10 }],
      datasetLength: 100,
      windowSize: 40,
      stepSize: 20,
    });
    expect(result).toEqual(summary);

    const html = renderToStaticMarkup(<WalkForwardCampaignSummaryView summary={summary} />);
    expect(html).toContain('data-testid="windowCount"');
    expect(html).toContain('>2<');
    expect(html).toContain('FAIL');
    expect(html).toContain('0–39');
    expect(html).toContain('40–59');
    expect(html).toContain('PASS');
    expect(html).toContain('exp-1');
    expect(html).toContain('exp-2');
  });

  it('surfaces API errors from submit helper', async () => {
    vi.mocked(runWalkForwardCampaign).mockRejectedValue(new Error('API down'));

    await expect(
      submitWalkForwardCampaign({
        strategyId: 'ema-crossover',
        datasetId: 'ds-1',
        paramsListRaw: '[{"emaFast":12,"emaSlow":26}]',
        datasetLengthRaw: '100',
        windowSizeRaw: '40',
        stepSizeRaw: '20',
      }),
    ).rejects.toThrow('API down');
  });

  it('rejects invalid windowSize input', async () => {
    expect(() => parsePositiveNumber('0', 'windowSize')).toThrow(
      'windowSize must be a positive number',
    );
    await expect(
      submitWalkForwardCampaign({
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        paramsListRaw: '[{"channelPeriod":10}]',
        datasetLengthRaw: '100',
        windowSizeRaw: '-1',
        stepSizeRaw: '20',
      }),
    ).rejects.toThrow('windowSize must be a positive number');
    expect(runWalkForwardCampaign).not.toHaveBeenCalled();
  });
});
