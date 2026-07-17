import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { ReplayCampaignConfig } from './replay-campaign-config';

/**
 * Prepared replay context — no execution, AI, or network (US066).
 */
export type ReplayContext = {
  sourceSession: CampaignSession;
  campaignConfig: ReplayCampaignConfig;
  report: CampaignReport;
};
