import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeController } from './knowledge.controller';

const WORKSPACE_ID = 'ws-1';

describe('KnowledgeController (US079)', () => {
  let domain: {
    find: ReturnType<typeof vi.fn>;
  };
  let knowledgeService: Record<string, ReturnType<typeof vi.fn>>;
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: KnowledgeController;

  const entries = [
    {
      knowledgeId: 'k-1',
      workspaceId: WORKSPACE_ID,
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
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new KnowledgeController(
      knowledgeService as never,
      domain as never,
      workspaces as never,
    );
  });

  it('lists all knowledge entries', () => {
    domain.find.mockReturnValue(entries);

    expect(controller.list({}, WORKSPACE_ID)).toEqual(entries);
    expect(domain.find).toHaveBeenCalledWith({}, WORKSPACE_ID);
  });

  it('forwards q / tag / experimentId query params', () => {
    domain.find.mockReturnValue(entries);

    controller.list({ q: 'fee', tag: 'donchian', experimentId: 'exp-1' }, WORKSPACE_ID);

    expect(domain.find).toHaveBeenCalledWith(
      {
        q: 'fee',
        tag: 'donchian',
        experimentId: 'exp-1',
      },
      WORKSPACE_ID,
    );
  });

  it('returns empty array when nothing matches', () => {
    domain.find.mockReturnValue([]);

    expect(controller.list({ q: 'missing' }, WORKSPACE_ID)).toEqual([]);
  });

  it('throws BadRequestException when workspace header is missing', () => {
    expect(() => controller.list({}, undefined)).toThrow();
  });

  it('throws NotFoundException when workspace does not exist', () => {
    workspaces.getById.mockReturnValue(null);
    expect(() => controller.list({}, 'missing-ws')).toThrow();
  });
});
