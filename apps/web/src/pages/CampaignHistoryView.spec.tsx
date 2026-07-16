import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignSummary } from '../shared/api';
import {
  appendCampaignHistory,
  CAMPAIGN_HISTORY_KEY,
  loadCampaignHistory,
  orderCampaignHistoryNewestFirst,
} from './campaign-history';
import { CampaignHistoryView } from './CampaignHistoryView';

function makeSummary(
  campaignId: string,
  createdAt: string,
  overrides: Partial<CampaignSummary> = {},
): CampaignSummary {
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
    ...overrides,
  };
}

describe('CampaignHistoryView', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => memory.clear(),
    });
  });

  it('shows two history entries after two runs with newest first', () => {
    const older = makeSummary('camp-old', '2026-07-16T10:00:00.000Z');
    const newer = makeSummary('camp-new', '2026-07-16T12:00:00.000Z');

    appendCampaignHistory(older);
    appendCampaignHistory(newer);

    const history = loadCampaignHistory();
    expect(history).toHaveLength(2);
    expect(history[0]?.campaignId).toBe('camp-new');
    expect(history[1]?.campaignId).toBe('camp-old');
    expect(memory.get(CAMPAIGN_HISTORY_KEY)).toBeTruthy();

    const html = renderToStaticMarkup(<CampaignHistoryView items={history} />);
    const firstIdx = html.indexOf('data-campaign-id="camp-new"');
    const secondIdx = html.indexOf('data-campaign-id="camp-old"');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(html.match(/data-testid="campaign-history-item"/g)?.length).toBe(2);
  });

  it('orders unsorted items newest first', () => {
    const ordered = orderCampaignHistoryNewestFirst([
      makeSummary('a', '2026-07-16T09:00:00.000Z'),
      makeSummary('b', '2026-07-16T11:00:00.000Z'),
    ]);
    expect(ordered.map((item) => item.campaignId)).toEqual(['b', 'a']);
  });
});
