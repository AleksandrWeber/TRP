import type { StrategyParams } from '@trp/research';

export type ResearchCampaignInput = {
  datasetId: string;
  strategyId: string;
  paramsList: StrategyParams[];
};

export type CampaignFailedRun = {
  params: StrategyParams;
  error: string;
};

export type CampaignSummary = {
  campaignId: string;
  strategyId: string;
  datasetId: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  bestExperimentId: string | null;
  createdAt: string;
  failedRuns: CampaignFailedRun[];
};
