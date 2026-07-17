import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSortOrderDto } from '../../validation';
import { ResearchReportController } from './research-report.controller';

const WORKSPACE_ID = 'ws-1';

describe('ResearchReportController (US100)', () => {
  let reports: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: ResearchReportController;

  const report = (id: string, overrides?: Record<string, unknown>) => ({
    id,
    workspaceId: WORKSPACE_ID,
    campaignSessionIds: ['sess-1'],
    knowledgeEntryIds: [],
    insightIds: [],
    recommendationIds: [],
    sections: [],
    metadata: {},
    createdAt: '2026-07-17T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    reports = {
      search: vi.fn(),
      getById: vi.fn(),
    };
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new ResearchReportController(reports as never, workspaces as never);
  });

  it('lists with campaignSessionId filter', () => {
    reports.search.mockReturnValue([report('rep-1')]);

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

    expect(reports.search).toHaveBeenCalledWith({ campaignSessionId: 'sess-1' }, WORKSPACE_ID);
    expect(page.items[0]?.id).toBe('rep-1');
  });

  it('rejects invalid sortBy', () => {
    expect(() => controller.list({ sortBy: 'title' }, WORKSPACE_ID)).toThrow(BadRequestException);
  });

  it('rejects missing workspace header', () => {
    expect(() => controller.list()).toThrow(BadRequestException);
  });

  it('getById returns report or 404', () => {
    reports.getById.mockReturnValue(report('rep-1'));
    expect(controller.getById({ id: 'rep-1' }, WORKSPACE_ID).id).toBe('rep-1');

    reports.getById.mockReturnValue(null);
    expect(() => controller.getById({ id: 'missing' }, WORKSPACE_ID)).toThrow(NotFoundException);
  });
});
