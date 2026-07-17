import type { CampaignSessionStatus } from '../campaign-session/campaign-session-status';

/**
 * Optional filters for Campaign History search.
 * Multiple fields combine with AND logic.
 */
export type HistoryQuery = {
  status?: CampaignSessionStatus;
  engineVersion?: string;
  datasetId?: string;
  tags?: string[];
};
