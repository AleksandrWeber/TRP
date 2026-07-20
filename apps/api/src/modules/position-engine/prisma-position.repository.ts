import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { rehydratePosition, type Position } from './domain/position';
import { createPositionHistory, type PositionHistory } from './domain/position-history';
import type { PositionDomainEvent, PositionEventType } from './position-events';
import type { PositionRepository } from './position.repository';

@Injectable()
export class PrismaPositionRepository implements PositionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(position: Position): Promise<Position> {
    const row = await this.prisma.position.create({
      data: toRow(position),
    });
    return fromRow(row);
  }

  async save(position: Position): Promise<Position> {
    const row = await this.prisma.position.update({
      where: { id: position.id },
      data: {
        status: position.status,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        markPrice: position.markPrice,
        averageEntryPrice: position.averageEntryPrice,
        realizedPnl: position.realizedPnL,
        unrealizedPnl: position.unrealizedPnL,
        updatedAt: new Date(position.updatedAt),
        closedAt: position.closedAt ? new Date(position.closedAt) : null,
      },
    });
    return fromRow(row);
  }

  async findById(positionId: string): Promise<Position | null> {
    const row = await this.prisma.position.findUnique({
      where: { id: positionId },
    });
    return row ? fromRow(row) : null;
  }

  async listByPortfolioId(portfolioId: string): Promise<Position[]> {
    const rows = await this.prisma.position.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromRow);
  }

  async listOpenByPortfolioId(portfolioId: string): Promise<Position[]> {
    const rows = await this.prisma.position.findMany({
      where: {
        portfolioId,
        status: { in: ['OPEN', 'PARTIALLY_CLOSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromRow);
  }

  async createHistory(entry: PositionHistory): Promise<PositionHistory> {
    const row = await this.prisma.positionHistory.create({
      data: {
        id: entry.id,
        positionId: entry.positionId,
        timestamp: new Date(entry.timestamp),
        action: entry.action,
        quantity: entry.quantity,
        price: entry.price,
        realizedPnl: entry.realizedPnL,
      },
    });
    return fromHistoryRow(row);
  }

  async listHistoryByPositionId(positionId: string): Promise<PositionHistory[]> {
    const rows = await this.prisma.positionHistory.findMany({
      where: { positionId },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(fromHistoryRow);
  }

  async listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    const rows = await this.prisma.positionHistory.findMany({
      where: { position: { portfolioId } },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(fromHistoryRow);
  }

  async appendEvent(event: PositionDomainEvent, eventId: string): Promise<void> {
    const { eventType, positionId, occurredAt, ...rest } = event;
    await this.prisma.positionEvent.create({
      data: {
        id: eventId,
        positionId,
        eventType,
        payload: rest as Prisma.InputJsonValue,
        occurredAt: new Date(occurredAt),
      },
    });
  }

  async listEvents(positionId: string): Promise<PositionDomainEvent[]> {
    const rows = await this.prisma.positionEvent.findMany({
      where: { positionId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => {
      const payload = row.payload as Record<string, unknown>;
      return {
        eventType: row.eventType as PositionEventType,
        positionId: row.positionId,
        occurredAt: row.occurredAt.toISOString(),
        ...payload,
      } as PositionDomainEvent;
    });
  }
}

type PositionRow = {
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  status: string;
  quantity: { toFixed(): string };
  entryPrice: { toFixed(): string };
  markPrice: { toFixed(): string };
  averageEntryPrice: { toFixed(): string };
  realizedPnl: { toFixed(): string };
  unrealizedPnl: { toFixed(): string };
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
};

type HistoryRow = {
  id: string;
  positionId: string;
  timestamp: Date;
  action: string;
  quantity: { toFixed(): string };
  price: { toFixed(): string };
  realizedPnl: { toFixed(): string };
};

function toRow(position: Position) {
  return {
    id: position.id,
    portfolioId: position.portfolioId,
    symbol: position.symbol,
    side: position.side,
    status: position.status,
    quantity: position.quantity,
    entryPrice: position.entryPrice,
    markPrice: position.markPrice,
    averageEntryPrice: position.averageEntryPrice,
    realizedPnl: position.realizedPnL,
    unrealizedPnl: position.unrealizedPnL,
    createdAt: new Date(position.createdAt),
    updatedAt: new Date(position.updatedAt),
    closedAt: position.closedAt ? new Date(position.closedAt) : null,
  };
}

function fromRow(row: PositionRow): Position {
  return rehydratePosition({
    id: row.id,
    portfolioId: row.portfolioId,
    symbol: row.symbol,
    side: row.side,
    status: row.status,
    quantity: row.quantity.toFixed(),
    entryPrice: row.entryPrice.toFixed(),
    markPrice: row.markPrice.toFixed(),
    averageEntryPrice: row.averageEntryPrice.toFixed(),
    realizedPnL: row.realizedPnl.toFixed(),
    unrealizedPnL: row.unrealizedPnl.toFixed(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
  });
}

function fromHistoryRow(row: HistoryRow): PositionHistory {
  return createPositionHistory({
    id: row.id,
    positionId: row.positionId,
    timestamp: row.timestamp.toISOString(),
    action: row.action,
    quantity: row.quantity.toFixed(),
    price: row.price.toFixed(),
    realizedPnL: row.realizedPnl.toFixed(),
  });
}
