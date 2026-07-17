import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrossCampaignAnalysisController } from './cross-campaign-analysis.controller';

describe('CrossCampaignAnalysisController (US100)', () => {
  let analyses: {
    search: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let controller: CrossCampaignAnalysisController;

  const analysis = (id: string, overrides?: Record<string, unknown>) => ({
    id,
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
    controller = new CrossCampaignAnalysisController(analyses as never);
  });

  it('lists with campaignSessionId filter', () => {
    analyses.search.mockReturnValue([analysis('a1')]);

    const page = controller.list('1', '20', 'createdAt', 'DESC', 'sess-1');

    expect(analyses.search).toHaveBeenCalledWith({ campaignSessionId: 'sess-1' });
    expect(page.items[0]?.id).toBe('a1');
  });

  it('rejects invalid pageSize', () => {
    expect(() => controller.list('1', '0')).toThrow(BadRequestException);
  });

  it('getById returns analysis or 404', () => {
    analyses.getById.mockReturnValue(analysis('a1'));
    expect(controller.getById('a1').id).toBe('a1');

    analyses.getById.mockReturnValue(null);
    expect(() => controller.getById('missing')).toThrow(NotFoundException);
  });
});
