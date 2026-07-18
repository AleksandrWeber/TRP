import { describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { compareCampaignBundles } from './cross-campaign-analysis.rules';

function sampleReport(overrides?: Partial<CampaignReport>): CampaignReport {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 2,
    passCount: 0,
    failCount: 2,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 0.8,
    bestReturn: -1,
    bestExpectancy: -0.5,
    lowestDrawdown: 20,
    verdict: 'FAIL',
    recommendations: [],
    createdAt: '2026-07-17T10:00:00.000Z',
    ...overrides,
  };
}

function sampleSession(id: string, reportOverrides?: Partial<CampaignReport>): CampaignSession {
  return {
    id,
    workspaceId: 'ws-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: { engineVersion: '1.0.0', datasetId: 'ds-1' },
    report: sampleReport({ campaignId: id, ...reportOverrides }),
  };
}

function sampleKnowledge(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    knowledgeId: overrides?.knowledgeId ?? 'k-1',
    workspaceId: overrides?.workspaceId ?? 'ws-1',
    experimentId: overrides?.experimentId ?? 'exp-1',
    createdAt: '2026-07-17T10:00:00.000Z',
    title: overrides?.title ?? 'Shared finding',
    summary: 's',
    tags: ['fail'],
    insights: [],
    metadata: {
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      ...(overrides?.metadata ?? {}),
    },
  };
}

describe('compareCampaignBundles (US097)', () => {
  it('detects stable trend when all verdicts match', () => {
    const findings = compareCampaignBundles({
      sessions: [
        sampleSession('c1', { verdict: 'FAIL' }),
        sampleSession('c2', { verdict: 'FAIL', bestExperimentId: 'exp-2' }),
      ],
      knowledgeEntries: [],
      insights: [],
      experimentIds: ['exp-1', 'exp-2'],
    });

    expect(findings.some((f) => f.kind === 'stable_trend')).toBe(true);
  });

  it('detects conflicting conclusions for same strategy+dataset', () => {
    const findings = compareCampaignBundles({
      sessions: [
        sampleSession('c1', { verdict: 'FAIL' }),
        sampleSession('c2', { verdict: 'PASS', bestExperimentId: 'exp-2' }),
      ],
      knowledgeEntries: [],
      insights: [],
      experimentIds: [],
    });

    expect(findings.some((f) => f.kind === 'conflicting_conclusion')).toBe(true);
  });

  it('detects repeated findings across campaigns', () => {
    const findings = compareCampaignBundles({
      sessions: [sampleSession('c1'), sampleSession('c2')],
      knowledgeEntries: [
        sampleKnowledge({ knowledgeId: 'k-1', title: 'Fee erosion' }),
        sampleKnowledge({ knowledgeId: 'k-2', title: 'Fee erosion', experimentId: 'exp-2' }),
      ],
      insights: [],
      experimentIds: [],
    });

    expect(findings.some((f) => f.kind === 'repeated_finding')).toBe(true);
  });

  it('detects recurring strategy patterns', () => {
    const findings = compareCampaignBundles({
      sessions: [
        sampleSession('c1', { strategyId: 'ema-crossover' }),
        sampleSession('c2', { strategyId: 'ema-crossover', bestExperimentId: 'exp-2' }),
      ],
      knowledgeEntries: [],
      insights: [],
      experimentIds: [],
    });

    expect(findings.some((f) => f.kind === 'recurring_pattern')).toBe(true);
  });
});
