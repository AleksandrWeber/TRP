export type CampaignReportVerdict = 'PASS' | 'NEEDS_REVIEW' | 'FAIL';

export type CampaignReportExperiment = {
  id: string;
  verdict: string;
  metrics?: {
    profitFactor?: number;
    totalReturnPercent?: number;
    expectancy?: number;
    maxDrawdownPercent?: number;
  } | null;
  report?: {
    params?: Record<string, unknown>;
  } | null;
};

export type CampaignReport = {
  campaignId: string;
  strategyId: string;
  datasetId: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  bestExperimentId: string | null;
  bestProfitFactor: number | null;
  bestReturn: number | null;
  bestExpectancy: number | null;
  lowestDrawdown: number | null;
  verdict: CampaignReportVerdict;
  recommendations: string[];
  createdAt: string;
};
