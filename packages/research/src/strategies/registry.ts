import type { Strategy, StrategyParams } from '../types';
import { DONCHIAN_STRATEGY } from './donchian-breakout';
import { EMA_CROSSOVER_STRATEGY } from './ema-crossover';

const strategies = new Map<string, Strategy<StrategyParams>>([
  [EMA_CROSSOVER_STRATEGY.id, EMA_CROSSOVER_STRATEGY],
  [DONCHIAN_STRATEGY.id, DONCHIAN_STRATEGY],
]);

export function resolveStrategy(strategyId: string): Strategy<StrategyParams> {
  const strategy = strategies.get(strategyId);
  if (!strategy) {
    throw new Error(`Unsupported strategy: ${strategyId}`);
  }
  return strategy;
}

export function listStrategies(): Strategy<StrategyParams>[] {
  return [...strategies.values()];
}
