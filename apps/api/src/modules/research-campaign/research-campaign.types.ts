import type { SliceRef, StrategyParams } from '@trp/research';

export type ResearchCampaignInput = {
  datasetId: string;
  strategyId: string;
  paramsList: StrategyParams[];
  /** Optional Dataset Slice scope for all experiments in this campaign (ADR-011 / US047). */
  sliceRef?: SliceRef;
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
