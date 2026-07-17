import { describe, expect, it } from 'vitest';
import type { Insight } from '../insight/insight';
import { InsightSource } from '../insight/insight-source';
import { InsightType } from '../insight/insight-type';
import { draftRecommendationsFromInsights } from './recommendation-generation.rules';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';

function insight(partial: Partial<Insight> & Pick<Insight, 'type' | 'title' | 'summary'>): Insight {
  return {
    id: partial.id ?? 'insight-1',
    knowledgeEntryIds: partial.knowledgeEntryIds ?? [],
    sources: partial.sources ?? [InsightSource.Knowledge],
    metadata: partial.metadata ?? {},
    createdAt: partial.createdAt ?? '2026-07-17T00:00:00.000Z',
    confidence: partial.confidence ?? 0.75,
    type: partial.type,
    title: partial.title,
    summary: partial.summary,
    ...(partial.campaignSessionId !== undefined
      ? { campaignSessionId: partial.campaignSessionId }
      : {}),
    ...(partial.experimentId !== undefined ? { experimentId: partial.experimentId } : {}),
  };
}

describe('recommendation-generation.rules (US098)', () => {
  it('maps repeated pattern → REPEAT_EXPERIMENT', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        type: InsightType.PATTERN,
        title: 'Repeated fee pattern',
        summary: 'Recurring observation across campaigns',
        confidence: 0.9,
        campaignSessionId: 'sess-1',
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.REPEAT_EXPERIMENT);
    expect(draft.priority).toBe(RecommendationPriority.HIGH);
    expect(draft.insightIds).toEqual(['insight-1']);
    expect(draft.campaignSessionIds).toEqual(['sess-1']);
    expect(draft.metadata.ruleId).toBe('repeated-pattern');
    expect(draft.description).not.toContain('Recurring observation across campaigns');
  });

  it('maps conflicting conclusions → VERIFY_RESULT', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        id: 'i-conflict',
        type: InsightType.ANOMALY,
        title: 'Conflicting conclusions',
        summary: 'Verdicts contradict across sessions',
        confidence: 0.85,
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.VERIFY_RESULT);
    expect(draft.priority).toBe(RecommendationPriority.CRITICAL);
    expect(draft.metadata.ruleId).toBe('conflicting-conclusions');
  });

  it('maps stable trend → EXPAND_SCOPE', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        type: InsightType.TREND,
        title: 'Stable trend',
        summary: 'Consistent direction over time',
        confidence: 0.6,
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.EXPAND_SCOPE);
    expect(draft.priority).toBe(RecommendationPriority.MEDIUM);
    expect(draft.metadata.ruleId).toBe('stable-trend');
  });

  it('maps anomaly → INVESTIGATE_ANOMALY', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        type: InsightType.ANOMALY,
        title: 'Unexpected spike',
        summary: 'Outlier drawdown observed',
        confidence: 0.7,
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.INVESTIGATE_ANOMALY);
    expect(draft.metadata.ruleId).toBe('anomaly');
  });

  it('maps model disagreement → COMPARE_MODELS', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        type: InsightType.OBSERVATION,
        title: 'Models disagree',
        summary: 'Multiple model disagreement on ranking',
        confidence: 0.8,
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.COMPARE_MODELS);
    expect(draft.metadata.ruleId).toBe('model-disagreement');
  });

  it('maps insufficient evidence → COLLECT_MORE_DATA', () => {
    const [draft] = draftRecommendationsFromInsights([
      insight({
        type: InsightType.SUMMARY,
        title: 'Sparse sample',
        summary: 'Insufficient evidence to conclude',
        confidence: 0.4,
      }),
    ]);

    expect(draft.type).toBe(RecommendationType.COLLECT_MORE_DATA);
    expect(draft.metadata.ruleId).toBe('insufficient-evidence');
  });
});
