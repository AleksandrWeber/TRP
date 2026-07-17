import type { CampaignReport } from '../research-campaign/campaign-report.types';

/**
 * Immutable snapshot of an Experiment at a point in time (US076).
 * Linked to the CampaignSession that produced the report.
 */
export type ExperimentVersion = {
  version: number;
  report: CampaignReport;
  replayId?: string;
  createdAt: string;
  sourceSessionId: string;
};
