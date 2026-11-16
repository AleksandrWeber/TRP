/**
 * In-process comparison-score contract.
 * Weights change only the weighted score and the overall winner.
 * Metric extraction and the return, drawdown, profit-factor, and win-rate
 * rankings stay on the source results.
 * Omitting the contract keeps the historical deterministic weights.
 */
export type StrategyComparisonWeights = Readonly<{
  totalReturn: number;
  maxDrawdown: number;
  profitFactor: number;
  winRate: number;
}>;

/** Historical US123 weights: return 0.4, drawdown 0.3, profit factor 0.2, win rate 0.1. */
export const DEFAULT_STRATEGY_COMPARISON_WEIGHTS: StrategyComparisonWeights = Object.freeze({
  totalReturn: 0.4,
  maxDrawdown: 0.3,
  profitFactor: 0.2,
  winRate: 0.1,
});

const WEIGHT_FIELDS = ['totalReturn', 'maxDrawdown', 'profitFactor', 'winRate'] as const;

/** Accepts the binary rounding of the historical 0.4 + 0.3 + 0.2 + 0.1 sum. */
const WEIGHT_SUM_TOLERANCE = 1e-9;

export function resolveStrategyComparisonWeights(
  weights?: StrategyComparisonWeights,
): StrategyComparisonWeights {
  if (weights === undefined) return DEFAULT_STRATEGY_COMPARISON_WEIGHTS;
  if (typeof weights !== 'object' || weights === null || Array.isArray(weights)) {
    throw new Error('strategy comparison weights must be an object');
  }

  const resolved = {
    totalReturn: readWeight(weights, 'totalReturn'),
    maxDrawdown: readWeight(weights, 'maxDrawdown'),
    profitFactor: readWeight(weights, 'profitFactor'),
    winRate: readWeight(weights, 'winRate'),
  };
  const sum = WEIGHT_FIELDS.reduce((total, field) => total + resolved[field], 0);
  if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error('strategy comparison weights must sum to 1');
  }

  return Object.freeze(resolved);
}

function readWeight(
  weights: StrategyComparisonWeights,
  field: (typeof WEIGHT_FIELDS)[number],
): number {
  const value = weights[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `strategy comparison weight ${field} must be a finite number greater than or equal to 0`,
    );
  }
  return value;
}
