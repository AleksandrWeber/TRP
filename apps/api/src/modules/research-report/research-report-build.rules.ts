import type { CampaignSession } from '../campaign-session/campaign-session';
import type { Insight } from '../insight/insight';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import type { Recommendation } from '../recommendation/recommendation';
import type { ReportMetadata } from './report-metadata';
import type { ReportSection } from './report-section';
import { ReportSectionType } from './report-section-type';

export type ResearchReportBuildInput = {
  sessions?: CampaignSession[];
  knowledgeEntries?: KnowledgeEntry[];
  insights?: Insight[];
  recommendations?: Recommendation[];
};

export type ResearchReportDraft = {
  campaignSessionIds: string[];
  knowledgeEntryIds: string[];
  insightIds: string[];
  recommendationIds: string[];
  sections: ReportSection[];
  metadata: ReportMetadata;
};

/**
 * Deterministic ResearchReport draft from entity aggregates (US099).
 * Structured data only — no narrative / formatting / export.
 */
export function buildResearchReportDraft(input: ResearchReportBuildInput): ResearchReportDraft {
  const campaignSessionIds = uniqueIds((input.sessions ?? []).map((s) => s.id));
  const knowledgeEntryIds = uniqueIds((input.knowledgeEntries ?? []).map((k) => k.knowledgeId));
  const insightIds = uniqueIds((input.insights ?? []).map((i) => i.id));
  const recommendationIds = uniqueIds((input.recommendations ?? []).map((r) => r.id));

  const sections: ReportSection[] = [
    {
      type: ReportSectionType.EXECUTIVE_SUMMARY,
      itemIds: [...campaignSessionIds, ...knowledgeEntryIds, ...insightIds, ...recommendationIds],
    },
    {
      type: ReportSectionType.FINDINGS,
      itemIds: [...knowledgeEntryIds],
    },
    {
      type: ReportSectionType.INSIGHTS,
      itemIds: [...insightIds],
    },
    {
      type: ReportSectionType.RECOMMENDATIONS,
      itemIds: [...recommendationIds],
    },
    {
      type: ReportSectionType.REFERENCES,
      itemIds: uniqueIds([
        ...campaignSessionIds,
        ...knowledgeEntryIds,
        ...insightIds,
        ...recommendationIds,
      ]),
    },
  ];

  return {
    campaignSessionIds,
    knowledgeEntryIds,
    insightIds,
    recommendationIds,
    sections,
    metadata: {
      campaignCount: campaignSessionIds.length,
      knowledgeEntryCount: knowledgeEntryIds.length,
      insightCount: insightIds.length,
      recommendationCount: recommendationIds.length,
      generatedBy: 'research-report-deterministic',
    },
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
