/** Strategy Domain entity (US004/US005). Configuration storage only. */

export const STRATEGY_STATUSES = ['draft', 'active', 'archived'] as const;
export const STRATEGY_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export const STRATEGY_DIRECTIONS = ['LONG', 'SHORT', 'BOTH'] as const;

export type StrategyStatus = (typeof STRATEGY_STATUSES)[number];
export type StrategyTimeframe = (typeof STRATEGY_TIMEFRAMES)[number];
export type StrategyDirection = (typeof STRATEGY_DIRECTIONS)[number];
export type StrategyParameters = Record<string, unknown>;

export function isStrategyStatus(value: string): value is StrategyStatus {
  return (STRATEGY_STATUSES as readonly string[]).includes(value);
}

export function isStrategyTimeframe(value: string): value is StrategyTimeframe {
  return (STRATEGY_TIMEFRAMES as readonly string[]).includes(value);
}

export function isStrategyDirection(value: string): value is StrategyDirection {
  return (STRATEGY_DIRECTIONS as readonly string[]).includes(value);
}

export type Strategy = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: StrategyStatus;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  parameters: StrategyParameters;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 */
  updatedAt: string;
};
