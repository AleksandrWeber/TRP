import { beforeEach, describe, expect, it } from 'vitest';
import { createKnowledgeDomainService } from './knowledge-domain.test-utils';
import { KnowledgeDomainService } from './knowledge-domain.service';

const WORKSPACE_ID = 'ws-1';

describe('KnowledgeDomainService search (US079)', () => {
  let service: KnowledgeDomainService;

  beforeEach(() => {
    ({ service } = createKnowledgeDomainService());

    service.create({
      workspaceId: WORKSPACE_ID,
      experimentId: 'exp-donchian',
      title: 'Donchian breakout note',
      summary: 'Channel period failed on fee-adjusted accounting',
      tags: ['donchian', 'fail'],
      insights: ['Fees erase edge on short holds'],
      metadata: { strategyId: 'donchian-breakout', datasetId: 'ds-1' },
    });

    service.create({
      workspaceId: WORKSPACE_ID,
      experimentId: 'exp-ema',
      title: 'EMA crossover review',
      summary: 'Fast/slow EMA stayed below pass threshold',
      tags: ['ema', 'needs_review'],
      insights: ['Widen spread before retest'],
      metadata: { strategyId: 'ema-crossover', datasetId: 'ds-2' },
    });
  });

  it('lists all entries', () => {
    expect(service.find({}, WORKSPACE_ID)).toHaveLength(2);
    expect(service.list(WORKSPACE_ID)).toHaveLength(2);
  });

  it('searches by title', () => {
    const results = service.search('donchian breakout', WORKSPACE_ID);
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');
  });

  it('searches by summary', () => {
    const results = service.search('pass threshold', WORKSPACE_ID);
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-ema');
  });

  it('searches by insight', () => {
    const results = service.search('fees erase', WORKSPACE_ID);
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');
  });

  it('searches by tag', () => {
    expect(service.searchByTag('ema', WORKSPACE_ID).map((e) => e.experimentId)).toEqual([
      'exp-ema',
    ]);
    expect(service.searchByTag('FAIL', WORKSPACE_ID).map((e) => e.experimentId)).toEqual([
      'exp-donchian',
    ]);
  });

  it('searches by experimentId', () => {
    expect(service.searchByExperiment('exp-ema', WORKSPACE_ID)).toHaveLength(1);
    expect(service.searchByExperiment('missing', WORKSPACE_ID)).toEqual([]);
  });

  it('applies combined filters with AND semantics', () => {
    const results = service.find(
      {
        q: 'fee',
        tag: 'donchian',
        experimentId: 'exp-donchian',
      },
      WORKSPACE_ID,
    );
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');

    expect(
      service.find(
        {
          q: 'fee',
          tag: 'ema',
        },
        WORKSPACE_ID,
      ),
    ).toEqual([]);
  });

  it('returns empty array when nothing matches', () => {
    expect(service.search('nonexistent-token', WORKSPACE_ID)).toEqual([]);
    expect(service.find({ tag: 'missing-tag' }, WORKSPACE_ID)).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(service.search('DONCHIAN', WORKSPACE_ID)).toHaveLength(1);
    expect(service.search('Fee-Adjusted', WORKSPACE_ID)).toHaveLength(1);
    expect(service.searchByTag('Needs_Review', WORKSPACE_ID)).toHaveLength(1);
  });

  it('does not leak entries across workspaces', () => {
    service.create({
      workspaceId: 'ws-2',
      experimentId: 'exp-other-ws',
      title: 'Donchian in another workspace',
      summary: 'Should not be visible from ws-1',
    });

    expect(service.search('donchian', WORKSPACE_ID).map((e) => e.experimentId)).not.toContain(
      'exp-other-ws',
    );
    expect(service.list('ws-2')).toHaveLength(1);
  });
});
