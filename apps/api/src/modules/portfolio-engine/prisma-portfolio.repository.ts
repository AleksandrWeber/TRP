import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { createBalance } from './domain/balance';
import { createEquity } from './domain/equity';
import { createMargin } from './domain/margin';
import { rehydratePortfolio, type Portfolio } from './domain/portfolio';
import { createPortfolioSnapshot, type PortfolioSnapshot } from './domain/portfolio-snapshot';
import type { PortfolioDomainEvent, PortfolioEventType } from './portfolio-events';
import type { PortfolioRepository } from './portfolio.repository';

@Injectable()
export class PrismaPortfolioRepository implements PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(portfolio: Portfolio): Promise<Portfolio> {
    const row = await this.prisma.portfolio.create({
      data: toRow(portfolio),
    });
    return fromRow(row);
  }

  async save(portfolio: Portfolio): Promise<Portfolio> {
    const row = await this.prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        status: portfolio.status,
        cash: portfolio.cash,
        realizedPnl: portfolio.realizedPnL,
        unrealizedPnl: portfolio.unrealizedPnL,
        usedMargin: portfolio.usedMargin,
        updatedAt: new Date(portfolio.updatedAt),
      },
    });
    return fromRow(row);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Portfolio | null> {
    const row = await this.prisma.portfolio.findUnique({
      where: { workspaceId },
    });
    return row ? fromRow(row) : null;
  }

  async findById(portfolioId: string): Promise<Portfolio | null> {
    const row = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    return row ? fromRow(row) : null;
  }

  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    const row = await this.prisma.portfolioSnapshot.create({
      data: {
        id: snapshot.id,
        portfolioId: snapshot.portfolioId,
        timestamp: new Date(snapshot.timestamp),
        cash: snapshot.balance.cash,
        equity: snapshot.equity.equity,
        usedMargin: snapshot.margin.usedMargin,
        availableMargin: snapshot.margin.availableMargin,
        realizedPnl: snapshot.realizedPnL,
        unrealizedPnl: snapshot.unrealizedPnL,
      },
    });
    return fromSnapshotRow(row);
  }

  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    const rows = await this.prisma.portfolioSnapshot.findMany({
      where: { portfolioId },
      orderBy: { timestamp: 'desc' },
    });
    return rows.map(fromSnapshotRow);
  }

  async appendEvent(event: PortfolioDomainEvent, eventId: string): Promise<void> {
    const { eventType, portfolioId, occurredAt, ...rest } = event;
    await this.prisma.portfolioEvent.create({
      data: {
        id: eventId,
        portfolioId,
        eventType,
        payload: rest as Prisma.InputJsonValue,
        occurredAt: new Date(occurredAt),
      },
    });
  }

  async listEvents(portfolioId: string): Promise<PortfolioDomainEvent[]> {
    const rows = await this.prisma.portfolioEvent.findMany({
      where: { portfolioId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => {
      const payload = row.payload as Record<string, unknown>;
      return {
        eventType: row.eventType as PortfolioEventType,
        portfolioId: row.portfolioId,
        occurredAt: row.occurredAt.toISOString(),
        ...payload,
      } as PortfolioDomainEvent;
    });
  }
}

type PortfolioRow = {
  id: string;
  workspaceId: string;
  ownerId: string;
  currency: string;
  status: string;
  cash: { toFixed(): string };
  initialCash: { toFixed(): string };
  realizedPnl: { toFixed(): string };
  unrealizedPnl: { toFixed(): string };
  usedMargin: { toFixed(): string };
  createdAt: Date;
  updatedAt: Date;
};

type SnapshotRow = {
  id: string;
  portfolioId: string;
  timestamp: Date;
  cash: { toFixed(): string };
  equity: { toFixed(): string };
  usedMargin: { toFixed(): string };
  availableMargin: { toFixed(): string };
  realizedPnl: { toFixed(): string };
  unrealizedPnl: { toFixed(): string };
};

function toRow(portfolio: Portfolio) {
  return {
    id: portfolio.id,
    workspaceId: portfolio.workspaceId,
    ownerId: portfolio.ownerId,
    currency: portfolio.currency,
    status: portfolio.status,
    cash: portfolio.cash,
    initialCash: portfolio.initialCash,
    realizedPnl: portfolio.realizedPnL,
    unrealizedPnl: portfolio.unrealizedPnL,
    usedMargin: portfolio.usedMargin,
    createdAt: new Date(portfolio.createdAt),
    updatedAt: new Date(portfolio.updatedAt),
  };
}

function fromRow(row: PortfolioRow): Portfolio {
  return rehydratePortfolio({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    currency: row.currency,
    status: row.status,
    cash: row.cash.toFixed(),
    initialCash: row.initialCash.toFixed(),
    realizedPnL: row.realizedPnl.toFixed(),
    unrealizedPnL: row.unrealizedPnl.toFixed(),
    usedMargin: row.usedMargin.toFixed(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function fromSnapshotRow(row: SnapshotRow): PortfolioSnapshot {
  return createPortfolioSnapshot({
    id: row.id,
    portfolioId: row.portfolioId,
    timestamp: row.timestamp.toISOString(),
    balance: createBalance(row.cash.toFixed()),
    equity: createEquity({
      equity: row.equity.toFixed(),
      realizedPnL: row.realizedPnl.toFixed(),
      unrealizedPnL: row.unrealizedPnl.toFixed(),
    }),
    margin: createMargin({
      usedMargin: row.usedMargin.toFixed(),
      availableMargin: row.availableMargin.toFixed(),
    }),
  });
}
