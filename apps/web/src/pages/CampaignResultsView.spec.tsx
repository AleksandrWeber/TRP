import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignSummary } from '../shared/api';
import { CampaignResultsView, campaignRecommendationsFromSummary } from './CampaignResultsView';

const summary: CampaignSummary = {
  campaignId: 'camp-1',
  strategyId: 'donchian-breakout',
  datasetId: 'ds-1',
  totalRuns: 3,
  passCount: 0,
  failCount: 3,
  needsReviewCount: 0,
  bestExperimentId: 'exp-best',
  createdAt: '2026-07-16T12:00:00.000Z',
  failedRuns: [],
};

describe('CampaignResultsView', () => {
  it('renders CampaignSummary fields', () => {
    const html = renderToStaticMarkup(<CampaignResultsView summary={summary} />);

    expect(html).toContain('data-testid="campaign-results"');
    expect(html).toContain('>3<');
    expect(html).toContain('exp-best');
    expect(html).toContain('FAIL');
  });

  it('displays recommendations', () => {
    const recommendations = campaignRecommendationsFromSummary(summary);
    const html = renderToStaticMarkup(<CampaignResultsView summary={summary} />);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((item) => item.includes('No configuration passed'))).toBe(true);
    for (const item of recommendations) {
      expect(html).toContain(item);
    }
  });
});
