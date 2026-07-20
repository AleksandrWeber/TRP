import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PortfolioService } from '../portfolio-engine';
import {
  archivePaperSession,
  completePaperSession,
  createPaperSession,
  paperSessionPortfolioWorkspaceKey,
  pausePaperSession,
  startPaperSession,
  stopPaperSession,
  withSessionBalance,
  type PaperSession,
} from './domain/paper-session';
import { PaperEventPublisher } from './paper-event-publisher';
import {
  PaperSessionInvalidStateError,
  PaperSessionNotFoundError,
  PaperSessionValidationError,
} from './paper-trading-errors';
import { PAPER_TRADING_REPOSITORY, type PaperTradingRepository } from './paper-trading.repository';

export type PaperTradingClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

export type CreateSessionRequest = Readonly<{
  name: string;
  initialBalance?: string;
}>;

/**
 * PaperSessionManager — session lifecycle only (US208).
 * Creates the owned Portfolio via PortfolioService; no direct Portfolio mutation.
 */
@Injectable()
export class PaperSessionManager {
  private clock: PaperTradingClock = defaultClock();

  constructor(
    @Inject(PAPER_TRADING_REPOSITORY) private readonly repository: PaperTradingRepository,
    @Inject(PaperEventPublisher) private readonly events: PaperEventPublisher,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  setClock(clock: PaperTradingClock): void {
    this.clock = clock;
  }

  async list(workspaceId: string): Promise<PaperSession[]> {
    return this.repository.listSessionsByWorkspaceId(workspaceId);
  }

  async getById(workspaceId: string, sessionId: string): Promise<PaperSession> {
    return this.requireSession(workspaceId, sessionId);
  }

  async create(
    workspaceId: string,
    ownerId: string,
    request: CreateSessionRequest,
  ): Promise<PaperSession> {
    const name = (request.name ?? '').trim();
    if (name === '') {
      throw new PaperSessionValidationError('name is required');
    }
    const initialBalance = (request.initialBalance ?? '100000').trim();
    const sessionId = randomUUID();
    const portfolioWorkspaceKey = paperSessionPortfolioWorkspaceKey(sessionId);
    const now = this.clock.iso();

    let portfolio;
    try {
      portfolio = await this.portfolios.getOrCreateWithInitialCash(
        portfolioWorkspaceKey,
        ownerId,
        initialBalance,
      );
    } catch (error) {
      throw new PaperSessionValidationError(
        error instanceof Error ? error.message : 'Failed to create session portfolio',
        error,
      );
    }

    let session: PaperSession;
    try {
      session = createPaperSession({
        id: sessionId,
        workspaceId,
        ownerId,
        portfolioId: portfolio.id,
        portfolioWorkspaceKey,
        name,
        initialBalance,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      throw new PaperSessionValidationError(
        error instanceof Error ? error.message : 'Invalid paper session',
        error,
      );
    }

    const created = await this.repository.createSession(session);
    await this.events.publish({
      eventType: 'PaperSessionCreated',
      sessionId: created.id,
      occurredAt: now,
      name: created.name,
      portfolioId: created.portfolioId,
      initialBalance: created.initialBalance,
    });
    return created;
  }

  async start(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = startPaperSession(session, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot start session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'PaperSessionStarted',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async pause(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = pausePaperSession(session, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot pause session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'PaperSessionPaused',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async stop(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = stopPaperSession(session, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot stop session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'PaperSessionStopped',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  async complete(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = completePaperSession(session, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot complete session',
      );
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'PaperSessionCompleted',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
      currentBalance: saved.currentBalance,
    });
    return saved;
  }

  async archive(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.requireSession(workspaceId, sessionId);
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = archivePaperSession(session, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot archive session',
      );
    }
    try {
      await this.portfolios.archive(session.portfolioWorkspaceKey);
    } catch {
      // Portfolio may already be archived; session archive still proceeds.
    }
    const saved = await this.repository.saveSession(next);
    await this.events.publish({
      eventType: 'PaperSessionArchived',
      sessionId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return saved;
  }

  /**
   * DELETE semantics: archive when not archived; hard-delete when already archived.
   */
  async remove(workspaceId: string, sessionId: string): Promise<{ id: string; deleted: boolean }> {
    const session = await this.requireSession(workspaceId, sessionId);
    if (session.status !== 'ARCHIVED') {
      await this.archive(workspaceId, sessionId);
      return { id: sessionId, deleted: false };
    }
    await this.repository.deleteSession(sessionId);
    return { id: sessionId, deleted: true };
  }

  async syncBalance(session: PaperSession, currentBalance: string): Promise<PaperSession> {
    const now = this.clock.iso();
    let next: PaperSession;
    try {
      next = withSessionBalance(session, currentBalance, now);
    } catch (error) {
      throw new PaperSessionInvalidStateError(
        error instanceof Error ? error.message : 'Cannot update session balance',
      );
    }
    return this.repository.saveSession(next);
  }

  async requireSession(workspaceId: string, sessionId: string): Promise<PaperSession> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session || session.workspaceId !== workspaceId) {
      throw new PaperSessionNotFoundError();
    }
    return session;
  }
}

function defaultClock(): PaperTradingClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}
