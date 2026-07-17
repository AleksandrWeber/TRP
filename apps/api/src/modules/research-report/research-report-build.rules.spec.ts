import { describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { Insight } from '../insight/insight';
import { InsightSource } from '../insight/insight-source';
import { InsightType } from '../insight/insight-type';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import type { Recommendation } from '../recommendation/recommendation';
import { RecommendationPriority } from '../recommendation/recommendation-priority';
import { RecommendationType } from '../recommendation/recommendation-type';
import { ReportSectionType } from './report-section-type';
import { buildResearchReportDraft } from './research-report-build.rules';

function sampleSession(id: string): CampaignSession {
  return {
    id,
    workspaceId: 'ws-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: { datasetId: 'ds-1' },
    report: {
      campaignId: id,
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 1,
      passCount: 0,
      failCount: 1,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 0.8,
      bestReturn: -1,
      bestExpectancy: -0.5,
      lowestDrawdown: 20,
      verdict: 'FAIL',
      recommendations: [],
      createdAt: '2026-07-17T10:00:00.000Z',
    },
  };
}

function sampleKnowledge(knowledgeId: string): KnowledgeEntry {
  return {
    knowledgeId,
    workspaceId: 'ws-1',
    experimentId: 'exp-1',
    createdAt: '2026-07-17T10:00:00.000Z',
    title: 'Finding',
    summary: 'payload must not appear in report',
    tags: [],
    insights: [],
    metadata: { strategyId: 'donchian-breakout', datasetId: 'ds-1' },
  };
}

function sampleInsight(id: string): Insight {
  return {
    id,
    workspaceId: 'ws-1',
    knowledgeEntryIds: ['k-1'],
    type: InsightType.PATTERN,
    title: 'Pattern',
    summary: 'insight payload must not appear',
    confidence: 0.8,
    sources: [InsightSource.Knowledge],
    metadata: {},
    createdAt: '2026-07-17T10:00:00.000Z',
    campaignSessionId: 'sess-1',
  };
}

function sampleRecommendation(id: string): Recommendation {
  return {
    id,
    workspaceId: 'ws-1',
    insightIds: ['i-1'],
    campaignSessionIds: ['sess-1'],
    type: RecommendationType.REPEAT_EXPERIMENT,
    priority: RecommendationPriority.HIGH,
    title: 'Repeat',
    description: 'recommendation payload must not appear',
    rationale: 'r',
    metadata: {},
    createdAt: '2026-07-17T10:00:00.000Z',
  };
}

describe('research-report-build.rules (US099)', () => {
  it('builds a structured draft with id-only sections', () => {
    const draft = buildResearchReportDraft({
      sessions: [sampleSession('sess-1'), sampleSession('sess-2')],
      knowledgeEntries: [sampleKnowledge('k-1'), sampleKnowledge('k-2')],
      insights: [sampleInsight('i-1')],
      recommendations: [sampleRecommendation('r-1')],
    });

    expect(draft.campaignSessionIds).toEqual(['sess-1', 'sess-2']);
    expect(draft.knowledgeEntryIds).toEqual(['k-1', 'k-2']);
    expect(draft.insightIds).toEqual(['i-1']);
    expect(draft.recommendationIds).toEqual(['r-1']);
    expect(draft.metadata).toEqual({
      campaignCount: 2,
      knowledgeEntryCount: 2,
      insightCount: 1,
      recommendationCount: 1,
      generatedBy: 'research-report-deterministic',
    });

    const byType = Object.fromEntries(draft.sections.map((s) => [s.type, s.itemIds]));
    expect(byType[ReportSectionType.FINDINGS]).toEqual(['k-1', 'k-2']);
    expect(byType[ReportSectionType.INSIGHTS]).toEqual(['i-1']);
    expect(byType[ReportSectionType.RECOMMENDATIONS]).toEqual(['r-1']);
    expect(byType[ReportSectionType.REFERENCES]).toEqual([
      'sess-1',
      'sess-2',
      'k-1',
      'k-2',
      'i-1',
      'r-1',
    ]);

    const serialized = JSON.stringify(draft);
    expect(serialized).not.toContain('payload must not appear');
    expect(serialized).not.toContain('insight payload');
    expect(serialized).not.toContain('recommendation payload');
  });

  it('handles empty aggregates', () => {
    const draft = buildResearchReportDraft({});
    expect(draft.campaignSessionIds).toEqual([]);
    expect(draft.sections).toHaveLength(5);
    expect(draft.metadata.campaignCount).toBe(0);
  });
});
