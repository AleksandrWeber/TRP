import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STRATEGY_COMPARISON_WEIGHTS,
  resolveStrategyComparisonWeights,
  type StrategyComparisonWeights,
} from './strategy-comparison-weights';

describe('strategy comparison weights', () => {
  it('returns the frozen historical contract when weights are omitted', () => {
    expect(resolveStrategyComparisonWeights()).toBe(DEFAULT_STRATEGY_COMPARISON_WEIGHTS);
    expect(DEFAULT_STRATEGY_COMPARISON_WEIGHTS).toEqual({
      totalReturn: 0.4,
      maxDrawdown: 0.3,
      profitFactor: 0.2,
      winRate: 0.1,
    });
    expect(Object.isFrozen(DEFAULT_STRATEGY_COMPARISON_WEIGHTS)).toBe(true);
  });

  it('copies a valid contract so later mutation does not change the resolved weights', () => {
    const supplied = {
      totalReturn: 0.25,
      maxDrawdown: 0.25,
      profitFactor: 0.25,
      winRate: 0.25,
    };

    const resolved = resolveStrategyComparisonWeights(supplied);
    supplied.totalReturn = 1;

    expect(resolved).toEqual({
      totalReturn: 0.25,
      maxDrawdown: 0.25,
      profitFactor: 0.25,
      winRate: 0.25,
    });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(resolved).not.toBe(supplied);
  });

  it('rejects non-finite, negative, and incomplete weights', () => {
    expect(() =>
      resolveStrategyComparisonWeights(null as unknown as StrategyComparisonWeights),
    ).toThrow(/must be an object/);
    expect(() =>
      resolveStrategyComparisonWeights({
        totalReturn: Number.NaN,
        maxDrawdown: 0,
        profitFactor: 0,
        winRate: 0,
      }),
    ).toThrow(/totalReturn/);
    expect(() =>
      resolveStrategyComparisonWeights({
        totalReturn: -0.1,
        maxDrawdown: 1.1,
        profitFactor: 0,
        winRate: 0,
      }),
    ).toThrow(/totalReturn/);
    expect(() =>
      resolveStrategyComparisonWeights({
        totalReturn: Number.POSITIVE_INFINITY,
        maxDrawdown: 0,
        profitFactor: 0,
        winRate: 0,
      }),
    ).toThrow(/totalReturn/);
    expect(() =>
      resolveStrategyComparisonWeights({
        maxDrawdown: 1,
        profitFactor: 0,
        winRate: 0,
      } as StrategyComparisonWeights),
    ).toThrow(/totalReturn/);
  });
});
