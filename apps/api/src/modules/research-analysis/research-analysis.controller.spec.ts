import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchAnalysisController } from './research-analysis.controller';

describe('ResearchAnalysisController (POST /campaigns/analyze)', () => {
  let analysis: { analyzeCampaignSummary: ReturnType<typeof vi.fn> };
  let controller: ResearchAnalysisController;

  beforeEach(() => {
    analysis = {
      analyzeCampaignSummary: vi.fn(),
    };
    controller = new ResearchAnalysisController(analysis as never);
  });

  it('calls ResearchAnalysisService and returns ResearchAnalysis', () => {
    const campaignSummary = {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 2,
      passCount: 0,
      failCount: 2,
      needsReviewCount: 0,
      bestExperimentId: 'exp-2',
      createdAt: '2026-07-16T12:00:00.000Z',
      failedRuns: [],
    };
    const researchAnalysis = {
      executiveSummary: 'Campaign camp-1 FAIL',
      strengths: [],
      weaknesses: ['No configuration fully passed validation.'],
      recommendations: ['Do not promote this strategy class from the current campaign.'],
      nextHypothesis: 'Replace or filter donchian-breakout on dataset ds-1.',
    };

    analysis.analyzeCampaignSummary.mockReturnValue(researchAnalysis);

    const result = controller.analyze({ campaignSummary });

    expect(analysis.analyzeCampaignSummary).toHaveBeenCalledWith(campaignSummary);
    expect(analysis.analyzeCampaignSummary).toHaveBeenCalledTimes(1);
    expect(result).toEqual(researchAnalysis);
    expect(result).toBe(researchAnalysis);
  });

  it('rejects missing campaignSummary', () => {
    expect(() => controller.analyze({})).toThrow(BadRequestException);
    expect(analysis.analyzeCampaignSummary).not.toHaveBeenCalled();
  });
});
