/**
 * Optimization criteria for US203 Strategy Optimization.
 */

export const OPTIMIZATION_CRITERIA_TYPES = Object.freeze([
  'highestExecutionSuccessRate',
  'lowestAverageSlippage',
  'lowestCommission',
  'customWeightedScore',
] as const);

export type OptimizationCriteriaType = (typeof OPTIMIZATION_CRITERIA_TYPES)[number];

export type CustomScoreWeights = Readonly<{
  executionSuccessRate: number;
  averageSlippage: number;
  totalCommission: number;
}>;

export type OptimizationCriteria =
  | Readonly<{ criterion: 'highestExecutionSuccessRate' }>
  | Readonly<{ criterion: 'lowestAverageSlippage' }>
  | Readonly<{ criterion: 'lowestCommission' }>
  | Readonly<{ criterion: 'customWeightedScore'; weights: CustomScoreWeights }>;

export type CreateOptimizationCriteriaInput = OptimizationCriteria;

export function createOptimizationCriteria(
  input: CreateOptimizationCriteriaInput,
): OptimizationCriteria {
  const criterion = input.criterion;
  if (!isOptimizationCriteriaType(criterion)) {
    throw new Error(`invalid optimization criteria: ${String(criterion)}`);
  }

  if (criterion === 'customWeightedScore') {
    if (!('weights' in input) || input.weights === null || input.weights === undefined) {
      throw new Error('weights are required for customWeightedScore');
    }
    return Object.freeze({
      criterion,
      weights: validateWeights(input.weights),
    });
  }

  return Object.freeze({ criterion });
}

export function isOptimizationCriteriaType(value: string): value is OptimizationCriteriaType {
  return (OPTIMIZATION_CRITERIA_TYPES as readonly string[]).includes(value);
}

function validateWeights(weights: CustomScoreWeights): CustomScoreWeights {
  const executionSuccessRate = nonNegativeWeight(
    weights.executionSuccessRate,
    'weights.executionSuccessRate',
  );
  const averageSlippage = nonNegativeWeight(weights.averageSlippage, 'weights.averageSlippage');
  const totalCommission = nonNegativeWeight(weights.totalCommission, 'weights.totalCommission');
  const total = executionSuccessRate + averageSlippage + totalCommission;
  if (total <= 0) {
    throw new Error('weights must sum to a positive value');
  }

  return Object.freeze({
    executionSuccessRate,
    averageSlippage,
    totalCommission,
  });
}

function nonNegativeWeight(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}
