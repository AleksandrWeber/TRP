import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ResearchAnalysis } from '../shared/api';
import { CampaignAnalysisView } from './CampaignAnalysisView';

const analysis: ResearchAnalysis = {
  executiveSummary:
    'Campaign camp-1 on strategy donchian-breakout FAIL: 2/2 configurations failed.',
  strengths: ['Lowest observed drawdown is 12.5%.'],
  weaknesses: ['No configuration fully passed validation.'],
  recommendations: ['Do not promote this strategy class from the current campaign.'],
  nextHypothesis: 'Replace or filter donchian-breakout on dataset ds-1.',
};

describe('CampaignAnalysisView', () => {
  it('renders all analysis sections read-only', () => {
    const html = renderToStaticMarkup(<CampaignAnalysisView analysis={analysis} />);

    expect(html).toContain('data-testid="campaign-analysis"');
    expect(html).toContain('Executive Summary');
    expect(html).toContain(analysis.executiveSummary);
    expect(html).toContain('Strengths');
    expect(html).toContain(analysis.strengths[0]!);
    expect(html).toContain('Weaknesses');
    expect(html).toContain(analysis.weaknesses[0]!);
    expect(html).toContain('Recommendations');
    expect(html).toContain(analysis.recommendations[0]!);
    expect(html).toContain('Next Hypothesis');
    expect(html).toContain(analysis.nextHypothesis);
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<textarea');
  });
});
