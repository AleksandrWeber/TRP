import type { CampaignSummary } from '../shared/api';

export const CAMPAIGN_HISTORY_KEY = 'trp_campaign_history';

export function orderCampaignHistoryNewestFirst(items: CampaignSummary[]): CampaignSummary[] {
  return [...items].sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.campaignId.localeCompare(a.campaignId),
  );
}

export function loadCampaignHistory(): CampaignSummary[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CAMPAIGN_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return orderCampaignHistoryNewestFirst(parsed as CampaignSummary[]);
  } catch {
    return [];
  }
}

export function appendCampaignHistory(summary: CampaignSummary): CampaignSummary[] {
  const next = orderCampaignHistoryNewestFirst([summary, ...loadCampaignHistory()]);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CAMPAIGN_HISTORY_KEY, JSON.stringify(next));
  }
  return next;
}
