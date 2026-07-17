import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSortOrderDto } from '../../validation';
import { CrossCampaignAnalysisController } from './cross-campaign-analysis.controller';

const WORKSPACE_ID = 'ws-1';

describe('CrossCampaignAnalysisController (US100)', () => {
  let analyses: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: CrossCampaignAnalysisController;

  const analysis = (id: string, overrides?: Record<string, unknown>) => ({
    id,
    workspaceId: WORKSPACE_ID,
    comparedCampaignIds: ['sess-1', 'sess-2'],
    findings: [],
    statistics: {
      campaignCount: 2,
      experimentCount: 0,
      knowledgeEntryCount: 0,
      insightCount: 0,
      findingCount: 0,
    },
    generatedInsightIds: [],
    createdAt: '2026-07-17T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    analyses = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new CrossCampaignAnalysisController(analyses as never, workspaces as never);
  });

  it('lists with campaignSessionId filter', () => {
    analyses.search.mockReturnValue([analysis('a1')]);

    const page = controller.list(
      {
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: ApiSortOrderDto.DESC,
        campaignSessionId: 'sess-1',
      },
      WORKSPACE_ID,
    );

    expect(analyses.search).toHaveBeenCalledWith({ campaignSessionId: 'sess-1' }, WORKSPACE_ID);
    expect(page.items[0]?.id).toBe('a1');
  });

  it('rejects invalid pageSize', () => {
    expect(() => controller.list({ page: 1, pageSize: 0 }, WORKSPACE_ID)).toThrow(
      BadRequestException,
    );
  });

  it('rejects missing workspace header', () => {
    expect(() => controller.list()).toThrow(BadRequestException);
  });

  it('getById returns analysis or 404', () => {
    analyses.getById.mockReturnValue(analysis('a1'));
    expect(controller.getById({ id: 'a1' }, WORKSPACE_ID).id).toBe('a1');

    analyses.getById.mockReturnValue(null);
    expect(() => controller.getById({ id: 'missing' }, WORKSPACE_ID)).toThrow(NotFoundException);
  });
});
