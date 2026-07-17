import { beforeEach, describe, expect, it } from 'vitest';
import type { Insight } from '../insight/insight';
import { InsightSource } from '../insight/insight-source';
import { InsightType } from '../insight/insight-type';
import { RecommendationDomainService } from './recommendation-domain.service';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';
import { InMemoryRecommendationRepository } from './repositories/in-memory-recommendation.repository';

const WORKSPACE_ID = 'ws-1';

function insight(
  partial: Partial<Insight> & Pick<Insight, 'id' | 'type' | 'title' | 'summary'>,
): Insight {
  return {
    workspaceId: WORKSPACE_ID,
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
    service = new RecommendationDomainService(new InMemoryRecommendationRepository());
  });

  it('creates a recommendation with insight references only', () => {
    const recommendation = service.create({
      workspaceId: WORKSPACE_ID,
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
    expect(recommendation.workspaceId).toBe(WORKSPACE_ID);
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
      workspaceId: WORKSPACE_ID,
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
      workspaceId: WORKSPACE_ID,
      type: RecommendationType.VERIFY_RESULT,
      priority: RecommendationPriority.LOW,
      title: 'Draft',
      description: 'Initial',
      rationale: 'r',
      insightIds: ['i-1'],
    });

    const updated = service.update(
      created.id,
      {
        title: 'Revised',
        priority: RecommendationPriority.CRITICAL,
        insightIds: ['i-1', 'i-3'],
        metadata: { ruleId: 'updated' },
      },
      WORKSPACE_ID,
    );

    expect(updated?.title).toBe('Revised');
    expect(updated?.priority).toBe(RecommendationPriority.CRITICAL);
    expect(updated?.insightIds).toEqual(['i-1', 'i-3']);
    expect(updated?.metadata).toEqual({ ruleId: 'updated' });

    expect(service.delete(created.id, WORKSPACE_ID)).toBe(true);
    expect(service.getById(created.id, WORKSPACE_ID)).toBeNull();
    expect(service.update(created.id, { title: 'gone' }, WORKSPACE_ID)).toBeNull();
  });

  it('does not leak recommendations across workspaces', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: RecommendationType.VERIFY_RESULT,
      priority: RecommendationPriority.LOW,
      title: 'Draft',
      description: 'Initial',
      rationale: 'r',
    });

    expect(service.getById(created.id, 'ws-2')).toBeNull();
    expect(service.update(created.id, { title: 'x' }, 'ws-2')).toBeNull();
    expect(service.delete(created.id, 'ws-2')).toBe(false);
  });

  it('searches with AND filters', () => {
    service.create({
      workspaceId: WORKSPACE_ID,
      type: RecommendationType.REPEAT_EXPERIMENT,
      priority: RecommendationPriority.HIGH,
      title: 'Repeat A',
      description: 'confirm pattern',
      rationale: 'r',
      insightIds: ['i-a'],
      campaignSessionIds: ['sess-a'],
    });
    service.create({
      workspaceId: WORKSPACE_ID,
      type: RecommendationType.EXPAND_SCOPE,
      priority: RecommendationPriority.MEDIUM,
      title: 'Expand B',
      description: 'broaden',
      rationale: 'r',
      insightIds: ['i-b'],
      campaignSessionIds: ['sess-b'],
    });

    expect(
      service.search({ type: RecommendationType.REPEAT_EXPERIMENT }, WORKSPACE_ID),
    ).toHaveLength(1);
    expect(service.search({ priority: RecommendationPriority.MEDIUM }, WORKSPACE_ID)).toHaveLength(
      1,
    );
    expect(service.search({ insightId: 'i-a' }, WORKSPACE_ID)).toHaveLength(1);
    expect(service.search({ campaignSessionId: 'sess-b' }, WORKSPACE_ID)).toHaveLength(1);
    expect(service.search({ q: 'confirm' }, WORKSPACE_ID)).toHaveLength(1);
    expect(
      service.search(
        {
          type: RecommendationType.REPEAT_EXPERIMENT,
          campaignSessionId: 'sess-b',
        },
        WORKSPACE_ID,
      ),
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

    const generated = service.generateFromInsights(insights, WORKSPACE_ID);

    expect(generated).toHaveLength(2);
    expect(generated[0]?.workspaceId).toBe(WORKSPACE_ID);
    expect(generated[0]?.type).toBe(RecommendationType.REPEAT_EXPERIMENT);
    expect(generated[1]?.type).toBe(RecommendationType.EXPAND_SCOPE);
    expect(generated[0]?.insightIds).toEqual(['i-pattern']);
    expect(generated[0]?.campaignSessionIds).toEqual(['sess-1']);
    expect(generated[0]?.description).not.toContain('do not copy this payload');
    expect(generated[0]?.metadata.generatedBy).toBe('recommendation-deterministic');
    expect(service.search({ insightId: 'i-pattern' }, WORKSPACE_ID)).toHaveLength(1);
  });
});
