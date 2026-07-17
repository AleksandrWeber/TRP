import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { ReplayCampaignConfig } from './replay-campaign-config';
import type { ReplayStatus } from './replay-status';

/**
 * Result of preparing or executing a Campaign Replay (US066–US067).
 */
export type ReplayResult = {
  replayId: string;
  sourceSessionId: string;
  startedAt: string;
  completedAt?: string;
  status: ReplayStatus;
  campaignConfig: ReplayCampaignConfig;
  report: CampaignReport;
};
