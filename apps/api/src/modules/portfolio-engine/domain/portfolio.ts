import { FinancialDecimal } from '../../financial';
import { createBalance, type Balance } from './balance';
import { assertPortfolioStatus, type PortfolioStatus } from './portfolio-status';

/**
 * Portfolio aggregate root — one trading account (US204).
 * Financial metrics are derived via PortfolioCalculator; never mutated ad hoc.
 */
export type Portfolio = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  currency: string;
  status: PortfolioStatus;
  cash: string;
  initialCash: string;
  realizedPnL: string;
  unrealizedPnL: string;
  usedMargin: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreatePortfolioInput = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  currency: string;
  initialCash: string;
  createdAt: string;
  updatedAt: string;
}>;

export const DEFAULT_PORTFOLIO_CURRENCY = 'USD';
export const DEFAULT_PORTFOLIO_INITIAL_CASH = '100000';

export function createPortfolio(input: CreatePortfolioInput): Portfolio {
  const id = required(input.id, 'portfolio id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const ownerId = required(input.ownerId, 'owner id');
  const currency = normalizeCurrency(input.currency);
  const initialCash = FinancialDecimal.from(input.initialCash)
    .assertNonNegative('initialCash')
    .toString();
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  return Object.freeze({
    id,
    workspaceId,
    ownerId,
    currency,
    status: 'ACTIVE' as const,
    cash: initialCash,
    initialCash,
    realizedPnL: '0',
    unrealizedPnL: '0',
    usedMargin: '0',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export function pausePortfolio(portfolio: Portfolio, updatedAt: string): Portfolio {
  assertTransition(portfolio.status, 'PAUSED');
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({ ...portfolio, status: 'PAUSED' as const, updatedAt });
}

export function resumePortfolio(portfolio: Portfolio, updatedAt: string): Portfolio {
  if (portfolio.status !== 'PAUSED') {
    throw new Error(`portfolio cannot resume from ${portfolio.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({ ...portfolio, status: 'ACTIVE' as const, updatedAt });
}

export function archivePortfolio(portfolio: Portfolio, updatedAt: string): Portfolio {
  assertTransition(portfolio.status, 'ARCHIVED');
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({ ...portfolio, status: 'ARCHIVED' as const, updatedAt });
}

export function resetPortfolio(portfolio: Portfolio, updatedAt: string): Portfolio {
  if (portfolio.status === 'ARCHIVED') {
    throw new Error('archived portfolio cannot be reset');
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...portfolio,
    status: 'ACTIVE' as const,
    cash: portfolio.initialCash,
    realizedPnL: '0',
    unrealizedPnL: '0',
    usedMargin: '0',
    updatedAt,
  });
}

export function applyPortfolioFinancials(
  portfolio: Portfolio,
  financials: Readonly<{
    cash: string;
    realizedPnL: string;
    unrealizedPnL: string;
    usedMargin: string;
  }>,
  updatedAt: string,
): Portfolio {
  if (portfolio.status === 'ARCHIVED') {
    throw new Error('archived portfolio cannot be updated');
  }
  assertIso(updatedAt, 'updatedAt');
  const cash = FinancialDecimal.from(financials.cash).assertNonNegative('cash').toString();
  const usedMargin = FinancialDecimal.from(financials.usedMargin)
    .assertNonNegative('usedMargin')
    .toString();
  return Object.freeze({
    ...portfolio,
    cash,
    realizedPnL: FinancialDecimal.from(financials.realizedPnL).toString(),
    unrealizedPnL: FinancialDecimal.from(financials.unrealizedPnL).toString(),
    usedMargin,
    updatedAt,
  });
}

export function portfolioBalance(portfolio: Portfolio): Balance {
  return createBalance(portfolio.cash);
}

export function rehydratePortfolio(row: {
  id: string;
  workspaceId: string;
  ownerId: string;
  currency: string;
  status: string;
  cash: string;
  initialCash: string;
  realizedPnL: string;
  unrealizedPnL: string;
  usedMargin: string;
  createdAt: string;
  updatedAt: string;
}): Portfolio {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    currency: normalizeCurrency(row.currency),
    status: assertPortfolioStatus(row.status),
    cash: FinancialDecimal.from(row.cash).assertNonNegative('cash').toString(),
    initialCash: FinancialDecimal.from(row.initialCash).assertNonNegative('initialCash').toString(),
    realizedPnL: FinancialDecimal.from(row.realizedPnL).toString(),
    unrealizedPnL: FinancialDecimal.from(row.unrealizedPnL).toString(),
    usedMargin: FinancialDecimal.from(row.usedMargin).assertNonNegative('usedMargin').toString(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function assertTransition(from: PortfolioStatus, to: PortfolioStatus): void {
  if (from === 'ARCHIVED') {
    throw new Error(`portfolio cannot transition from ARCHIVED to ${to}`);
  }
  if (to === 'PAUSED' && from !== 'ACTIVE') {
    throw new Error(`portfolio cannot pause from ${from}`);
  }
}

function normalizeCurrency(value: string): string {
  const currency = required(value, 'currency').toUpperCase();
  if (!/^[A-Z0-9]{3,12}$/.test(currency)) {
    throw new Error('currency must be 3-12 uppercase letters or digits');
  }
  return currency;
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
