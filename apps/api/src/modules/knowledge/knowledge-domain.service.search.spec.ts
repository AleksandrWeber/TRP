import { beforeEach, describe, expect, it } from 'vitest';
import { createKnowledgeDomainService } from './knowledge-domain.test-utils';
import { KnowledgeDomainService } from './knowledge-domain.service';

describe('KnowledgeDomainService search (US079)', () => {
  let service: KnowledgeDomainService;

  beforeEach(() => {
    ({ service } = createKnowledgeDomainService());

    service.create({
      experimentId: 'exp-donchian',
      title: 'Donchian breakout note',
      summary: 'Channel period failed on fee-adjusted accounting',
      tags: ['donchian', 'fail'],
      insights: ['Fees erase edge on short holds'],
      metadata: { strategyId: 'donchian-breakout', datasetId: 'ds-1' },
    });

    service.create({
      experimentId: 'exp-ema',
      title: 'EMA crossover review',
      summary: 'Fast/slow EMA stayed below pass threshold',
      tags: ['ema', 'needs_review'],
      insights: ['Widen spread before retest'],
      metadata: { strategyId: 'ema-crossover', datasetId: 'ds-2' },
    });
  });

  it('lists all entries', () => {
    expect(service.find()).toHaveLength(2);
    expect(service.list()).toHaveLength(2);
  });

  it('searches by title', () => {
    const results = service.search('donchian breakout');
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');
  });

  it('searches by summary', () => {
    const results = service.search('pass threshold');
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-ema');
  });

  it('searches by insight', () => {
    const results = service.search('fees erase');
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');
  });

  it('searches by tag', () => {
    expect(service.searchByTag('ema').map((e) => e.experimentId)).toEqual(['exp-ema']);
    expect(service.searchByTag('FAIL').map((e) => e.experimentId)).toEqual(['exp-donchian']);
  });

  it('searches by experimentId', () => {
    expect(service.searchByExperiment('exp-ema')).toHaveLength(1);
    expect(service.searchByExperiment('missing')).toEqual([]);
  });

  it('applies combined filters with AND semantics', () => {
    const results = service.find({
      q: 'fee',
      tag: 'donchian',
      experimentId: 'exp-donchian',
    });
    expect(results).toHaveLength(1);
    expect(results[0].experimentId).toBe('exp-donchian');

    expect(
      service.find({
        q: 'fee',
        tag: 'ema',
      }),
    ).toEqual([]);
  });

  it('returns empty array when nothing matches', () => {
    expect(service.search('nonexistent-token')).toEqual([]);
    expect(service.find({ tag: 'missing-tag' })).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(service.search('DONCHIAN')).toHaveLength(1);
    expect(service.search('Fee-Adjusted')).toHaveLength(1);
    expect(service.searchByTag('Needs_Review')).toHaveLength(1);
  });
});
