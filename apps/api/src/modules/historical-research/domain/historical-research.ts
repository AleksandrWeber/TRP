import type { Candle } from '../../market-data-domain';
import type { ExecutedTrade, SignalStats } from '../../paper-trading-executor';
import type { Strategy } from '../../strategies';
import type { MarketRegime } from '../../datasets/dataset-metadata';

export type HistoricalDataset = Readonly<{
  datasetId: string;
  displayName: string;
  description: string;
  marketRegime: MarketRegime;
  exchange: string;
  symbols: readonly string[];
  timeframe: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
  contentHash: string;
}>;

export type ResearchPerformanceMetrics = Readonly<{
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
}>;

export type ResearchValidationSummary = Readonly<{
  passed: boolean;
  chronologicalReplay: boolean;
  noFutureDataLeakage: boolean;
  noDuplicateCandles: boolean;
  noDuplicateTrades: boolean;
  processedCandles: number;
  evaluatedCandles: number;
  warmupCandles: number;
  resultHash: string;
}>;

export type HistoricalReplayInput = Readonly<{
  workspaceId: string;
  dataset: HistoricalDataset;
  strategy: Strategy;
  candles: readonly Candle[];
}>;

export type HistoricalReplayResult = Readonly<{
  dataset: HistoricalDataset;
  strategy: Strategy;
  symbol: string;
  timeframe: string;
  trades: readonly ExecutedTrade[];
  signalStats: SignalStats;
  metrics: ResearchPerformanceMetrics;
  validation: ResearchValidationSummary;
  executionTimeMs: number;
}>;

export type HistoricalResearchReport = Readonly<{
  researchId: string;
  datasets: ReadonlyArray<{
    datasetId: string;
    displayName: string;
    marketRegime: MarketRegime;
  }>;
  strategiesExecuted: ReadonlyArray<{ strategyId: string; name: string }>;
  statistics: {
    resultCount: number;
    datasetCount: number;
    strategyCount: number;
    totalTrades: number;
  };
  performanceMetrics: {
    netProfit: number;
    averageWinRate: number;
    worstMaxDrawdown: number;
  };
  validationSummary: {
    passed: boolean;
    passedResults: number;
    failedResults: number;
  };
}>;
