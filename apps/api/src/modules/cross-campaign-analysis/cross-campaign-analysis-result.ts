import type { CrossCampaignFinding } from './cross-campaign-finding';

/**
 * Result of cross-campaign analysis (US097).
 * `id` / `createdAt` support stored lookup for Research Intelligence API (US100).
 */
export type CrossCampaignAnalysisStatistics = {
  campaignCount: number;
  experimentCount: number;
  knowledgeEntryCount: number;
  insightCount: number;
  findingCount: number;
};

/** Pipeline payload before in-memory store assignment. */
export type CrossCampaignAnalysisResultPayload = {
  comparedCampaignIds: string[];
  findings: CrossCampaignFinding[];
  statistics: CrossCampaignAnalysisStatistics;
  generatedInsightIds: string[];
};

export type CrossCampaignAnalysisResult = CrossCampaignAnalysisResultPayload & {
  id: string;
  workspaceId: string;
  createdAt: string;
};
