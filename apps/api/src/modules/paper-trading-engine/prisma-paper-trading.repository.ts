import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { rehydratePaperExecution, type PaperExecution } from './domain/paper-execution';
import { createPaperEventRecord, type PaperEventRecord } from './domain/paper-event';
import { rehydratePaperSession, type PaperSession } from './domain/paper-session';
import type { PaperTradingDomainEvent } from './paper-trading-events';
import type { PaperTradingRepository } from './paper-trading.repository';

@Injectable()
export class PrismaPaperTradingRepository implements PaperTradingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSession(session: PaperSession): Promise<PaperSession> {
    const row = await this.prisma.paperSession.create({
      data: toSessionRow(session),
    });
    return fromSessionRow(row);
  }

  async saveSession(session: PaperSession): Promise<PaperSession> {
    const row = await this.prisma.paperSession.update({
      where: { id: session.id },
      data: {
        name: session.name,
        status: session.status,
        currentBalance: session.currentBalance,
        startedAt: session.startedAt ? new Date(session.startedAt) : null,
        finishedAt: session.finishedAt ? new Date(session.finishedAt) : null,
        updatedAt: new Date(session.updatedAt),
      },
    });
    return fromSessionRow(row);
  }

  async findSessionById(sessionId: string): Promise<PaperSession | null> {
    const row = await this.prisma.paperSession.findUnique({ where: { id: sessionId } });
    return row ? fromSessionRow(row) : null;
  }

  async listSessionsByWorkspaceId(workspaceId: string): Promise<PaperSession[]> {
    const rows = await this.prisma.paperSession.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromSessionRow);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.paperSession.delete({ where: { id: sessionId } });
  }

  async createExecution(execution: PaperExecution): Promise<PaperExecution> {
    const row = await this.prisma.paperExecution.create({
      data: {
        id: execution.id,
        sessionId: execution.sessionId,
        orderId: execution.orderId,
        executionTime: new Date(execution.executionTime),
        executionPrice: execution.executionPrice,
        slippage: execution.slippage,
        commission: execution.commission,
      },
    });
    return fromExecutionRow(row);
  }

  async listExecutionsBySessionId(sessionId: string): Promise<PaperExecution[]> {
    const rows = await this.prisma.paperExecution.findMany({
      where: { sessionId },
      orderBy: { executionTime: 'desc' },
    });
    return rows.map(fromExecutionRow);
  }

  async appendEvent(event: PaperTradingDomainEvent, eventId: string): Promise<void> {
    const { eventType, sessionId, occurredAt, ...rest } = event;
    await this.prisma.paperEvent.create({
      data: {
        id: eventId,
        sessionId,
        type: eventType,
        timestamp: new Date(occurredAt),
        payload: rest as Prisma.InputJsonValue,
      },
    });
  }

  async listEventsBySessionId(sessionId: string): Promise<PaperEventRecord[]> {
    const rows = await this.prisma.paperEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map((row) =>
      createPaperEventRecord({
        id: row.id,
        sessionId: row.sessionId,
        type: row.type,
        timestamp: row.timestamp.toISOString(),
        payload: (row.payload ?? {}) as Record<string, unknown>,
      }),
    );
  }
}

function toSessionRow(session: PaperSession) {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    ownerId: session.ownerId,
    portfolioId: session.portfolioId,
    portfolioWorkspaceKey: session.portfolioWorkspaceKey,
    name: session.name,
    status: session.status,
    initialBalance: session.initialBalance,
    currentBalance: session.currentBalance,
    createdAt: new Date(session.createdAt),
    startedAt: session.startedAt ? new Date(session.startedAt) : null,
    finishedAt: session.finishedAt ? new Date(session.finishedAt) : null,
    updatedAt: new Date(session.updatedAt),
  };
}

function fromSessionRow(row: {
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  name: string;
  status: string;
  initialBalance: Prisma.Decimal | string;
  currentBalance: Prisma.Decimal | string;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  updatedAt: Date;
}): PaperSession {
  return rehydratePaperSession({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    portfolioId: row.portfolioId,
    portfolioWorkspaceKey: row.portfolioWorkspaceKey,
    name: row.name,
    status: row.status,
    initialBalance: row.initialBalance.toString(),
    currentBalance: row.currentBalance.toString(),
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  });
}

function fromExecutionRow(row: {
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: Date;
  executionPrice: Prisma.Decimal | string;
  slippage: Prisma.Decimal | string;
  commission: Prisma.Decimal | string;
}): PaperExecution {
  return rehydratePaperExecution({
    id: row.id,
    sessionId: row.sessionId,
    orderId: row.orderId,
    executionTime: row.executionTime.toISOString(),
    executionPrice: row.executionPrice.toString(),
    slippage: row.slippage.toString(),
    commission: row.commission.toString(),
  });
}
