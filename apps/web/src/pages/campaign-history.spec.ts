import { describe, expect, it } from 'vitest';
import { mergeCampaignHistory } from './campaign-history';
import type { CampaignSummary } from '../shared/api';

function makeSummary(campaignId: string, createdAt: string): CampaignSummary {
  return {
    campaignId,
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 0,
    failCount: 1,
    needsReviewCount: 0,
    bestExperimentId: `exp-${campaignId}`,
    createdAt,
    failedRuns: [],
  };
}

describe('campaign history merge', () => {
  it('lets workspace-backed sessions win over localStorage copies', () => {
    const local = makeSummary('camp-1', '2026-08-16T10:00:00.000Z');
    const workspace = {
      ...makeSummary('camp-1', '2026-08-16T10:00:00.000Z'),
      sessionId: 'sess-1',
    };
    const merged = mergeCampaignHistory(
      [workspace],
      [local, makeSummary('camp-2', '2026-08-16T09:00:00.000Z')],
    );
    expect(merged[0]?.campaignId).toBe('camp-1');
    expect(merged[0]?.sessionId).toBe('sess-1');
    expect(merged.map((item) => item.campaignId)).toEqual(['camp-1', 'camp-2']);
  });
});
