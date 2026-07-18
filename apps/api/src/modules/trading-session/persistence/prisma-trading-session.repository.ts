import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import type { SessionLease } from '../domain/session-lease';
import type { TradingSession } from '../domain/trading-session';
import {
  isTradingSessionStatus,
  type TradingSessionStatus,
} from '../domain/trading-session-status';
import type { TradingSessionRepository } from './trading-session.repository';

export class PrismaTradingSessionRepository implements TradingSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(session: TradingSession, transaction: TransactionContext): Promise<TradingSession> {
    const row = await prismaClientForTransaction(transaction).tradingSession.create({
      data: toRow(session),
    });
    return toDomain(row);
  }

  async save(session: TradingSession, transaction: TransactionContext): Promise<TradingSession> {
    const row = await prismaClientForTransaction(transaction).tradingSession.update({
      where: { id: session.id },
      data: toRow(session),
    });
    return toDomain(row);
  }

  async findById(workspaceId: string, sessionId: string): Promise<TradingSession | null> {
    const row = await this.prisma.tradingSession.findFirst({
      where: { id: sessionId, workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<TradingSession | null> {
    const row = await this.prisma.tradingSession.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } },
    });
    return row ? toDomain(row) : null;
  }
}

type TradingSessionRow = {
  id: string;
  workspaceId: string;
  paperAccountId: string;
  deploymentId: string;
  origin: string;
  status: string;
  leaseOwnerId: string | null;
  fencingToken: number | null;
  leaseAcquiredAt: Date | null;
  leaseExpiresAt: Date | null;
  leaseHeartbeatAt: Date | null;
  lastFencingToken: number;
  version: number;
  failureReason: string | null;
  createdAt: Date;
  recordedAt: Date;
  actorId: string;
  correlationId: string | null;
  idempotencyKey: string;
};

function toRow(session: TradingSession): Prisma.TradingSessionUncheckedCreateInput {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    paperAccountId: session.paperAccountId,
    deploymentId: session.deploymentId,
    origin: session.origin,
    status: session.status,
    leaseOwnerId: session.lease?.ownerId ?? null,
    fencingToken: session.lease?.fencingToken ?? null,
    leaseAcquiredAt: session.lease ? new Date(session.lease.acquiredAt) : null,
    leaseExpiresAt: session.lease ? new Date(session.lease.expiresAt) : null,
    leaseHeartbeatAt: session.lease ? new Date(session.lease.heartbeatAt) : null,
    lastFencingToken: session.lastFencingToken,
    version: session.version,
    failureReason: session.failureReason,
    createdAt: new Date(session.createdAt),
    recordedAt: new Date(session.recordedAt),
    actorId: session.actorId,
    correlationId: session.correlationId,
    idempotencyKey: session.idempotencyKey,
  };
}

function toDomain(row: TradingSessionRow): TradingSession {
  if (row.origin !== 'manual') {
    throw new Error(`unsupported trading session origin persisted: ${row.origin}`);
  }
  if (!isTradingSessionStatus(row.status)) {
    throw new Error(`unsupported trading session status persisted: ${row.status}`);
  }
  const lease = toLease(row);
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    paperAccountId: row.paperAccountId,
    deploymentId: row.deploymentId,
    origin: 'manual',
    status: row.status as TradingSessionStatus,
    lease,
    lastFencingToken: row.lastFencingToken,
    version: row.version,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    actorId: row.actorId,
    correlationId: row.correlationId,
    idempotencyKey: row.idempotencyKey,
  });
}

function toLease(row: TradingSessionRow): SessionLease | null {
  if (
    row.leaseOwnerId === null ||
    row.fencingToken === null ||
    row.leaseAcquiredAt === null ||
    row.leaseExpiresAt === null ||
    row.leaseHeartbeatAt === null
  ) {
    return null;
  }
  return Object.freeze({
    ownerId: row.leaseOwnerId,
    fencingToken: row.fencingToken,
    acquiredAt: row.leaseAcquiredAt.toISOString(),
    expiresAt: row.leaseExpiresAt.toISOString(),
    heartbeatAt: row.leaseHeartbeatAt.toISOString(),
  });
}
