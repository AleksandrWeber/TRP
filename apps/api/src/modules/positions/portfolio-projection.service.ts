import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  TransactionalOutboxAppender,
  toDurableEventId,
  type DurableEventEnvelope,
} from '../event-processing';
import { LedgerService } from '../ledger';
import {
  PORTFOLIO_PROJECTION_SCHEMA_VERSION,
  projectPortfolio,
  type PortfolioProjection,
} from './domain/portfolio-projection';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './persistence/portfolio.repository';
import {
  POSITION_VALUATION_REPOSITORY,
  type PositionValuationRepository,
} from './persistence/position-valuation.repository';

@Injectable()
export class PortfolioProjectionService {
  constructor(
    @Inject(LedgerService)
    private readonly ledger: LedgerService,
    @Inject(POSITION_VALUATION_REPOSITORY)
    private readonly valuations: PositionValuationRepository,
    @Inject(PORTFOLIO_REPOSITORY)
    private readonly portfolios: PortfolioRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async refresh(
    workspaceId: string,
    paperAccountId: string,
    recordedAt: string,
  ): Promise<PortfolioProjection> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const [ledger, valuations, current] = await Promise.all([
        this.ledger.summarizeAccount(workspaceId, paperAccountId),
        this.valuations.listByAccount(workspaceId, paperAccountId),
        this.portfolios.find(workspaceId, paperAccountId),
      ]);
      if (!ledger.currency) throw new Error('Portfolio requires an initialized Ledger');
      const next = projectPortfolio(ledger, valuations, current, recordedAt);
      if (current?.sourceHash === next.sourceHash) return current;
      try {
        return await this.transactions.run(async (transaction) => {
          await this.portfolios.save(next, current?.version ?? 0, transaction);
          await this.outbox.append(transaction, portfolioEnvelope(next), recordedAt);
          return next;
        });
      } catch (error) {
        if (isConflict(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('Portfolio projection concurrency limit exceeded');
  }

  get(workspaceId: string, paperAccountId: string): Promise<PortfolioProjection | null> {
    return this.portfolios.find(workspaceId, paperAccountId);
  }
}

function portfolioEnvelope(value: PortfolioProjection): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`portfolio:${value.id}:v${value.version}`),
    eventType: 'PortfolioProjectionUpdated',
    schemaVersion: PORTFOLIO_PROJECTION_SCHEMA_VERSION,
    aggregateType: 'PortfolioProjection',
    aggregateId: value.id,
    aggregateVersion: value.version,
    workspaceId: value.workspaceId,
    occurredAt: value.valuedAt ?? value.recordedAt,
    recordedAt: value.recordedAt,
    actorId: 'portfolio-projection',
    payload: Object.freeze({
      paperAccountId: value.paperAccountId,
      currency: value.currency,
      cash: value.cash,
      marketValue: value.marketValue,
      equity: value.equity,
      realizedPnl: value.realizedPnl,
      unrealizedPnl: value.unrealizedPnl,
      totalPnl: value.totalPnl,
      fees: value.fees,
      exposure: value.exposure,
      ledgerVersion: value.ledgerVersion,
      valuationCheckpoint: value.valuationCheckpoint,
      complete: value.complete,
    }),
  });
}

function isConflict(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
    (error instanceof Error && error.message.includes('optimistic version conflict'))
  );
}
