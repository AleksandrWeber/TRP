import type { StrategyParams } from '@trp/research';
import type { CampaignSummary } from './research-campaign.types';
import type { WalkForwardWindow } from './walk-forward-window-builder';
import type { WalkForwardOverallVerdict } from './walk-forward-aggregate';

export type WalkForwardCampaignRequest = {
  datasetId: string;
  strategyId: string;
  paramsList: StrategyParams[];
  windowSize: number;
  stepSize: number;
  /** Bar count for window building and SliceRef bounds (ADR-011). */
  datasetLength: number;
};

export type WalkForwardWindowMetricsView = {
  profitFactor: number | null;
  totalReturnPercent: number | null;
  maxDrawdownPercent: number | null;
  expectancy: number | null;
};

export type WalkForwardWindowResult = WalkForwardWindow & {
  summary: CampaignSummary | null;
  error: string | null;
  trainSliceIdentity: string | null;
  testSliceIdentity: string | null;
  trainBestExperimentId: string | null;
  testExperimentId: string | null;
  trainMetrics: WalkForwardWindowMetricsView | null;
  testMetrics: WalkForwardWindowMetricsView | null;
  trainVerdict: string | null;
  testVerdict: string | null;
};

/**
 * Walk-Forward summary: per-window campaigns + aggregate report.
 */
export type WalkForwardCampaignSummary = {
  datasetId: string;
  strategyId: string;
  windowSize: number;
  stepSize: number;
  paramsCount: number;
  windowCount: number;
  successfulWindows: number;
  failedWindows: number;
  windows: WalkForwardWindowResult[];
  averageProfitFactor: number | null;
  averageReturnPercent: number | null;
  averageMaxDrawdownPercent: number | null;
  averageExpectancy: number | null;
  bestWindowIndex: number | null;
  worstWindowIndex: number | null;
  passCount: number | null;
  needsReviewCount: number | null;
  failCount: number | null;
  testPassCount: number | null;
  testNeedsReviewCount: number | null;
  testFailCount: number | null;
  averageTestReturnPercent: number | null;
  averageTestProfitFactor: number | null;
  averageTestMaxDrawdownPercent: number | null;
  overallVerdict: WalkForwardOverallVerdict;
};
