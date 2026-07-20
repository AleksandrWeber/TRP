import type { Portfolio } from './domain/portfolio';
import type { PortfolioSnapshot } from './domain/portfolio-snapshot';
import type { PortfolioDomainEvent } from './portfolio-events';

export const PORTFOLIO_REPOSITORY = Symbol('PORTFOLIO_REPOSITORY');

export interface PortfolioRepository {
  create(portfolio: Portfolio): Promise<Portfolio>;

  save(portfolio: Portfolio): Promise<Portfolio>;

  findByWorkspaceId(workspaceId: string): Promise<Portfolio | null>;

  findById(portfolioId: string): Promise<Portfolio | null>;

  createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot>;

  listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]>;

  appendEvent(event: PortfolioDomainEvent, eventId: string): Promise<void>;

  listEvents(portfolioId: string): Promise<PortfolioDomainEvent[]>;
}
