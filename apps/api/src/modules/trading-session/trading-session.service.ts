import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import {
  PAPER_ACCOUNT_REPOSITORY,
  type PaperAccountRepository,
} from '../paper-account/persistence/paper-account.repository';
import { PaperAccountStatus } from '../paper-account/domain/paper-account';
import {
  assertExecutionEligible,
  evaluateExecutionEligibility,
  type ExecutionEligibility,
  type ExecutionEligibilityDenied,
} from './domain/execution-eligibility';
import { createSessionLease, heartbeatLease } from './domain/session-lease';
import {
  attachLease,
  clearLease,
  createTradingSession,
  replaceLeaseHeartbeat,
  transitionSession,
  type TradingSession,
} from './domain/trading-session';
import { TradingSessionStatus } from './domain/trading-session-status';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from './persistence/trading-session.repository';

const DEFAULT_LEASE_TTL_MS = 30_000;

export type CreateTradingSessionCommand = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  deploymentId: string;
  origin: 'manual';
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  createdAt: string;
  recordedAt: string;
}>;

export type SessionLifecycleCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  actorId: string;
  ownerId: string;
  fencingToken?: number;
  correlationId?: string;
  recordedAt: string;
  nowIso: string;
  leaseTtlMs?: number;
  failureReason?: string;
}>;

/**
 * Durable Trading Session application boundary (US156 / US157).
 * Manual origin only for M2 — no strategy evaluation or scheduler.
 */
