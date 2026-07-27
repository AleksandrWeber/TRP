import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/api', () => ({
  runCampaign: vi.fn(),
  api: {
    listDatasets: vi.fn().mockResolvedValue([]),
  },
}));

import { runCampaign } from '../shared/api';
import {
  parseParamsListJson,
  submitCampaignRun,
  validateCampaignRunInput,
} from './CampaignRunPage';

describe('CampaignRunPage', () => {
  beforeEach(() => {
    vi.mocked(runCampaign).mockReset();
  });

  it('parses paramsList JSON array of objects', () => {
    expect(parseParamsListJson('[{"channelPeriod":10}]')).toEqual([{ channelPeriod: 10 }]);
  });

  it('rejects empty paramsList array', () => {
    expect(() => parseParamsListJson('[]')).toThrow('paramsList must be a non-empty JSON array');
  });

  it('rejects invalid JSON', () => {
    expect(() => parseParamsListJson('{')).toThrow('paramsList must be valid JSON');
  });

  it('rejects non-object array items', () => {
    expect(() => parseParamsListJson('[1,2]')).toThrow('paramsList must be an array of objects');
  });

  it('requires dataset and strategy ids before submit', () => {
    expect(() =>
      validateCampaignRunInput({
        datasetId: '  ',
        strategyId: 'donchian-breakout',
        paramsListRaw: '[{"channelPeriod":10}]',
      }),
    ).toThrow('Dataset ID is required.');

    expect(() =>
      validateCampaignRunInput({
        datasetId: 'ds-1',
        strategyId: '',
        paramsListRaw: '[{"channelPeriod":10}]',
      }),
    ).toThrow('Strategy ID is required.');
  });

  it('submits Run Campaign via runCampaign()', async () => {
    vi.mocked(runCampaign).mockResolvedValue({
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 1,
      passCount: 0,
      failCount: 1,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      createdAt: '2026-07-16T12:00:00.000Z',
      failedRuns: [],
    });

    const summary = await submitCampaignRun({
      datasetId: ' ds-1 ',
      strategyId: ' donchian-breakout ',
      paramsListRaw: '[{"channelPeriod":10}]',
    });

    expect(runCampaign).toHaveBeenCalledWith({
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }],
    });
    expect(summary.campaignId).toBe('camp-1');
    expect(summary.bestExperimentId).toBe('exp-1');
  });
});
