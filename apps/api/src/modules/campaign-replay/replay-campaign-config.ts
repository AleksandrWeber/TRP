import type { StrategyParams } from '@trp/research';

/**
 * Campaign configuration restored from a source CampaignSession for replay (US066–US067).
 * `paramsList` comes from optional session metadata when present (needed for execution).
 */
export type ReplayCampaignConfig = {
  campaignId: string;
  strategyId: string;
  datasetId: string;
  engineVersion: string;
  paramsList: StrategyParams[];
  sliceIdentity?: string;
  tags?: string[];
};
