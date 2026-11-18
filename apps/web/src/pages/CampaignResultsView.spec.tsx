import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CampaignCandidate, CampaignSummary } from '../shared/api';
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

const candidates: CampaignCandidate[] = [
  {
    rank: 1,
    experimentId: 'exp-best',
    params: { channelPeriod: 20 },
    verdict: 'pass',
    profitFactor: 1.4,
    totalReturnPercent: 6,
    expectancy: 1.1,
    maxDrawdownPercent: 4,
  },
  {
    rank: 2,
    experimentId: 'exp-mid',
    params: {
      note: 'a-very-long-parameter-value-that-must-stay-inside-the-cell-without-overflowing-the-page',
    },
    verdict: 'fail',
    profitFactor: 0.6,
    totalReturnPercent: null,
    expectancy: null,
    maxDrawdownPercent: null,
  },
];

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

  it('renders ranked candidates and marks the winner', () => {
    const html = renderToStaticMarkup(<CampaignResultsView summary={{ ...summary, candidates }} />);
    const winnerAt = html.indexOf('data-testid="candidate-winner"');
    const winnerRow = html.slice(winnerAt, html.indexOf('</tr>', winnerAt));
    const midAt = html.indexOf('data-experiment-id="exp-mid"');

    expect(html).toContain('data-testid="candidate-table"');
    expect(winnerAt).toBeGreaterThan(-1);
    expect(midAt).toBeGreaterThan(winnerAt);
    expect(winnerRow).toContain('exp-best');
    expect(winnerRow).toContain('Winner');
    expect(winnerRow).toContain('channelPeriod=20');
    expect(winnerRow).toContain('pass');
    expect(winnerRow).toContain('1.4');
    expect(winnerRow).toContain('6');
    expect(winnerRow).toContain('1.1');
    expect(winnerRow).toContain('4');
    expect(html).toContain('a-very-long-parameter-value-that-must-stay-inside-the-cell');
    expect(html).toContain('break-all');
    expect(html).toContain('No configuration passed validation.');
    expect(html).toContain('data-testid="totalRuns"');
  });

  it('renders missing metrics without throwing', () => {
    const html = renderToStaticMarkup(
      <CampaignResultsView
        summary={{
          ...summary,
          candidates: [candidates[1]!],
          bestExperimentId: 'exp-mid',
        }}
      />,
    );
    const rowAt = html.indexOf('data-testid="candidate-winner"');
    const row = html.slice(rowAt, html.indexOf('</tr>', rowAt));

    expect(row).toContain('exp-mid');
    expect(row).toContain('0.6');
    expect(row.match(/—/g)?.length).toBe(3);
  });

  it('renders an empty candidate table when every run failed', () => {
    const failed: CampaignSummary = {
      ...summary,
      totalRuns: 2,
      passCount: 0,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: null,
      failedRuns: [
        { params: { channelPeriod: 10 }, error: 'dataset missing' },
        { params: { channelPeriod: 20 }, error: 'dataset missing' },
      ],
      candidates: [],
    };
    const html = renderToStaticMarkup(<CampaignResultsView summary={failed} />);
    const recommendations = campaignRecommendationsFromSummary(failed);

    expect(html).toContain('data-testid="candidates-empty"');
    expect(html).toContain('No completed candidates.');
    expect(html).not.toContain('data-testid="candidate-winner"');
    expect(html).toContain('data-testid="failedRuns"');
    expect(html).toContain('>2<');
    for (const item of recommendations) {
      expect(html).toContain(item);
    }
  });
});
