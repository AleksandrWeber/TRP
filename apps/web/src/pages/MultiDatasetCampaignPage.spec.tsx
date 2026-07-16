import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/api', () => ({
  runMultiDatasetCampaign: vi.fn(),
}));

import { runMultiDatasetCampaign } from '../shared/api';
import {
  MultiDatasetCampaignPage,
  MultiDatasetCampaignSummaryView,
  parseDatasetsRaw,
  submitMultiDatasetCampaign,
} from './MultiDatasetCampaignPage';

describe('MultiDatasetCampaignPage', () => {
  beforeEach(() => {
    vi.mocked(runMultiDatasetCampaign).mockReset();
  });

  it('renders initial form', () => {
    const html = renderToStaticMarkup(<MultiDatasetCampaignPage />);
    expect(html).toContain('data-testid="multi-dataset-campaign-page"');
    expect(html).toContain('data-testid="strategy-select"');
    expect(html).toContain('data-testid="datasets-input"');
    expect(html).toContain('data-testid="params-input"');
    expect(html).toContain('data-testid="run-multi-button"');
    expect(html).not.toContain('data-testid="multi-dataset-summary"');
  });

  it('rejects empty dataset list', () => {
    expect(() => parseDatasetsRaw('  \n , ')).toThrow('datasets must be a non-empty list');
  });

  it('submits successful multi-dataset execution', async () => {
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
        {
          campaignId: 'camp-2',
          strategyId: 'donchian-breakout',
          datasetId: 'ds-2',
          totalRuns: 1,
          passCount: 0,
          failCount: 1,
          needsReviewCount: 0,
          bestExperimentId: 'exp-2',
          createdAt: '2026-07-16T12:01:00.000Z',
          failedRuns: [],
        },
      ],
      overallBestExperimentId: 'exp-1',
      overallBestProfitFactor: 1.4,
      failedDatasetErrors: [],
    };

    vi.mocked(runMultiDatasetCampaign).mockResolvedValue(summary);

    const result = await submitMultiDatasetCampaign({
      strategyId: 'donchian-breakout',
      datasetsRaw: 'ds-1\nds-2',
      paramsListRaw: '[{"channelPeriod":10}]',
    });

    expect(runMultiDatasetCampaign).toHaveBeenCalledWith({
      strategyId: 'donchian-breakout',
      datasets: ['ds-1', 'ds-2'],
      paramsList: [{ channelPeriod: 10 }],
    });
    expect(result).toEqual(summary);

    const html = renderToStaticMarkup(<MultiDatasetCampaignSummaryView summary={summary} />);
    expect(html).toContain('data-testid="totalDatasets"');
    expect(html).toContain('>2<');
    expect(html).toContain('ds-1');
    expect(html).toContain('PASS');
    expect(html).toContain('exp-1');
    expect(html).toContain('1.4');
  });

  it('surfaces API errors from submit helper', async () => {
    vi.mocked(runMultiDatasetCampaign).mockRejectedValue(new Error('API down'));

    await expect(
      submitMultiDatasetCampaign({
        strategyId: 'ema-crossover',
        datasetsRaw: 'ds-1',
        paramsListRaw: '[{"emaFast":12,"emaSlow":26}]',
      }),
    ).rejects.toThrow('API down');
  });
});
