import { Inject, Injectable } from '@nestjs/common';
import {
  TradingSessionService,
  type SessionLifecycleCommand,
} from '../trading-session/trading-session.service';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import { assertBotIsSessionFacade, toBotView, type BotView } from './domain/bot-view';

export type BotLifecycleCommand = Readonly<{
  workspaceId: string;
  /** Bot id === Trading Session id. */
  botId: string;
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
 * RC-19 Epic 2 — Bot product facade over Trading Session.
 *
 * Delegates all lifecycle operations to TradingSessionService.
 * Does not own persistence, leases, risk, or execution.
 */
@Injectable()
export class BotFacadeService {
  constructor(
    @Inject(TradingSessionService)
    private readonly sessions: TradingSessionService,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessionRepository: TradingSessionRepository,
  ) {}

  async listBots(workspaceId: string): Promise<readonly BotView[]> {
    const rows = await this.sessionRepository.findByWorkspaceId(workspaceId);
    return Object.freeze(
      rows.map((session) => {
        const bot = toBotView(session);
        assertBotIsSessionFacade(bot);
        return bot;
      }),
    );
  }

  async getBot(workspaceId: string, botId: string): Promise<BotView | null> {
    const session = await this.sessions.get(workspaceId, botId);
    if (!session) return null;
    const bot = toBotView(session);
    assertBotIsSessionFacade(bot);
    return bot;
  }

  async pauseBot(command: BotLifecycleCommand): Promise<BotView> {
    return this.mapLifecycle(command, (sessionCommand) => this.sessions.pause(sessionCommand));
  }

  async resumeBot(command: BotLifecycleCommand): Promise<BotView> {
    return this.mapLifecycle(command, (sessionCommand) => this.sessions.resume(sessionCommand));
  }

  async stopBot(command: BotLifecycleCommand): Promise<BotView> {
    return this.mapLifecycle(command, (sessionCommand) => this.sessions.stop(sessionCommand));
  }

  /**
   * Product "Delete Bot" = stop the Trading Session.
   * Does not delete rows (audit/history preserved). No second store.
   */
  async deleteBot(command: BotLifecycleCommand): Promise<BotView> {
    return this.stopBot(command);
  }

  private async mapLifecycle(
    command: BotLifecycleCommand,
    operate: (
      sessionCommand: SessionLifecycleCommand,
    ) => Promise<Awaited<ReturnType<TradingSessionService['pause']>>>,
  ): Promise<BotView> {
    const session = await operate(toSessionLifecycleCommand(command));
    const bot = toBotView(session);
    assertBotIsSessionFacade(bot);
    return bot;
  }
}

function toSessionLifecycleCommand(command: BotLifecycleCommand): SessionLifecycleCommand {
  return {
    workspaceId: command.workspaceId,
    sessionId: command.botId,
    actorId: command.actorId,
    ownerId: command.ownerId,
    fencingToken: command.fencingToken,
    correlationId: command.correlationId,
    recordedAt: command.recordedAt,
    nowIso: command.nowIso,
    leaseTtlMs: command.leaseTtlMs,
    failureReason: command.failureReason,
  };
}
