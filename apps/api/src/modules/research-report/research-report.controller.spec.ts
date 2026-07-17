import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchReportController } from './research-report.controller';

describe('ResearchReportController (US100)', () => {
  let reports: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let controller: ResearchReportController;

  const report = (id: string, overrides?: Record<string, unknown>) => ({
    id,
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
    controller = new ResearchReportController(reports as never);
  });

  it('lists with campaignSessionId filter', () => {
    reports.search.mockReturnValue([report('rep-1')]);

    const page = controller.list('1', '20', 'createdAt', 'DESC', 'sess-1');

    expect(reports.search).toHaveBeenCalledWith({ campaignSessionId: 'sess-1' });
    expect(page.items[0]?.id).toBe('rep-1');
  });

  it('rejects invalid sortBy', () => {
    expect(() => controller.list(undefined, undefined, 'title')).toThrow(BadRequestException);
  });

  it('getById returns report or 404', () => {
    reports.getById.mockReturnValue(report('rep-1'));
    expect(controller.getById('rep-1').id).toBe('rep-1');

    reports.getById.mockReturnValue(null);
    expect(() => controller.getById('missing')).toThrow(NotFoundException);
  });
});
