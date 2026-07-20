import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { createLiveEventRecord, type LiveEventRecord } from './domain/live-event';
import { rehydrateLiveSession, type LiveSession } from './domain/live-session';
import { rehydrateSynchronizationLog, type SynchronizationLog } from './domain/synchronization-log';
import { isActiveLiveSessionStatus } from './domain/session-status';
import type { LiveTradingDomainEvent } from './live-trading-events';
import type { LiveTradingRepository } from './live-trading.repository';

@Injectable()
export class PrismaLiveTradingRepository implements LiveTradingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSession(session: LiveSession): Promise<LiveSession> {
    const row = await this.prisma.liveSession.create({
      data: toSessionRow(session),
    });
    return fromSessionRow(row);
  }

  async saveSession(session: LiveSession): Promise<LiveSession> {
    const row = await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        status: session.status,
        startedAt: session.startedAt ? new Date(session.startedAt) : null,
        stoppedAt: session.stoppedAt ? new Date(session.stoppedAt) : null,
        lastHeartbeat: session.lastHeartbeat ? new Date(session.lastHeartbeat) : null,
        reconnectCount: session.reconnectCount,
        synchronizationState: session.synchronizationState,
        tradingFrozen: session.tradingFrozen,
        updatedAt: new Date(session.updatedAt),
      },
    });
    return fromSessionRow(row);
  }

  async findSessionById(sessionId: string): Promise<LiveSession | null> {
    const row = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    return row ? fromSessionRow(row) : null;
  }

  async listSessionsByWorkspaceId(workspaceId: string): Promise<LiveSession[]> {
    const rows = await this.prisma.liveSession.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(fromSessionRow);
  }

  async findActiveSessionByAccountId(
    workspaceId: string,
    accountId: string,
  ): Promise<LiveSession | null> {
    const rows = await this.prisma.liveSession.findMany({
      where: { workspaceId, accountId },
      orderBy: { createdAt: 'desc' },
    });
    for (const row of rows) {
      const session = fromSessionRow(row);
      if (isActiveLiveSessionStatus(session.status)) {
        return session;
      }
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.liveSession.delete({ where: { id: sessionId } });
  }

  async appendEvent(event: LiveTradingDomainEvent, eventId: string): Promise<void> {
    const { eventType, sessionId, occurredAt, ...rest } = event;
    await this.prisma.liveEvent.create({
      data: {
        id: eventId,
        sessionId,
        type: eventType,
        timestamp: new Date(occurredAt),
        payload: rest as Prisma.InputJsonValue,
      },
    });
  }

  async listEventsBySessionId(sessionId: string): Promise<LiveEventRecord[]> {
    const rows = await this.prisma.liveEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map((row) =>
      createLiveEventRecord({
        id: row.id,
        sessionId: row.sessionId,
        type: row.type,
        timestamp: row.timestamp.toISOString(),
        payload: (row.payload ?? {}) as Record<string, unknown>,
      }),
    );
  }

  async createSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog> {
    const row = await this.prisma.synchronizationLog.create({
      data: {
        id: log.id,
        sessionId: log.sessionId,
        kind: log.kind,
        status: log.status,
        startedAt: new Date(log.startedAt),
        completedAt: log.completedAt ? new Date(log.completedAt) : null,
        details: log.details as Prisma.InputJsonValue,
      },
    });
    return fromSyncLogRow(row);
  }

  async saveSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog> {
    const row = await this.prisma.synchronizationLog.update({
      where: { id: log.id },
      data: {
        status: log.status,
        completedAt: log.completedAt ? new Date(log.completedAt) : null,
        details: log.details as Prisma.InputJsonValue,
      },
    });
    return fromSyncLogRow(row);
  }

  async listSynchronizationLogsBySessionId(sessionId: string): Promise<SynchronizationLog[]> {
    const rows = await this.prisma.synchronizationLog.findMany({
      where: { sessionId },
      orderBy: { startedAt: 'desc' },
    });
    return rows.map(fromSyncLogRow);
  }

  async listSynchronizationLogsByWorkspaceId(workspaceId: string): Promise<SynchronizationLog[]> {
    const rows = await this.prisma.synchronizationLog.findMany({
      where: { session: { workspaceId } },
      orderBy: { startedAt: 'desc' },
    });
    return rows.map(fromSyncLogRow);
  }

  async hasProcessedExecution(sessionId: string, executionId: string): Promise<boolean> {
    const row = await this.prisma.liveProcessedExecution.findUnique({
      where: {
        sessionId_executionId: { sessionId, executionId },
      },
    });
    return row !== null;
  }

  async markExecutionProcessed(sessionId: string, executionId: string): Promise<void> {
    await this.prisma.liveProcessedExecution.create({
      data: {
        id: `${sessionId}:${executionId}`,
        sessionId,
        executionId,
      },
    });
  }
}

function toSessionRow(session: LiveSession) {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    ownerId: session.ownerId,
    portfolioId: session.portfolioId,
    portfolioWorkspaceKey: session.portfolioWorkspaceKey,
    exchange: session.exchange,
    accountId: session.accountId,
    status: session.status,
    startedAt: session.startedAt ? new Date(session.startedAt) : null,
    stoppedAt: session.stoppedAt ? new Date(session.stoppedAt) : null,
    lastHeartbeat: session.lastHeartbeat ? new Date(session.lastHeartbeat) : null,
    reconnectCount: session.reconnectCount,
    synchronizationState: session.synchronizationState,
    tradingFrozen: session.tradingFrozen,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  };
}

function fromSessionRow(row: {
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  exchange: string;
  accountId: string;
  status: string;
  startedAt: Date | null;
  stoppedAt: Date | null;
  lastHeartbeat: Date | null;
  reconnectCount: number;
  synchronizationState: string;
  tradingFrozen: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LiveSession {
  return rehydrateLiveSession({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    portfolioId: row.portfolioId,
    portfolioWorkspaceKey: row.portfolioWorkspaceKey,
    exchange: row.exchange,
    accountId: row.accountId,
    status: row.status,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    stoppedAt: row.stoppedAt ? row.stoppedAt.toISOString() : null,
    lastHeartbeat: row.lastHeartbeat ? row.lastHeartbeat.toISOString() : null,
    reconnectCount: row.reconnectCount,
    synchronizationState: row.synchronizationState,
    tradingFrozen: row.tradingFrozen,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function fromSyncLogRow(row: {
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  details: Prisma.JsonValue;
}): SynchronizationLog {
  return rehydrateSynchronizationLog({
    id: row.id,
    sessionId: row.sessionId,
    kind: row.kind,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    details: (row.details ?? {}) as Record<string, unknown>,
  });
}
