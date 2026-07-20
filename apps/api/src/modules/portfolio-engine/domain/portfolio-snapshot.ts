import type { Balance } from './balance';
import type { Equity } from './equity';
import type { Margin } from './margin';

/**
 * Immutable portfolio financial snapshot (US204).
 */
export type PortfolioSnapshot = Readonly<{
  id: string;
  portfolioId: string;
  timestamp: string;
  balance: Balance;
  equity: Equity;
  margin: Margin;
  realizedPnL: string;
  unrealizedPnL: string;
}>;

export type CreatePortfolioSnapshotInput = Readonly<{
  id: string;
  portfolioId: string;
  timestamp: string;
  balance: Balance;
  equity: Equity;
  margin: Margin;
}>;

export function createPortfolioSnapshot(input: CreatePortfolioSnapshotInput): PortfolioSnapshot {
  assertIso(input.timestamp, 'timestamp');
  return Object.freeze({
    id: required(input.id, 'snapshot id'),
    portfolioId: required(input.portfolioId, 'portfolio id'),
    timestamp: input.timestamp,
    balance: input.balance,
    equity: input.equity,
    margin: input.margin,
    realizedPnL: input.equity.realizedPnL,
    unrealizedPnL: input.equity.unrealizedPnL,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
