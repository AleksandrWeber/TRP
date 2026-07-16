import type { StrategyParams } from '@trp/research';
import type { CampaignSummary } from './research-campaign.types';

export type MultiDatasetCampaignInput = {
  strategyId: string;
  datasets: string[];
  paramsList: StrategyParams[];
};

export type MultiDatasetCampaignFailedDataset = {
  datasetId: string;
  error: string;
};

export type MultiDatasetCampaignSummary = {
  totalDatasets: number;
  completedDatasets: number;
  failedDatasets: number;
  campaignSummaries: CampaignSummary[];
  overallBestExperimentId: string | null;
  overallBestProfitFactor: number | null;
  failedDatasetErrors: MultiDatasetCampaignFailedDataset[];
};
