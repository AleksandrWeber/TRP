import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { PortfolioProjection } from '../domain/portfolio-projection';

export const PORTFOLIO_REPOSITORY = Symbol('PORTFOLIO_REPOSITORY');

export interface PortfolioRepository {
  find(workspaceId: string, paperAccountId: string): Promise<PortfolioProjection | null>;

  save(
    projection: PortfolioProjection,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<PortfolioProjection>;
}
