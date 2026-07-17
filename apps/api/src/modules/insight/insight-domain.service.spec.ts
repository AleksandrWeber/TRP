import { beforeEach, describe, expect, it } from 'vitest';
import { createInsightDomainService } from './insight-domain.test-utils';
import { InsightDomainService } from './insight-domain.service';
import { InsightSource } from './insight-source';
import { InsightType } from './insight-type';

const WORKSPACE_ID = 'ws-1';

describe('InsightDomainService (US095)', () => {
  let service: InsightDomainService;

  beforeEach(() => {
    ({ service } = createInsightDomainService());
  });

  it('creates an insight with references only', () => {
    const insight = service.create({
      workspaceId: WORKSPACE_ID,
      campaignSessionId: 'sess-1',
      experimentId: 'exp-1',
      knowledgeEntryIds: ['k-1', 'k-2'],
      type: InsightType.PATTERN,
      title: 'Fee erosion pattern',
      summary: 'Short holds lose edge after fee-adjusted accounting',
      confidence: 0.8,
      sources: [InsightSource.Knowledge, InsightSource.Experiment],
      metadata: {
        model: 'none',
        promptVersion: 'n/a',
        executionTime: 12,
        pipelineRunId: 'run-1',
      },
    });

    expect(insight.id.length).toBeGreaterThan(0);
    expect(insight.workspaceId).toBe(WORKSPACE_ID);
    expect(insight.campaignSessionId).toBe('sess-1');
    expect(insight.experimentId).toBe('exp-1');
    expect(insight.knowledgeEntryIds).toEqual(['k-1', 'k-2']);
    expect(insight.type).toBe(InsightType.PATTERN);
    expect(insight.title).toBe('Fee erosion pattern');
    expect(insight.summary).toMatch(/fee-adjusted/);
    expect(insight.confidence).toBe(0.8);
    expect(insight.sources).toEqual([InsightSource.Knowledge, InsightSource.Experiment]);
    expect(insight.metadata).toEqual({
      model: 'none',
      promptVersion: 'n/a',
      executionTime: 12,
      pipelineRunId: 'run-1',
    });
    expect(Number.isNaN(Date.parse(insight.createdAt))).toBe(false);
  });

  it('defaults optional arrays and clamps confidence', () => {
    const insight = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.OBSERVATION,
      title: 'Minimal',
      summary: 'Only required fields',
      confidence: 1.5,
    });

    expect(insight.knowledgeEntryIds).toEqual([]);
    expect(insight.sources).toEqual([]);
    expect(insight.metadata).toEqual({});
    expect(insight.confidence).toBe(1);
    expect(insight.campaignSessionId).toBeUndefined();
    expect(insight.experimentId).toBeUndefined();
  });

  it('clones knowledgeEntryIds and sources on create', () => {
    const knowledgeEntryIds = ['k-shared'];
    const sources = [InsightSource.Campaign];

    const insight = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.TREND,
      title: 'Clone check',
      summary: 's',
      knowledgeEntryIds,
      sources,
    });

    knowledgeEntryIds.push('mutated');
    sources.push(InsightSource.AIAnalysis);

    expect(insight.knowledgeEntryIds).toEqual(['k-shared']);
    expect(insight.sources).toEqual([InsightSource.Campaign]);
  });

  it('updates an insight', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.SUMMARY,
      title: 'Draft',
      summary: 'Initial',
      confidence: 0.2,
      knowledgeEntryIds: ['k-1'],
    });

    const updated = service.update(
      created.id,
      {
        title: 'Revised',
        summary: 'Updated summary',
        type: InsightType.ANOMALY,
        confidence: 0.9,
        knowledgeEntryIds: ['k-1', 'k-3'],
        sources: [InsightSource.AIAnalysis],
        metadata: { model: 'manual' },
        campaignSessionId: 'sess-9',
        experimentId: 'exp-9',
      },
      WORKSPACE_ID,
    );

    expect(updated).not.toBeNull();
    expect(updated?.id).toBe(created.id);
    expect(updated?.title).toBe('Revised');
    expect(updated?.summary).toBe('Updated summary');
    expect(updated?.type).toBe(InsightType.ANOMALY);
    expect(updated?.confidence).toBe(0.9);
    expect(updated?.knowledgeEntryIds).toEqual(['k-1', 'k-3']);
    expect(updated?.sources).toEqual([InsightSource.AIAnalysis]);
    expect(updated?.metadata).toEqual({ model: 'manual' });
    expect(updated?.campaignSessionId).toBe('sess-9');
    expect(updated?.experimentId).toBe('exp-9');
  });

  it('clears optional refs when update passes null', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      campaignSessionId: 'sess-1',
      experimentId: 'exp-1',
      type: InsightType.CORRELATION,
      title: 'Clear me',
      summary: 's',
    });

    const updated = service.update(
      created.id,
      {
        campaignSessionId: null,
        experimentId: null,
      },
      WORKSPACE_ID,
    );

    expect(updated?.campaignSessionId).toBeUndefined();
    expect(updated?.experimentId).toBeUndefined();
  });

  it('returns null when updating missing insight', () => {
    expect(service.update('missing', { title: 'x' }, WORKSPACE_ID)).toBeNull();
  });

  it('returns null when updating an insight in another workspace', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.SUMMARY,
      title: 'Draft',
      summary: 'Initial',
    });

    expect(service.update(created.id, { title: 'x' }, 'ws-2')).toBeNull();
  });

  it('gets by id', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.OBSERVATION,
      title: 'Get me',
      summary: 'Summary',
    });

    expect(service.getById(created.id, WORKSPACE_ID)).toBe(created);
    expect(service.getById('missing', WORKSPACE_ID)).toBeNull();
    expect(service.getById(created.id, 'ws-2')).toBeNull();
  });

  it('deletes an insight', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.TREND,
      title: 'Delete me',
      summary: 's',
    });

    expect(service.delete(created.id, WORKSPACE_ID)).toBe(true);
    expect(service.getById(created.id, WORKSPACE_ID)).toBeNull();
    expect(service.delete(created.id, WORKSPACE_ID)).toBe(false);
  });

  it('does not delete an insight from another workspace', () => {
    const created = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.TREND,
      title: 'Delete me',
      summary: 's',
    });

    expect(service.delete(created.id, 'ws-2')).toBe(false);
    expect(service.getById(created.id, WORKSPACE_ID)).not.toBeNull();
  });

  it('searches with AND filters', () => {
    service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.PATTERN,
      title: 'Donchian fee pattern',
      summary: 'Fees erase edge',
      sources: [InsightSource.Knowledge],
      knowledgeEntryIds: ['k-donchian'],
      experimentId: 'exp-d',
      campaignSessionId: 'sess-d',
    });

    service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.ANOMALY,
      title: 'EMA spike',
      summary: 'Unexpected drawdown cluster',
      sources: [InsightSource.Campaign],
      knowledgeEntryIds: ['k-ema'],
      experimentId: 'exp-e',
    });

    expect(service.search({}, WORKSPACE_ID)).toHaveLength(2);
    expect(service.search({ type: InsightType.PATTERN }, WORKSPACE_ID)).toHaveLength(1);
    expect(service.search({ source: InsightSource.Campaign }, WORKSPACE_ID)).toHaveLength(1);
    expect(service.search({ q: 'donchian' }, WORKSPACE_ID)[0]?.title).toMatch(/Donchian/);
    expect(service.search({ knowledgeEntryId: 'k-ema' }, WORKSPACE_ID)).toHaveLength(1);
    expect(
      service.search(
        {
          type: InsightType.PATTERN,
          experimentId: 'exp-d',
          campaignSessionId: 'sess-d',
          source: InsightSource.Knowledge,
          knowledgeEntryId: 'k-donchian',
          q: 'fee',
        },
        WORKSPACE_ID,
      ),
    ).toHaveLength(1);
    expect(
      service.search(
        {
          type: InsightType.PATTERN,
          experimentId: 'exp-e',
        },
        WORKSPACE_ID,
      ),
    ).toHaveLength(0);
  });

  it('does not leak insights across workspaces', () => {
    service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.PATTERN,
      title: 'ws-1 insight',
      summary: 'in ws-1',
    });
    service.create({
      workspaceId: 'ws-2',
      type: InsightType.PATTERN,
      title: 'ws-2 insight',
      summary: 'in ws-2',
    });

    expect(service.search({}, WORKSPACE_ID)).toHaveLength(1);
    expect(service.search({}, 'ws-2')).toHaveLength(1);
  });

  it('does not embed KnowledgeEntry contents', () => {
    const insight = service.create({
      workspaceId: WORKSPACE_ID,
      type: InsightType.SUMMARY,
      title: 'Reference only',
      summary: 'Points at knowledge ids',
      knowledgeEntryIds: ['k-1'],
    });

    expect(insight).not.toHaveProperty('tags');
    expect(insight).not.toHaveProperty('insights');
    expect(Object.keys(insight).sort()).toEqual(
      [
        'confidence',
        'createdAt',
        'id',
        'knowledgeEntryIds',
        'metadata',
        'sources',
        'summary',
        'title',
        'type',
        'workspaceId',
      ].sort(),
    );
  });
});
