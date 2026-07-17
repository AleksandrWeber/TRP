import { beforeEach, describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { Insight } from '../insight/insight';
import { InsightSource } from '../insight/insight-source';
import { InsightType } from '../insight/insight-type';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import type { Recommendation } from '../recommendation/recommendation';
import { RecommendationPriority } from '../recommendation/recommendation-priority';
import { RecommendationType } from '../recommendation/recommendation-type';
import { ReportSectionType } from './report-section-type';
import { ResearchReportDomainService } from './research-report-domain.service';

describe('ResearchReportDomainService (US099)', () => {
  let service: ResearchReportDomainService;

  beforeEach(() => {
    service = new ResearchReportDomainService();
  });

  it('creates a report with references only', () => {
    const report = service.create({
      campaignSessionIds: ['sess-1'],
      knowledgeEntryIds: ['k-1'],
      insightIds: ['i-1'],
      recommendationIds: ['r-1'],
      sections: [
        { type: ReportSectionType.FINDINGS, itemIds: ['k-1'] },
        { type: ReportSectionType.INSIGHTS, itemIds: ['i-1'] },
      ],
      metadata: {
        campaignCount: 1,
        generatedBy: 'manual',
      },
    });

    expect(report.id.length).toBeGreaterThan(0);
    expect(report.campaignSessionIds).toEqual(['sess-1']);
    expect(report.knowledgeEntryIds).toEqual(['k-1']);
    expect(report.insightIds).toEqual(['i-1']);
    expect(report.recommendationIds).toEqual(['r-1']);
    expect(report.sections).toEqual([
      { type: ReportSectionType.FINDINGS, itemIds: ['k-1'] },
      { type: ReportSectionType.INSIGHTS, itemIds: ['i-1'] },
    ]);
    expect(report.metadata).toEqual({ campaignCount: 1, generatedBy: 'manual' });
    expect(Number.isNaN(Date.parse(report.createdAt))).toBe(false);
  });

  it('clones ids and sections on create', () => {
    const campaignSessionIds = ['sess-1'];
    const sections = [{ type: ReportSectionType.FINDINGS, itemIds: ['k-1'] }];

    const report = service.create({ campaignSessionIds, sections });

    campaignSessionIds.push('mutated');
    sections[0]!.itemIds.push('mutated');
    sections.push({ type: ReportSectionType.INSIGHTS, itemIds: ['i-x'] });

    expect(report.campaignSessionIds).toEqual(['sess-1']);
    expect(report.sections).toEqual([{ type: ReportSectionType.FINDINGS, itemIds: ['k-1'] }]);
  });

  it('getById returns stored report or null', () => {
    const created = service.create({ insightIds: ['i-1'] });
    expect(service.getById(created.id)?.insightIds).toEqual(['i-1']);
    expect(service.getById('missing')).toBeNull();
  });

  it('searches with AND filters', () => {
    service.create({
      campaignSessionIds: ['sess-a'],
      knowledgeEntryIds: ['k-a'],
      insightIds: ['i-a'],
      recommendationIds: ['r-a'],
    });
    service.create({
      campaignSessionIds: ['sess-b'],
      knowledgeEntryIds: ['k-b'],
      insightIds: ['i-b'],
      recommendationIds: ['r-b'],
    });

    expect(service.search({ campaignSessionId: 'sess-a' })).toHaveLength(1);
    expect(service.search({ knowledgeEntryId: 'k-b' })).toHaveLength(1);
    expect(service.search({ insightId: 'i-a' })).toHaveLength(1);
    expect(service.search({ recommendationId: 'r-b' })).toHaveLength(1);
    expect(
      service.search({
        campaignSessionId: 'sess-a',
        insightId: 'i-b',
      }),
    ).toHaveLength(0);
  });

  it('build aggregates entities into a stored structured report', () => {
    const sessions: CampaignSession[] = [
      {
        id: 'sess-1',
        status: CampaignSessionStatus.COMPLETED,
        createdAt: '2026-07-17T10:00:00.000Z',
        metadata: { datasetId: 'ds-1' },
        report: {
          campaignId: 'sess-1',
          strategyId: 's',
          datasetId: 'ds-1',
          totalRuns: 1,
          passCount: 0,
          failCount: 1,
          needsReviewCount: 0,
          bestExperimentId: 'exp-1',
          bestProfitFactor: 1,
          bestReturn: 0,
          bestExpectancy: 0,
          lowestDrawdown: 0,
          verdict: 'FAIL',
          recommendations: [],
          createdAt: '2026-07-17T10:00:00.000Z',
        },
      },
    ];
    const knowledgeEntries: KnowledgeEntry[] = [
      {
        knowledgeId: 'k-1',
        experimentId: 'exp-1',
        createdAt: '2026-07-17T10:00:00.000Z',
        title: 'Finding title must not leak',
        summary: 's',
        tags: [],
        insights: [],
        metadata: { strategyId: 's', datasetId: 'ds-1' },
      },
    ];
    const insights: Insight[] = [
      {
        id: 'i-1',
        knowledgeEntryIds: ['k-1'],
        type: InsightType.TREND,
        title: 'Trend',
        summary: 's',
        confidence: 0.7,
        sources: [InsightSource.Knowledge],
        metadata: {},
        createdAt: '2026-07-17T10:00:00.000Z',
      },
    ];
    const recommendations: Recommendation[] = [
      {
        id: 'r-1',
        insightIds: ['i-1'],
        campaignSessionIds: ['sess-1'],
        type: RecommendationType.EXPAND_SCOPE,
        priority: RecommendationPriority.MEDIUM,
        title: 'Expand',
        description: 'd',
        rationale: 'r',
        metadata: {},
        createdAt: '2026-07-17T10:00:00.000Z',
      },
    ];

    const report = service.build({
      sessions,
      knowledgeEntries,
      insights,
      recommendations,
    });

    expect(report.campaignSessionIds).toEqual(['sess-1']);
    expect(report.knowledgeEntryIds).toEqual(['k-1']);
    expect(report.insightIds).toEqual(['i-1']);
    expect(report.recommendationIds).toEqual(['r-1']);
    expect(report.sections.map((s) => s.type)).toEqual([
      ReportSectionType.EXECUTIVE_SUMMARY,
      ReportSectionType.FINDINGS,
      ReportSectionType.INSIGHTS,
      ReportSectionType.RECOMMENDATIONS,
      ReportSectionType.REFERENCES,
    ]);
    expect(service.getById(report.id)).toEqual(report);
    expect(JSON.stringify(report)).not.toContain('Finding title must not leak');
  });
});
