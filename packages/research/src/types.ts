export type OhlcvBar = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type BacktestConfig = {
  initialCapital: number;
  feeRate: number;
  slippageRate: number;
};

export type StrategyParams = {
  emaFast: number;
  emaSlow: number;
};

export type Trade = {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: 'long';
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
};

export type BacktestMetrics = {
  totalReturn: number;
  totalReturnPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  finalEquity: number;
};

export type BacktestResult = {
  trades: Trade[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
  metrics: BacktestMetrics;
};

export type ValidationVerdict = 'pass' | 'fail' | 'needs_review';

export type ValidationResult = {
  verdict: ValidationVerdict;
  reasons: string[];
  checks: Array<{
    name: string;
    passed: boolean;
    value: number | string;
    threshold: string;
  }>;
};

export type ExperimentConfig = {
  strategyId: string;
  strategyVersion: string;
  params: StrategyParams;
  backtest: BacktestConfig;
};

export type ExperimentReport = {
  strategyId: string;
  strategyVersion: string;
  params: StrategyParams;
  backtest: BacktestConfig;
  metrics: BacktestMetrics;
  validation: ValidationResult;
  tradeCount: number;
  datasetBarCount: number;
  generatedAt: string;
};
