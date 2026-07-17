import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth', () => ({
  getAccessToken: () => 'test-token',
  clearAccessToken: vi.fn(),
}));

import { runCampaign } from './api';

describe('runCampaign', () => {
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

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => summary,
        text: async () => JSON.stringify(summary),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('POSTs /v1/campaigns/run and returns CampaignSummary', async () => {
    const body = {
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
    };

    const result = await runCampaign(body);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toContain('/v1/campaigns/run');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(body));
    expect(result).toEqual(summary);
  });
});
