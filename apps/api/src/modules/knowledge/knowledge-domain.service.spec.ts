import { beforeEach, describe, expect, it } from 'vitest';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';

describe('KnowledgeDomainService (US075)', () => {
  let service: KnowledgeDomainService;

  beforeEach(() => {
    service = new KnowledgeDomainService(new KnowledgeExtractionService());
  });

  it('creates an entry', () => {
    const entry = service.create({
      experimentId: 'exp-1',
      title: 'Donchian breakout note',
      summary: 'Channel period 10 failed on fee-adjusted accounting',
      tags: ['donchian', 'fail'],
      insights: ['Fees erase edge on short holds'],
      metadata: {
        engineVersion: '1.0.3',
        datasetId: 'ds-1',
        strategyId: 'donchian-breakout',
      },
    });

    expect(entry.knowledgeId.length).toBeGreaterThan(0);
    expect(entry.experimentId).toBe('exp-1');
    expect(entry.createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
    expect(entry.title).toBe('Donchian breakout note');
    expect(entry.summary).toMatch(/Channel period/);
    expect(entry.tags).toEqual(['donchian', 'fail']);
    expect(entry.insights).toEqual(['Fees erase edge on short holds']);
    expect(entry.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      strategyId: 'donchian-breakout',
    });
  });

  it('updates an entry', () => {
    const created = service.create({
      experimentId: 'exp-2',
      title: 'Draft',
      summary: 'Initial',
      tags: ['draft'],
      insights: ['a'],
    });

    const updated = service.update(created.knowledgeId, {
      title: 'Revised',
      summary: 'Updated summary',
      tags: ['revised', 'ema'],
      insights: ['a', 'b'],
      metadata: { source: 'manual' },
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Revised');
    expect(updated?.summary).toBe('Updated summary');
    expect(updated?.tags).toEqual(['revised', 'ema']);
    expect(updated?.insights).toEqual(['a', 'b']);
    expect(updated?.metadata).toEqual({ source: 'manual' });
    expect(updated?.experimentId).toBe('exp-2');
    expect(updated?.knowledgeId).toBe(created.knowledgeId);
  });

  it('returns null when updating missing entry', () => {
    expect(service.update('missing', { title: 'x' })).toBeNull();
  });

  it('gets an entry by id', () => {
    const created = service.create({
      experimentId: 'exp-3',
      title: 'Get me',
      summary: 'Summary',
    });

    expect(service.get(created.knowledgeId)).toBe(created);
    expect(service.get('missing')).toBeNull();
  });

  it('lists entries', () => {
    const a = service.create({ experimentId: 'e1', title: 'A', summary: 'a' });
    const b = service.create({ experimentId: 'e2', title: 'B', summary: 'b' });

    expect(service.list().map((e) => e.knowledgeId)).toEqual([a.knowledgeId, b.knowledgeId]);
  });

  it('clones tags and metadata on create', () => {
    const tags = ['shared'];
    const metadata = { datasetId: 'ds-x', strategyId: 'ema-crossover' };

    const entry = service.create({
      experimentId: 'exp-4',
      title: 'Clone check',
      summary: 's',
      tags,
      metadata,
    });

    tags.push('mutated');
    metadata.datasetId = 'mutated';

    expect(entry.tags).toEqual(['shared']);
    expect(entry.metadata).toEqual({
      datasetId: 'ds-x',
      strategyId: 'ema-crossover',
    });
  });

  it('defaults empty tags, insights, and metadata', () => {
    const entry = service.create({
      experimentId: 'exp-5',
      title: 'Minimal',
      summary: 'Only required fields',
    });

    expect(entry.tags).toEqual([]);
    expect(entry.insights).toEqual([]);
    expect(entry.metadata).toEqual({});
  });
});
