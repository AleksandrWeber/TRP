import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSessionMetadata } from '../campaign-session/campaign-session-metadata';
import type { CampaignSessionStatus } from '../campaign-session/campaign-session-status';

/**
 * Storage model for a persisted CampaignSession.
 * Independent from CampaignSession / CampaignReport domain types at the API boundary.
 */
export type CampaignRecord = {
  id: string;
  sessionId: string;
  workspaceId: string;
  status: CampaignSessionStatus;
  createdAt: string;
  completedAt: string | null;
  metadata: CampaignSessionMetadata;
  report: CampaignReport;
};