@Injectable()
export class TradingSessionService {
  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(PAPER_ACCOUNT_REPOSITORY)
    private readonly accounts: PaperAccountRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async create(command: CreateTradingSessionCommand): Promise<TradingSession> {
    const idempotencyKey = required(command.idempotencyKey, 'idempotency key');
    const actorId = required(command.actorId, 'actor id');
    const existing = await this.sessions.findByIdempotencyKey(command.workspaceId, idempotencyKey);
    if (existing) {
      assertSameCreate(existing, command);
      return existing;
    }

    const account = await this.accounts.findById(command.workspaceId, command.paperAccountId);
    if (!account) {
      throw new Error('paper account not found in workspace');
    }
    if (
      account.status === PaperAccountStatus.CLOSED ||
      account.status === PaperAccountStatus.SUSPENDED
    ) {
      throw new Error(`paper account status ${account.status} cannot own a trading session`);
    }

    const session = createTradingSession({
      id: randomUUID(),
      workspaceId: command.workspaceId,
      paperAccountId: command.paperAccountId,
      deploymentId: command.deploymentId,
      origin: command.origin,
      actorId,
      correlationId: command.correlationId,
      idempotencyKey,
      createdAt: command.createdAt,
      recordedAt: command.recordedAt,
    });

    try {
      return await this.transactions.run(async (transaction) => {
        const created = await this.sessions.create(session, transaction);
        await this.outbox.append(
          transaction,
          lifecycleEnvelope(created, 'TradingSessionCreated', actorId, command.correlationId, {
            fromStatus: null,
            toStatus: created.status,
          }),
          command.recordedAt,
        );
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.sessions.findByIdempotencyKey(command.workspaceId, idempotencyKey);
        if (raced) {
          assertSameCreate(raced, command);
          return raced;
        }
      }
      throw error;
    }
  }

  get(workspaceId: string, sessionId: string): Promise<TradingSession | null> {
    return this.sessions.findById(workspaceId, sessionId);
  }

  /**
   * Manual start: CREATED → STARTING → RUNNING with a fenced lease.
   */
  async start(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      let next = session;
      next = transitionSession(next, TradingSessionStatus.STARTING, command.recordedAt);
      const lease = createSessionLease({
        ownerId: command.ownerId,
        acquiredAt: command.nowIso,
        expiresAt: leaseExpiry(command.nowIso, command.leaseTtlMs),
        previousToken: next.lastFencingToken,
      });
      next = attachLease(next, lease);
      next = transitionSession(next, TradingSessionStatus.RUNNING, command.recordedAt);
      return {
        session: next,
        eventType: 'TradingSessionStarted',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  async pause(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      requireCurrentFence(session, command);
      const next = transitionSession(session, TradingSessionStatus.PAUSED, command.recordedAt);
      return {
        session: next,
        eventType: 'TradingSessionPaused',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  async resume(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      requireCurrentFence(session, command);
      const next = transitionSession(session, TradingSessionStatus.RUNNING, command.recordedAt);
      return {
        session: next,
        eventType: 'TradingSessionResumed',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  async stop(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      requireCurrentFence(session, command);
      let next = transitionSession(session, TradingSessionStatus.STOPPING, command.recordedAt);
      next = clearLease(next);
      next = transitionSession(next, TradingSessionStatus.STOPPED, command.recordedAt);
      return {
        session: next,
        eventType: 'TradingSessionStopped',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  async heartbeat(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      requireCurrentFence(session, command);
      if (session.lease === null) {
        throw new Error('trading session has no active lease');
      }
      const lease = heartbeatLease(
        session.lease,
        command.nowIso,
        leaseExpiry(command.nowIso, command.leaseTtlMs),
      );
      const next = replaceLeaseHeartbeat(session, lease, command.recordedAt);
      return {
        session: next,
        eventType: 'TradingSessionLeaseHeartbeat',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  /**
   * Mark ownership lost / restart path without performing full M5 recovery.
   */
  async markRecovering(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      const next = clearLease(
        transitionSession(session, TradingSessionStatus.RECOVERING, command.recordedAt),
      );
      return {
        session: next,
        eventType: 'TradingSessionRecovering',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  async fail(command: SessionLifecycleCommand): Promise<TradingSession> {
    return this.mutate(command, async (session) => {
      const next = clearLease(
        transitionSession(session, TradingSessionStatus.FAILED, command.recordedAt, {
          failureReason: command.failureReason ?? 'unrecoverable failure',
        }),
      );
      return {
        session: next,
        eventType: 'TradingSessionFailed',
        fromStatus: session.status,
        toStatus: next.status,
      };
    });
  }

  evaluateEligibility(
    session: TradingSession,
    fencingToken: number,
    nowIso: string,
  ): ExecutionEligibility | ExecutionEligibilityDenied {
    return evaluateExecutionEligibility(session, fencingToken, nowIso);
  }

  assertEligible(
    session: TradingSession,
    fencingToken: number,
    nowIso: string,
  ): ExecutionEligibility {
    return assertExecutionEligible(session, fencingToken, nowIso);
  }

  private async mutate(
    command: SessionLifecycleCommand,
    work: (session: TradingSession) => Promise<{
      session: TradingSession;
      eventType: string;
      fromStatus: TradingSessionStatus;
      toStatus: TradingSessionStatus;
    }>,
  ): Promise<TradingSession> {
    const actorId = required(command.actorId, 'actor id');
    const current = await this.requireSession(command.workspaceId, command.sessionId);

    try {
      const planned = await work(current);
      return await this.transactions.run(async (transaction) => {
        const saved = await this.sessions.save(planned.session, transaction);
        await this.outbox.append(
          transaction,
          lifecycleEnvelope(saved, planned.eventType, actorId, command.correlationId, {
            fromStatus: planned.fromStatus,
            toStatus: planned.toStatus,
            fencingToken: saved.lease?.fencingToken ?? null,
            ownerId: saved.lease?.ownerId ?? null,
          }),
          command.recordedAt,
        );
        return saved;
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('invalid trading session transition')
      ) {
        try {
          await this.recordRejectedTransition(current, actorId, command, error.message);
        } catch {
          // Best-effort durable audit; never mask the domain rejection.
        }
      }
      throw error;
    }
  }

  private async recordRejectedTransition(
    session: TradingSession,
    actorId: string,
    command: SessionLifecycleCommand,
    reason: string,
  ): Promise<void> {
    const rejectionId = randomUUID();
    await this.transactions.run(async (transaction) => {
      await this.outbox.append(
        transaction,
        Object.freeze({
          eventId: toDurableEventId(`trading-session:${session.id}:rejected:${rejectionId}`),
          eventType: 'TradingSessionTransitionRejected',
          schemaVersion: 1,
          aggregateType: 'TradingSessionTransitionRejection',
          aggregateId: rejectionId,
          aggregateVersion: 1,
          workspaceId: session.workspaceId,
          occurredAt: command.recordedAt,
          recordedAt: command.recordedAt,
          ...(command.correlationId !== undefined ? { correlationId: command.correlationId } : {}),
          actorId,
          payload: Object.freeze({
            sessionId: session.id,
            sessionVersion: session.version,
            status: session.status,
            reason,
            retained: true,
          }),
        }),
        command.recordedAt,
      );
    });
  }

  private async requireSession(workspaceId: string, sessionId: string): Promise<TradingSession> {
    const session = await this.sessions.findById(workspaceId, sessionId);
    if (!session) {
      throw new Error('trading session not found in workspace');
    }
    return session;
  }
}

function requireCurrentFence(session: TradingSession, command: SessionLifecycleCommand): void {
  if (command.fencingToken === undefined) {
    throw new Error('fencing token is required');
  }
  if (session.lease === null || session.lease.fencingToken !== command.fencingToken) {
    throw new Error('stale fencing token rejected');
  }
  if (session.lease.ownerId !== command.ownerId) {
    throw new Error('lease owner mismatch');
  }
}

function leaseExpiry(nowIso: string, leaseTtlMs: number | undefined): string {
  const ttl = leaseTtlMs ?? DEFAULT_LEASE_TTL_MS;
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error('leaseTtlMs must be a positive integer');
  }
  return new Date(Date.parse(nowIso) + ttl).toISOString();
}

function lifecycleEnvelope(
  session: TradingSession,
  eventType: string,
  actorId: string,
  correlationId: string | undefined,
  details: {
    fromStatus: TradingSessionStatus | null;
    toStatus: TradingSessionStatus;
    fencingToken?: number | null;
    ownerId?: string | null;
  },
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`trading-session:${session.id}:${eventType}:v${session.version}`),
    eventType,
    schemaVersion: 1,
    aggregateType: 'TradingSession',
    aggregateId: session.id,
    aggregateVersion: session.version,
    workspaceId: session.workspaceId,
    occurredAt: session.recordedAt,
    recordedAt: session.recordedAt,
    ...(correlationId !== undefined ? { correlationId } : {}),
    actorId,
    payload: Object.freeze({
      sessionId: session.id,
      paperAccountId: session.paperAccountId,
      deploymentId: session.deploymentId,
      origin: session.origin,
      fromStatus: details.fromStatus,
      toStatus: details.toStatus,
      fencingToken: details.fencingToken ?? session.lease?.fencingToken ?? null,
      ownerId: details.ownerId ?? session.lease?.ownerId ?? null,
      idempotencyKey: session.idempotencyKey,
    }),
  });
}

function assertSameCreate(existing: TradingSession, command: CreateTradingSessionCommand): void {
  if (
    existing.paperAccountId !== command.paperAccountId ||
    existing.deploymentId !== command.deploymentId ||
    existing.origin !== command.origin
  ) {
    throw new Error('idempotency key reused with a different trading session command');
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
