import { beforeEach, describe, expect, it } from 'vitest';
import type { Insight } from '../insight/insight';
import { InsightSource } from '../insight/insight-source';
import { InsightType } from '../insight/insight-type';
import { RecommendationDomainService } from './recommendation-domain.service';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';

function insight(
  partial: Partial<Insight> & Pick<Insight, 'id' | 'type' | 'title' | 'summary'>,
): Insight {
  return {
    knowledgeEntryIds: [],
    sources: [InsightSource.Knowledge],
    metadata: {},
    createdAt: '2026-07-17T00:00:00.000Z',
    confidence: 0.8,
    ...partial,
  };
}

describe('RecommendationDomainService (US098)', () => {
  let service: RecommendationDomainService;

  beforeEach(() => {
    service = new RecommendationDomainService();
  });

  it('creates a recommendation with insight references only', () => {
    const recommendation = service.create({
      insightIds: ['i-1', 'i-2'],
      campaignSessionIds: ['sess-1'],
      type: RecommendationType.REPEAT_EXPERIMENT,
      priority: RecommendationPriority.HIGH,
      title: 'Repeat experiment',
      description: 'Confirm the pattern',
      rationale: 'Repeated pattern detected',
      metadata: {
        confidence: 0.9,
        generatedBy: 'manual',
        ruleId: 'manual-1',
        pipelineRunId: 'run-1',
      },
    });

    expect(recommendation.id.length).toBeGreaterThan(0);
    expect(recommendation.insightIds).toEqual(['i-1', 'i-2']);
    expect(recommendation.campaignSessionIds).toEqual(['sess-1']);
    expect(recommendation.type).toBe(RecommendationType.REPEAT_EXPERIMENT);
    expect(recommendation.priority).toBe(RecommendationPriority.HIGH);
    expect(recommendation.metadata).toEqual({
      confidence: 0.9,
      generatedBy: 'manual',
      ruleId: 'manual-1',
      pipelineRunId: 'run-1',
    });
    expect(Number.isNaN(Date.parse(recommendation.createdAt))).toBe(false);
  });

  it('defaults optional arrays and clones ids on create', () => {
    const insightIds = ['i-shared'];
    const campaignSessionIds = ['sess-shared'];

    const recommendation = service.create({
      insightIds,
      campaignSessionIds,
      type: RecommendationType.EXPAND_SCOPE,
      priority: RecommendationPriority.MEDIUM,
      title: 'Expand',
      description: 'd',
      rationale: 'r',
    });

    insightIds.push('mutated');
    campaignSessionIds.push('mutated');

    expect(recommendation.insightIds).toEqual(['i-shared']);
    expect(recommendation.campaignSessionIds).toEqual(['sess-shared']);
    expect(recommendation.metadata).toEqual({});
  });

  it('updates and deletes a recommendation', () => {
    const created = service.create({
      type: RecommendationType.VERIFY_RESULT,
      priority: RecommendationPriority.LOW,
      title: 'Draft',
      description: 'Initial',
      rationale: 'r',
      insightIds: ['i-1'],
    });

    const updated = service.update(created.id, {
      title: 'Revised',
      priority: RecommendationPriority.CRITICAL,
      insightIds: ['i-1', 'i-3'],
      metadata: { ruleId: 'updated' },
    });

    expect(updated?.title).toBe('Revised');
    expect(updated?.priority).toBe(RecommendationPriority.CRITICAL);
    expect(updated?.insightIds).toEqual(['i-1', 'i-3']);
    expect(updated?.metadata).toEqual({ ruleId: 'updated' });

    expect(service.delete(created.id)).toBe(true);
    expect(service.getById(created.id)).toBeNull();
    expect(service.update(created.id, { title: 'gone' })).toBeNull();
  });

  it('searches with AND filters', () => {
    service.create({
      type: RecommendationType.REPEAT_EXPERIMENT,
      priority: RecommendationPriority.HIGH,
      title: 'Repeat A',
      description: 'confirm pattern',
      rationale: 'r',
      insightIds: ['i-a'],
      campaignSessionIds: ['sess-a'],
    });
    service.create({
      type: RecommendationType.EXPAND_SCOPE,
      priority: RecommendationPriority.MEDIUM,
      title: 'Expand B',
      description: 'broaden',
      rationale: 'r',
      insightIds: ['i-b'],
      campaignSessionIds: ['sess-b'],
    });

    expect(service.search({ type: RecommendationType.REPEAT_EXPERIMENT })).toHaveLength(1);
    expect(service.search({ priority: RecommendationPriority.MEDIUM })).toHaveLength(1);
    expect(service.search({ insightId: 'i-a' })).toHaveLength(1);
    expect(service.search({ campaignSessionId: 'sess-b' })).toHaveLength(1);
    expect(service.search({ q: 'confirm' })).toHaveLength(1);
    expect(
      service.search({
        type: RecommendationType.REPEAT_EXPERIMENT,
        campaignSessionId: 'sess-b',
      }),
    ).toHaveLength(0);
  });

  it('generateFromInsights creates actionable recommendations without Insight payload', () => {
    const insights: Insight[] = [
      insight({
        id: 'i-pattern',
        type: InsightType.PATTERN,
        title: 'Repeated fee pattern',
        summary: 'Short holds lose edge after fees — do not copy this payload',
        campaignSessionId: 'sess-1',
        confidence: 0.9,
      }),
      insight({
        id: 'i-trend',
        type: InsightType.TREND,
        title: 'Stable trend',
        summary: 'Consistent direction',
        confidence: 0.6,
      }),
    ];

    const generated = service.generateFromInsights(insights);

    expect(generated).toHaveLength(2);
    expect(generated[0]?.type).toBe(RecommendationType.REPEAT_EXPERIMENT);
    expect(generated[1]?.type).toBe(RecommendationType.EXPAND_SCOPE);
    expect(generated[0]?.insightIds).toEqual(['i-pattern']);
    expect(generated[0]?.campaignSessionIds).toEqual(['sess-1']);
    expect(generated[0]?.description).not.toContain('do not copy this payload');
    expect(generated[0]?.metadata.generatedBy).toBe('recommendation-deterministic');
    expect(service.search({ insightId: 'i-pattern' })).toHaveLength(1);
  });
});
