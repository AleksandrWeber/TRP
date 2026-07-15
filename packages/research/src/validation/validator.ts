import type { BacktestMetrics, ValidationResult, ValidationVerdict } from '../types';

type ValidationRules = {
  minTrades: number;
  minProfitFactorPass: number;
  minProfitFactorReview: number;
  maxDrawdownPercentPass: number;
  maxDrawdownPercentReview: number;
};

export const DEFAULT_VALIDATION_RULES: ValidationRules = {
  minTrades: 10,
  minProfitFactorPass: 1.05,
  minProfitFactorReview: 0.95,
  maxDrawdownPercentPass: 25,
  maxDrawdownPercentReview: 35,
};

export function validateBacktest(
  metrics: BacktestMetrics,
  rules: ValidationRules = DEFAULT_VALIDATION_RULES,
): ValidationResult {
  const checks = [
    {
      name: 'Minimum trades',
      passed: metrics.tradeCount >= rules.minTrades,
      value: metrics.tradeCount,
      threshold: `>= ${rules.minTrades}`,
    },
    {
      name: 'Profit factor',
      passed: metrics.profitFactor >= rules.minProfitFactorReview,
      value: Number(metrics.profitFactor.toFixed(4)),
      threshold: `>= ${rules.minProfitFactorReview}`,
    },
    {
      name: 'Max drawdown',
      passed: metrics.maxDrawdownPercent <= rules.maxDrawdownPercentReview,
      value: Number(metrics.maxDrawdownPercent.toFixed(2)),
      threshold: `<= ${rules.maxDrawdownPercentReview}%`,
    },
    {
      name: 'Positive expectancy',
      passed: metrics.expectancy > 0,
      value: Number(metrics.expectancy.toFixed(4)),
      threshold: '> 0',
    },
  ];

  const reasons: string[] = [];
  let verdict: ValidationVerdict = 'pass';

  if (metrics.tradeCount < rules.minTrades) {
    verdict = 'fail';
    reasons.push(`Insufficient trades (${metrics.tradeCount} < ${rules.minTrades})`);
  }

  if (metrics.profitFactor < rules.minProfitFactorReview) {
    verdict = 'fail';
    reasons.push(`Profit factor too low (${metrics.profitFactor.toFixed(2)})`);
  }

  if (metrics.maxDrawdownPercent > rules.maxDrawdownPercentReview) {
    verdict = 'fail';
    reasons.push(`Drawdown too high (${metrics.maxDrawdownPercent.toFixed(1)}%)`);
  }

  if (metrics.expectancy <= 0) {
    verdict = 'fail';
    reasons.push('Non-positive expectancy');
  }

  if (verdict !== 'fail') {
    const needsReview =
      metrics.profitFactor < rules.minProfitFactorPass ||
      metrics.maxDrawdownPercent > rules.maxDrawdownPercentPass;

    if (needsReview) {
      verdict = 'needs_review';
      reasons.push('Metrics borderline — manual review recommended');
    } else {
      reasons.push('All validation checks passed');
    }
  }

  return { verdict, reasons, checks };
}
