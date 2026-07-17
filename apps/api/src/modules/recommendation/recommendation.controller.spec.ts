import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSortOrderDto } from '../../validation';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';
import { RecommendationController } from './recommendation.controller';

const WORKSPACE_ID = 'ws-1';

describe('RecommendationController (US100)', () => {
  let recommendations: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: RecommendationController;

  const recommendation = (id: string, overrides?: Record<string, unknown>) => ({
    id,
    workspaceId: WORKSPACE_ID,
    insightIds: [],
    campaignSessionIds: [],
    type: RecommendationType.REPEAT_EXPERIMENT,
    priority: RecommendationPriority.HIGH,
    title: `Rec ${id}`,
    description: 'd',
    rationale: 'r',
    metadata: {},
    createdAt: '2026-07-17T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    recommendations = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new RecommendationController(recommendations as never, workspaces as never);
  });

  it('lists with filters and pagination', () => {
    recommendations.search.mockReturnValue([recommendation('r1')]);

    const page = controller.list(
      {
        page: 1,
        pageSize: 10,
        sortBy: 'priority',
        sortOrder: ApiSortOrderDto.DESC,
        type: RecommendationType.REPEAT_EXPERIMENT,
        priority: RecommendationPriority.HIGH,
      },
      WORKSPACE_ID,
    );

    expect(recommendations.search).toHaveBeenCalledWith(
      {
        type: RecommendationType.REPEAT_EXPERIMENT,
        priority: RecommendationPriority.HIGH,
      },
      WORKSPACE_ID,
    );
    expect(page.totalItems).toBe(1);
    expect(page.items[0]?.id).toBe('r1');
  });

  it('rejects invalid priority', () => {
    expect(() =>
      controller.list({ priority: 'ULTRA' as RecommendationPriority }, WORKSPACE_ID),
    ).toThrow(BadRequestException);
  });

  it('rejects missing workspace header', () => {
    expect(() => controller.list()).toThrow(BadRequestException);
  });

  it('getById returns recommendation or 404', () => {
    recommendations.getById.mockReturnValue(recommendation('r1'));
    expect(controller.getById({ id: 'r1' }, WORKSPACE_ID).id).toBe('r1');

    recommendations.getById.mockReturnValue(null);
    expect(() => controller.getById({ id: 'missing' }, WORKSPACE_ID)).toThrow(NotFoundException);
  });
});
