import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightType } from './insight-type';
import { InsightController } from './insight.controller';

describe('InsightController (US100)', () => {
  let insights: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let controller: InsightController;

  const insight = (id: string, overrides?: Record<string, unknown>) => ({
    id,
    type: InsightType.PATTERN,
    title: `Insight ${id}`,
    summary: 's',
    confidence: 0.8,
    knowledgeEntryIds: [],
    sources: [],
    metadata: {},
    createdAt: '2026-07-17T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    insights = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    controller = new InsightController(insights as never);
  });

  it('lists with default pagination and sorting', () => {
    insights.search.mockReturnValue([insight('i1')]);

    const page = controller.list();

    expect(insights.search).toHaveBeenCalledWith({});
    expect(page.currentPage).toBe(1);
    expect(page.pageSize).toBe(20);
    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
  });

  it('passes filters and pagination params', () => {
    insights.search.mockReturnValue([
      insight('i2', { createdAt: '2026-07-17T11:00:00.000Z' }),
      insight('i1', { createdAt: '2026-07-17T10:00:00.000Z' }),
    ]);

    const page = controller.list(
      '1',
      '1',
      'createdAt',
      'ASC',
      InsightType.PATTERN,
      'sess-1',
      'exp-1',
    );

    expect(insights.search).toHaveBeenCalledWith({
      type: InsightType.PATTERN,
      campaignSessionId: 'sess-1',
      experimentId: 'exp-1',
    });
    expect(page.items[0]?.id).toBe('i1');
    expect(page.totalPages).toBe(2);
  });

  it('rejects invalid sortBy and type', () => {
    expect(() => controller.list(undefined, undefined, 'unknown')).toThrow(BadRequestException);
    expect(() => controller.list(undefined, undefined, undefined, undefined, 'NOPE')).toThrow(
      BadRequestException,
    );
    expect(insights.search).not.toHaveBeenCalled();
  });

  it('getById returns insight or 404', () => {
    insights.getById.mockReturnValue(insight('i1'));
    expect(controller.getById('i1').id).toBe('i1');

    insights.getById.mockReturnValue(null);
    expect(() => controller.getById('missing')).toThrow(NotFoundException);
  });
});
