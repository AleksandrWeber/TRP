import type { ReportMetadata } from './report-metadata';
import type { ReportSection } from './report-section';

/**
 * Research OS Report domain entity (US099).
 * Aggregation layer over Campaign / Knowledge / Insight / Recommendation — ids only.
 * In-memory domain; no Prisma / Repository / Export / Pipeline.
 */
export type ResearchReport = {
  id: string;
  workspaceId: string;
  campaignSessionIds: string[];
  knowledgeEntryIds: string[];
  insightIds: string[];
  recommendationIds: string[];
  sections: ReportSection[];
  metadata: ReportMetadata;
  createdAt: string;
};
