import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSortOrderDto } from '../../validation';
import { InsightType } from './insight-type';
import { InsightController } from './insight.controller';

const WORKSPACE_ID = 'ws-1';

describe('InsightController (US100)', () => {
  let insights: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: InsightController;

  const insight = (id: string, overrides?: Record<string, unknown>) => ({
    id,
    workspaceId: WORKSPACE_ID,
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
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new InsightController(insights as never, workspaces as never);
  });

  it('lists with default pagination and sorting', () => {
    insights.search.mockReturnValue([insight('i1')]);

    const page = controller.list({}, WORKSPACE_ID);

    expect(insights.search).toHaveBeenCalledWith({}, WORKSPACE_ID);
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
      {
        page: 1,
        pageSize: 1,
        sortBy: 'createdAt',
        sortOrder: ApiSortOrderDto.ASC,
        type: InsightType.PATTERN,
        campaignSessionId: 'sess-1',
        experimentId: 'exp-1',
      },
      WORKSPACE_ID,
    );

    expect(insights.search).toHaveBeenCalledWith(
      {
        type: InsightType.PATTERN,
        campaignSessionId: 'sess-1',
        experimentId: 'exp-1',
      },
      WORKSPACE_ID,
    );
    expect(page.items[0]?.id).toBe('i1');
    expect(page.totalPages).toBe(2);
  });

  it('rejects invalid sortBy and type', () => {
    expect(() => controller.list({ sortBy: 'unknown' }, WORKSPACE_ID)).toThrow(BadRequestException);
    expect(() => controller.list({ type: 'NOPE' as InsightType }, WORKSPACE_ID)).toThrow(
      BadRequestException,
    );
    expect(insights.search).not.toHaveBeenCalled();
  });

  it('rejects missing workspace header', () => {
    expect(() => controller.list()).toThrow(BadRequestException);
  });

  it('getById returns insight or 404', () => {
    insights.getById.mockReturnValue(insight('i1'));
    expect(controller.getById({ id: 'i1' }, WORKSPACE_ID).id).toBe('i1');

    insights.getById.mockReturnValue(null);
    expect(() => controller.getById({ id: 'missing' }, WORKSPACE_ID)).toThrow(NotFoundException);
  });
});
