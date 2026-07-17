import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeController } from './knowledge.controller';

describe('KnowledgeController (US079)', () => {
  let domain: {
    find: ReturnType<typeof vi.fn>;
  };
  let knowledgeService: Record<string, ReturnType<typeof vi.fn>>;
  let controller: KnowledgeController;

  const entries = [
    {
      knowledgeId: 'k-1',
      experimentId: 'exp-1',
      createdAt: '2026-07-17T12:00:00.000Z',
      title: 'Donchian note',
      summary: 'Failed on fees',
      tags: ['donchian'],
      insights: ['Fees erase edge'],
      metadata: {},
    },
  ];

  beforeEach(() => {
    domain = { find: vi.fn() };
    knowledgeService = {
      get: vi.fn(),
      create: vi.fn(),
      backfillFromExperiments: vi.fn(),
    };
    controller = new KnowledgeController(knowledgeService as never, domain as never);
  });

  it('lists all knowledge entries', () => {
    domain.find.mockReturnValue(entries);

    expect(controller.list()).toEqual(entries);
    expect(domain.find).toHaveBeenCalledWith({
      q: undefined,
      tag: undefined,
      experimentId: undefined,
    });
  });

  it('forwards q / tag / experimentId query params', () => {
    domain.find.mockReturnValue(entries);

    controller.list('fee', 'donchian', 'exp-1');

    expect(domain.find).toHaveBeenCalledWith({
      q: 'fee',
      tag: 'donchian',
      experimentId: 'exp-1',
    });
  });

  it('returns empty array when nothing matches', () => {
    domain.find.mockReturnValue([]);

    expect(controller.list('missing')).toEqual([]);
  });
});
