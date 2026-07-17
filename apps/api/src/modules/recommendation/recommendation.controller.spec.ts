import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';
import { RecommendationController } from './recommendation.controller';

describe('RecommendationController (US100)', () => {
  let recommendations: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let controller: RecommendationController;

  const recommendation = (id: string, overrides?: Record<string, unknown>) => ({
    id,
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
    controller = new RecommendationController(recommendations as never);
  });

  it('lists with filters and pagination', () => {
    recommendations.search.mockReturnValue([recommendation('r1')]);

    const page = controller.list(
      '1',
      '10',
      'priority',
      'DESC',
      RecommendationType.REPEAT_EXPERIMENT,
      RecommendationPriority.HIGH,
    );

    expect(recommendations.search).toHaveBeenCalledWith({
      type: RecommendationType.REPEAT_EXPERIMENT,
      priority: RecommendationPriority.HIGH,
    });
    expect(page.totalItems).toBe(1);
    expect(page.items[0]?.id).toBe('r1');
  });

  it('rejects invalid priority', () => {
    expect(() =>
      controller.list(undefined, undefined, undefined, undefined, undefined, 'ULTRA'),
    ).toThrow(BadRequestException);
  });

  it('getById returns recommendation or 404', () => {
    recommendations.getById.mockReturnValue(recommendation('r1'));
    expect(controller.getById('r1').id).toBe('r1');

    recommendations.getById.mockReturnValue(null);
    expect(() => controller.getById('missing')).toThrow(NotFoundException);
  });
});
