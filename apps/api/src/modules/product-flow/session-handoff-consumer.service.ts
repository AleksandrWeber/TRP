import { Inject, Injectable } from '@nestjs/common';
import {
  TRADING_ORCHESTRATOR_QUERY_PORT,
  type SessionHandoffIntentView,
  type TradingOrchestratorQueryPort,
} from '../trading-orchestrator/ports/trading-orchestrator.port';
import type { TradingSession } from '../trading-session/domain/trading-session';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import {
  TradingSessionService,
  type CreateTradingSessionCommand,
} from '../trading-session/trading-session.service';
import {
  toSessionHandoffConsumeView,
  type SessionHandoffConsumeView,
} from './session-handoff-consume.view';
import {
  sessionHandoffIdempotencyKey,
  sessionHandoffIntentIdFromKey,
} from './session-handoff-idempotency';

export type ConsumeOrCreateSessionCommand = CreateTradingSessionCommand &
  Readonly<{
    sessionHandoffIntentId?: string;
  }>;

/**
 * PC-15 15-a — Session consumer of SessionHandoffIntent.
 *
 * Trading Session remains Session owner (create is delegated).
 * Orchestrator remains coordination only (createsSession stays false).
 * Intent is read, never mutated. No Orders, Execution, or Risk.
 */
@Injectable()
export class SessionHandoffConsumerService {
  constructor(
    @Inject(TradingSessionService)
    private readonly sessions: TradingSessionService,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessionRepository: TradingSessionRepository,
    @Inject(TRADING_ORCHESTRATOR_QUERY_PORT)
    private readonly orchestratorQuery: TradingOrchestratorQueryPort,
  ) {}

  async consumeOrCreate(command: ConsumeOrCreateSessionCommand): Promise<TradingSession> {
    const explicitId = command.sessionHandoffIntentId?.trim();
    if (explicitId) {
      const intent = this.requireIntent(command.workspaceId, explicitId);
      this.assertCompatibleDeployment(intent, command.deploymentId);
      return this.consume(command, intent);
    }

    const matched = await this.findUnconsumedHandoff(command.workspaceId, command.deploymentId);
    if (matched) {
      return this.consume(command, matched);
    }

    return this.sessions.create(command);
  }

  async projectConsume(
    workspaceId: string,
    sessionId: string,
  ): Promise<SessionHandoffConsumeView | null> {
    const session = await this.sessions.get(workspaceId, sessionId);
    if (!session) return null;
    const sessionHandoffIntentId = sessionHandoffIntentIdFromKey(session.idempotencyKey);
    if (!sessionHandoffIntentId) return null;
    const intent = this.orchestratorQuery.getSessionHandoffIntent({
      workspaceId,
      sessionHandoffIntentId,
    });
    return toSessionHandoffConsumeView({
      sessionHandoffIntentId,
      orchestrationRunId: intent?.orchestrationRunId ?? session.correlationId,
    });
  }

  private async consume(
    command: ConsumeOrCreateSessionCommand,
    intent: SessionHandoffIntentView,
  ): Promise<TradingSession> {
    if (intent.createsSession !== false) {
      throw new Error('session handoff intent must not create a Session');
    }
    if (intent.isOrder !== false || intent.isRiskDecision !== false) {
      throw new Error('session handoff intent is not an Order or Risk decision');
    }

    return this.sessions.create({
      workspaceId: command.workspaceId,
      paperAccountId: command.paperAccountId,
      deploymentId: intent.deploymentBindRef,
      origin: 'strategy',
      idempotencyKey: sessionHandoffIdempotencyKey(intent.sessionHandoffIntentId),
      actorId: command.actorId,
      correlationId: command.correlationId ?? intent.sessionHandoffIntentId,
      createdAt: command.createdAt,
      recordedAt: command.recordedAt,
    });
  }

  private async findUnconsumedHandoff(
    workspaceId: string,
    deploymentId: string,
  ): Promise<SessionHandoffIntentView | null> {
    const runs = this.orchestratorQuery.listOrchestrationRuns({ workspaceId, limit: 50 });
    for (const run of [...runs].reverse()) {
      if (!run.sessionHandoffIntentId) continue;
      const intent = this.orchestratorQuery.getSessionHandoffIntent({
        workspaceId,
        sessionHandoffIntentId: run.sessionHandoffIntentId,
      });
      if (!intent || intent.deploymentBindRef !== deploymentId) continue;
      if (intent.createsSession !== false) continue;
      const existing = await this.sessionRepository.findByIdempotencyKey(
        workspaceId,
        sessionHandoffIdempotencyKey(intent.sessionHandoffIntentId),
      );
      if (!existing) return intent;
    }
    return null;
  }

  private requireIntent(
    workspaceId: string,
    sessionHandoffIntentId: string,
  ): SessionHandoffIntentView {
    const intent = this.orchestratorQuery.getSessionHandoffIntent({
      workspaceId,
      sessionHandoffIntentId,
    });
    if (!intent) {
      throw new Error('session handoff intent not found in workspace');
    }
    return intent;
  }

  private assertCompatibleDeployment(intent: SessionHandoffIntentView, deploymentId: string): void {
    if (intent.deploymentBindRef !== deploymentId) {
      throw new Error('session handoff intent deployment bind does not match');
    }
  }
}
