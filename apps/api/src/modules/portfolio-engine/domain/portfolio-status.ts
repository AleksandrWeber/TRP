/**
 * Portfolio lifecycle status (US204).
 */
export const PORTFOLIO_STATUSES = Object.freeze(['ACTIVE', 'PAUSED', 'ARCHIVED'] as const);

export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export function isPortfolioStatus(value: string): value is PortfolioStatus {
  return (PORTFOLIO_STATUSES as readonly string[]).includes(value);
}

export function assertPortfolioStatus(value: string): PortfolioStatus {
  if (!isPortfolioStatus(value)) {
    throw new Error(`unsupported portfolio status: ${value}`);
  }
  return value;
}
