import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSessionMetadata } from './campaign-session-metadata';
import type { CampaignSessionStatus } from './campaign-session-status';

/**
 * CampaignSession — execution entity that owns report + session metadata.
 * Independent from Persistence and Campaign runners (US053).
 */
export type CampaignSession = {
  id: string;
  status: CampaignSessionStatus;
  createdAt: string;
  completedAt?: string;
  report: CampaignReport;
  metadata: CampaignSessionMetadata;
};
