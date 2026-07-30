import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  createEvaluationCandle,
  RUNTIME_LEASE_SESSION_STATUS_RUNNING,
  STRATEGY_RUNTIME_PORT,
  type EvaluationCandleInput,
  type StrategyRuntimePort,
} from '../../strategy-runtime';
import {
  decideRecoveryStrategyEvaluation,
  type RecoveryStrategyEvaluationResult,
} from '../domain/recovery-strategy-evaluation';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';

export type RecoveryStrategyEvaluateCommand = Readonly<{
  event: EvaluationCandleInput;
  nowIso: string;
}>;

/**
 * US247 — first deterministic strategy evaluation after Runtime recovery.
 *
 * Requires ARMED Runtime (US246). Accepts an admitted market event, restores
 * evaluation context from the checkpoint-bound Runtime, and produces an
 * evaluation decision only. Does not emit SignalIntent, create Orders, or
 * persist checkpoints.
 */
@Injectable()
export class RecoveryStrategyEvaluationService {
  private readonly logger: Logger;
  private lastResult: RecoveryStrategyEvaluationResult | null = null;
  private readonly evaluatedEvents = new Set<string>();

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(RecoveryRuntimeArmingService)
    private readonly arming: RecoveryRuntimeArmingService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryStrategyEvaluationService.name);
  }

  getLastResult(): RecoveryStrategyEvaluationResult | null {
    return this.lastResult;
  }

  async evaluate(
    command: RecoveryStrategyEvaluateCommand,
  ): Promise<RecoveryStrategyEvaluationResult> {
    const arming = this.arming.getLastResult();
    const candle =
      command.event === undefined || command.event === null
        ? null
        : createEvaluationCandle(command.event);

    const session =
      arming === null ? null : await this.sessions.findById(arming.workspaceId, arming.sessionId);
    const lifecycle =
      arming === null
        ? null
        : await this.runtime.getLifecycle(arming.workspaceId, arming.sessionId);
    const diagnostics =
      arming === null
        ? null
        : await this.runtime.getDiagnostics(arming.workspaceId, arming.sessionId);
    const context =
      arming === null || arming.armedState === null
        ? null
        : await this.runtime.loadContext({
            workspaceId: arming.workspaceId,
            sessionId: arming.sessionId,
            deploymentId: arming.armedState.deploymentId,
          });

    const eventKey =
      arming === null || candle === null
        ? null
        : `${arming.workspaceId}::${arming.sessionId}::${candle.eventId}`;

    let admission = null;
    if (
      arming !== null &&
      arming.outcome === 'ARMED' &&
      arming.armedState !== null &&
      session?.lease !== null &&
      session?.lease !== undefined &&
      candle !== null
    ) {
      admission = await this.runtime.admitTick({
        workspaceId: arming.workspaceId,
        sessionId: arming.sessionId,
        event: candle,
        lease: {
          sessionId: arming.sessionId,
          fencingToken: session.lease.fencingToken,
          ownerId: session.lease.ownerId,
          expiresAt: session.lease.expiresAt,
          sessionStatus: RUNTIME_LEASE_SESSION_STATUS_RUNNING,
        },
        nowIso: command.nowIso,
      });
    }

    const result = decideRecoveryStrategyEvaluation({
      arming,
      lifecycle,
      diagnostics,
      context,
      admission,
      candle,
      alreadyEvaluated: eventKey === null ? false : this.evaluatedEvents.has(eventKey),
    });

    if (result.outcome === 'EVALUATED' && eventKey !== null) {
      this.evaluatedEvents.add(eventKey);
    }

    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private logResult(result: RecoveryStrategyEvaluationResult): void {
    this.logger.info('recovery_strategy_evaluation', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      eventId: result.eventId,
      decisionKind: result.decision?.kind ?? null,
      decisionReason: result.decision?.reason ?? null,
      checkpointEventId: result.restoredContext?.checkpointEventId ?? null,
      checkpointSequence: result.restoredContext?.checkpointSequence ?? null,
      checkpointVersion: result.restoredContext?.checkpointVersion ?? null,
      fencingToken: result.restoredContext?.fencingToken ?? null,
      signalIntentEmitted: result.signalIntentEmitted,
      orderCreated: result.orderCreated,
    });
  }
}
