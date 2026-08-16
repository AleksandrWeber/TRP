import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth', () => ({
  getAccessToken: () => 'test-token',
  getCsrfToken: () => null,
  getActiveWorkspace: () => ({ id: 'ws-test', name: 'Test' }),
  clearAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  setCsrfToken: vi.fn(),
}));

import { api, runCampaign } from './api';

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

    expect(fetch).toHaveBeenCalled();
    const campaignCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/v1/campaigns/run'));
    expect(campaignCall).toBeDefined();
    const [url, init] = campaignCall!;
    expect(String(url)).toContain('/v1/campaigns/run');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(body));
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('X-Workspace-Id')).toBe('ws-test');
    expect(init?.credentials).toBe('include');
    expect(result).toEqual(summary);
  });
});

describe('shared api error mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('maps 404 experiment JSON to a friendly message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            statusCode: 404,
            error: 'Not Found',
            message: 'Experiment missing-id not found',
          }),
      }),
    );

    await expect(api.getExperiment('missing-id')).rejects.toThrow('Experiment not found.');
  });

  it('maps 500 JSON to unexpected server error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ statusCode: 500, message: 'boom' }),
      }),
    );

    await expect(api.listKnowledge()).rejects.toThrow(
      'Unexpected server error. Please try again later.',
    );
  });
});
