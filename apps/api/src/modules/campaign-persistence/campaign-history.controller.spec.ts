import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignHistoryController } from './campaign-history.controller';

describe('CampaignHistoryController', () => {
  let history: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let controller: CampaignHistoryController;

  const session = (id: string) => ({
    id,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T11:00:00.000Z',
    completedAt: '2026-07-17T12:00:00.000Z',
    metadata: { engineVersion: '1.0.3', datasetId: 'ds-1', tags: ['wf'] },
    report: {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 1,
      passCount: 1,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 1.2,
      bestReturn: 3,
      bestExpectancy: 1,
      lowestDrawdown: 8,
      verdict: 'PASS' as const,
      recommendations: ['ok'],
      createdAt: '2026-07-17T10:00:00.000Z',
    },
  });

  beforeEach(() => {
    history = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    controller = new CampaignHistoryController(history as never);
  });

  describe('GET /campaign-history', () => {
    it('returns HistoryPage from CampaignHistoryService.search', () => {
      const page = {
        items: [session('s1')],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 20,
      };
      history.search.mockReturnValue(page);

      const result = controller.list();

      expect(history.search).toHaveBeenCalledWith(
        {},
        {
          page: 1,
          pageSize: 20,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        },
      );
      expect(result).toBe(page);
    });

    it('passes pagination, sorting, and filtering query params', () => {
      history.search.mockReturnValue({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 2,
        pageSize: 5,
      });

      controller.list('2', '5', 'status', 'ASC', 'FAILED', '1.0.3', 'ds-2', 'wf,smoke');

      expect(history.search).toHaveBeenCalledWith(
        {
          status: CampaignSessionStatus.FAILED,
          engineVersion: '1.0.3',
          datasetId: 'ds-2',
          tags: ['wf', 'smoke'],
        },
        {
          page: 2,
          pageSize: 5,
          sortBy: 'status',
          sortDirection: 'ASC',
        },
      );
    });

    it('returns empty history page', () => {
      const empty = {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
      };
      history.search.mockReturnValue(empty);

      expect(controller.list()).toEqual(empty);
    });

    it('rejects invalid page', () => {
      expect(() => controller.list('0')).toThrow(BadRequestException);
      expect(history.search).not.toHaveBeenCalled();
    });

    it('rejects invalid sortBy', () => {
      expect(() => controller.list(undefined, undefined, 'profitFactor')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('GET /campaign-history/:sessionId', () => {
    it('returns CampaignSession by id', () => {
      const found = session('s1');
      history.getById.mockReturnValue(found);

      expect(controller.getById('s1')).toBe(found);
      expect(history.getById).toHaveBeenCalledWith('s1');
    });

    it('returns 404 when session is missing', () => {
      history.getById.mockReturnValue(null);

      expect(() => controller.getById('missing')).toThrow(NotFoundException);
    });
  });
});
