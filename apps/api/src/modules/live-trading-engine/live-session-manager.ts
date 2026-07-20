import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PortfolioService } from '../portfolio-engine';
import {
  archiveLiveSession,
  beginConnecting,
  createLiveSession,
  liveSessionPortfolioWorkspaceKey,
  markConnected,
  pauseLiveSession,
  resumeLiveSession,
  startLiveSession,
  stopLiveSession,
  withHeartbeat,
  withSynchronizationState,
  type LiveSession,
} from './domain/live-session';
import type { SynchronizationState } from './domain/synchronization-state';
import { LiveEventPublisher } from './live-event-publisher';
import {
  LiveSessionAlreadyActiveError,
  LiveSessionInvalidStateError,
  LiveSessionNotFoundError,
  LiveSessionValidationError,
} from './live-trading-errors';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

export type LiveTradingClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

export type StartLiveSessionRequest = Readonly<{
  exchange: string;
  accountId: string;
  sessionId?: string;
}>;

/**
 * LiveSessionManager — session lifecycle only (US210).
 * Creates owned Portfolio via PortfolioService; enforces one active session per account.
 */
@Injectable()
export class LiveSessionManager {
  private clock: LiveTradingClock = defaultClock();

  constructor(
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
    @Inject(LiveEventPublisher) private readonly events: LiveEventPublisher,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  setClock(clock: LiveTradingClock): void {
    this.clock = clock;
  }

  async list(workspaceId: string): Promise<LiveSession[]> {
    return this.repository.listSessionsByWorkspaceId(workspaceId);
  }

  async getById(workspaceId: string, sessionId: string): Promise<LiveSession> {
    return this.requireSession(workspaceId, sessionId);
  }

  async create(
    workspaceId: string,
    ownerId: string,
    exchange: string,
    accountId: string,
  ): Promise<LiveSession> {
    const normalizedExchange = (exchange ?? '').trim().toUpperCase();
    const normalizedAccountId = (accountId ?? '').trim();
    if (normalizedExchange === '') {
      throw new LiveSessionValidationError('exchange is required');
    }
    if (normalizedAccountId === '') {
      throw new LiveSessionValidationError('accountId is required');
    }

    const existing = await this.repository.findActiveSessionByAccountId(
      workspaceId,
      normalizedAccountId,
    );
    if (existing) {
      throw new LiveSessionAlreadyActiveError(
        `account ${normalizedAccountId} already has active session ${existing.id}`,
      );
    }

    const sessionId = randomUUID();
    const portfolioWorkspaceKey = liveSessionPortfolioWorkspaceKey(sessionId);
    const now = this.clock.iso();

    let portfolio;
    try {
      // Local cash starts at zero; exchange balances are reconciled via SynchronizationManager.
      portfolio = await this.portfolios.getOrCreateWithInitialCash(
        portfolioWorkspaceKey,
        ownerId,
        '0',
      );
    } catch (error) {
      throw new LiveSessionValidationError(
        error instanceof Error ? error.message : 'Failed to create session portfolio',
        error,
      );
    }

    let session: LiveSession;
    try {
      session = createLiveSession({
        id: sessionId,
        workspaceId,
        ownerId,
        portfolioId: portfolio.id,
        portfolioWorkspaceKey,
        exchange: normalizedExchange,
        accountId: normalizedAccountId,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      throw new LiveSessionValidationError(
        error instanceof Error ? error.message : 'Invalid live session',
        error,
      );
    }

    const created = await this.repository.createSession(session);
    await this.events.publish({
      eventType: 'LiveSessionCreated',
      sessionId: created.id,
      occurredAt: now,
      exchange: created.exchange,
      accountId: created.accountId,
      portfolioId: created.portfolioId,
    });
    return created;
  }

  async beginConnect(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = beginConnecting(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot connect session',
      );
    }
    return this.repository.saveSession(next);
  }

  async markConnected(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = markConnected(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot mark session connected',
      );
    }
    return this.repository.saveSession(next);
  }

  async start(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = startLiveSession(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot start session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'LiveSessionStarted',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
      exchange: saved.exchange,
    });
    return saved;
  }

  async pause(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = pauseLiveSession(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot pause session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'LiveSessionPaused',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async resume(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = resumeLiveSession(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot resume session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'LiveSessionResumed',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async stop(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = stopLiveSession(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot stop session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'LiveSessionStopped',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async archive(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = archiveLiveSession(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot archive session',
      );
    }
    try {
      await this.portfolios.archive(session.portfolioWorkspaceKey);
    } catch {
      // Portfolio may already be archived.
    }
    return this.repository.saveSession(next);
  }

  async heartbeat(session: LiveSession): Promise<LiveSession> {
    const now = this.clock.iso();
    let next: LiveSession;
    try {
      next = withHeartbeat(session, now);
    } catch (error) {
      throw new LiveSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot update heartbeat',
      );
    }
    return this.repository.saveSession(next);
  }

  async setSynchronizationState(
    session: LiveSession,
    state: SynchronizationState,
  ): Promise<LiveSession> {
    const now = this.clock.iso();
    const next = withSynchronizationState(session, state, now);
    return this.repository.saveSession(next);
  }

  async save(session: LiveSession): Promise<LiveSession> {
    return this.repository.saveSession(session);
  }

  async requireSession(workspaceId: string, sessionId: string): Promise<LiveSession> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session || session.workspaceId !== workspaceId) {
      throw new LiveSessionNotFoundError();
    }
    return session;
  }
}

function defaultClock(): LiveTradingClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}
