import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { PrismaTransactionService } from '../../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../../event-processing';
import { TransactionalOutboxAppender } from '../../event-processing/transactional-outbox-appender';
import { STRATEGY_RUNTIME_PORT, type StrategyRuntimePort } from '../../strategy-runtime';
import { RecoveryPhase } from '../domain/durable-recovery-state';
import {
  decideRecoveryCompletion,
  type RecoveryCompletionResult,
  type RecoveryResumeIntent,
} from '../domain/recovery-completion';
import { TradingSessionStatus } from '../domain/trading-session-status';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import { RecoveryEventAdmissionService } from './recovery-event-admission.service';
import { RecoveryIncidentFailClosedService } from './recovery-incident-fail-closed.service';
import { RecoveryLeaseAcquisitionService } from './recovery-lease-acquisition.service';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';
import { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';
import { RecoveryRuntimeResumeService } from './recovery-runtime-resume.service';
import { RecoverySignalIntentGenerationService } from './recovery-signal-intent-generation.service';
import { RecoveryStateReconciliationService } from './recovery-state-reconciliation.service';
import { RecoveryStrategyEvaluationService } from './recovery-strategy-evaluation.service';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

export type RecoveryCompleteCommand = Readonly<{
  recordedAt: string;
  actorId: string;
  correlationId?: string;
  /** Explicit controlled termination without requiring SignalIntent / NO_ACTION. */
  controlledTermination?: boolean;
  /** Session exit target after recovery; defaults to durable RecoveryState.resumeIntent then RUNNING. */
  resumeIntent?: RecoveryResumeIntent;
}>;

export type RecoveryCompleteResult = RecoveryCompletionResult &
  Readonly<{
    leaseReleased: boolean;
    completionEventEmitted: boolean;
  }>;

/**
 * US249 — deterministic Recovery completion and Session exit (+ US292 finalize
 * + US293 fail-closed when READY exit is blocked).
 *
 * After a terminal Stage 3 outcome (SignalIntent generated, non-actionable
 * evaluation, or controlled termination), verifies pipeline consistency,
 * transitions Session out of `RECOVERING`, releases recovery lease ownership,
 * finalizes durable RecoveryState, and emits a durable completion event.
 * Does not create Orders or change Runtime lifecycle.
 */
@Injectable()
export class RecoveryCompletionService {
  private readonly logger: Logger;
  private lastResult: RecoveryCompleteResult | null = null;
  private readonly completedSessions = new Set<string>();

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(StartupRecoveryDiscoveryService)
    private readonly discovery: StartupRecoveryDiscoveryService,
    @Inject(RecoveryLeaseAcquisitionService)
    private readonly lease: RecoveryLeaseAcquisitionService,
    @Inject(RecoveryCheckpointValidationService)
    private readonly checkpoint: RecoveryCheckpointValidationService,
    @Inject(RecoveryStateReconciliationService)
    private readonly reconcile: RecoveryStateReconciliationService,
    @Inject(RecoveryRuntimeResumeService)
    private readonly resume: RecoveryRuntimeResumeService,
    @Inject(RecoveryEventAdmissionService)
    private readonly admission: RecoveryEventAdmissionService,
    @Inject(RecoveryRuntimeArmingService)
    private readonly arming: RecoveryRuntimeArmingService,
    @Inject(RecoveryStrategyEvaluationService)
    private readonly evaluation: RecoveryStrategyEvaluationService,
    @Inject(RecoverySignalIntentGenerationService)
    private readonly signalIntent: RecoverySignalIntentGenerationService,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(RecoveryIncidentFailClosedService)
    private readonly failClosed: RecoveryIncidentFailClosedService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryCompletionService.name);
  }

  getLastResult(): RecoveryCompleteResult | null {
    return this.lastResult;
  }

  async complete(command: RecoveryCompleteCommand): Promise<RecoveryCompleteResult> {
    const stages = {
      discovery: this.discovery.getLastResult(),
      lease: this.lease.getLastResult(),
      checkpoint: this.checkpoint.getLastResult(),
      reconcile: this.reconcile.getLastResult(),
      resume: this.resume.getLastResult(),
      admission: this.admission.getLastResult(),
      arming: this.arming.getLastResult(),
      evaluation: this.evaluation.getLastResult(),
      signalIntent: this.signalIntent.getLastResult(),
    };

    const identity =
      stages.arming ??
      stages.lease ??
      (stages.discovery?.candidate !== null && stages.discovery?.candidate !== undefined
        ? {
            workspaceId: stages.discovery.candidate.workspaceId,
            sessionId: stages.discovery.candidate.sessionId,
          }
        : null);

    const session =
      identity === null
        ? null
        : await this.sessions.findById(identity.workspaceId, identity.sessionId);

    const lifecycle =
      identity === null
        ? null
        : await this.runtime.getLifecycle(identity.workspaceId, identity.sessionId);

    const sessionKey = session === null ? null : `${session.workspaceId}::${session.id}`;

    const durable = session === null ? null : await this.recoveryProgress.load(session.id);
    const resumeIntent =
      command.resumeIntent ??
      durable?.resumeIntent ??
      stages.discovery?.recoveringOpen?.resumeIntent ??
      TradingSessionStatus.RUNNING;

    const decided = decideRecoveryCompletion({
      session,
      stages,
      lifecycle,
      controlledTermination: command.controlledTermination === true,
      resumeIntent,
      recordedAt: command.recordedAt,
      alreadyCompleted: sessionKey === null ? false : this.completedSessions.has(sessionKey),
    });

    if (decided.outcome !== 'RECOVERY_COMPLETED' || decided.nextSession === null) {
      if (session !== null && durable?.phase === RecoveryPhase.READY) {
        await this.failClosed.failClosedOnAmbiguity({
          sessionId: session.id,
          workspaceId: session.workspaceId,
          reasonClass: 'completion_blocked_ambiguity',
          failureReason: `completion_blocked:${decided.reason}`,
          recordedAt: command.recordedAt,
        });
      }
      const result = withCompletionFlags(decided, false, false);
      this.lastResult = result;
      this.logResult(result);
      return result;
    }

    const expectedVersion = session!.version;
    const saved = await this.transactions.run(async (transaction) => {
      const persisted = await this.sessions.saveIfVersion(
        decided.nextSession!,
        expectedVersion,
        transaction,
      );
      if (persisted === null) {
        return null;
      }
      await this.outbox.append(
        transaction,
        completionEnvelope(persisted, decided, command),
        command.recordedAt,
      );
      await this.recoveryProgress.finalizeCompleted({
        sessionId: persisted.id,
        sessionStatus: persisted.status,
        recordedAt: command.recordedAt,
        transaction,
      });
      return persisted;
    });

    if (saved === null) {
      const conflict = withCompletionFlags(
        {
          ...decided,
          outcome: 'RECOVERY_COMPLETION_BLOCKED',
          reason: 'lease_mismatch',
          nextSession: null,
          toStatus: null,
          fencingTokenReleased: null,
          ownerIdReleased: null,
        },
        false,
        false,
      );
      this.lastResult = conflict;
      this.logResult(conflict);
      return conflict;
    }

    if (sessionKey !== null) {
      this.completedSessions.add(sessionKey);
    }

    const result = withCompletionFlags(
      {
        ...decided,
        nextSession: saved,
      },
      true,
      true,
    );
    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private logResult(result: RecoveryCompleteResult): void {
    this.logger.info('recovery_completion', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      terminalCause: result.terminalCause,
      unfinishedStage: result.unfinishedStage,
      fromStatus: result.fromStatus,
      toStatus: result.toStatus,
      fencingTokenReleased: result.fencingTokenReleased,
      ownerIdReleased: result.ownerIdReleased,
      leaseReleased: result.leaseReleased,
      completionEventEmitted: result.completionEventEmitted,
      orderCreated: result.orderCreated,
      runtimeRemainsOperational: result.runtimeRemainsOperational,
    });
  }
}

function withCompletionFlags(
  decided: RecoveryCompletionResult,
  leaseReleased: boolean,
  completionEventEmitted: boolean,
): RecoveryCompleteResult {
  return Object.freeze({
    ...decided,
    leaseReleased,
    completionEventEmitted,
  });
}

function completionEnvelope(
  session: NonNullable<RecoveryCompletionResult['nextSession']>,
  decided: RecoveryCompletionResult,
  command: RecoveryCompleteCommand,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(
      `trading-session:${session.id}:recovery-completed:v${session.version}`,
    ),
    eventType: 'TradingSessionRecoveryCompleted',
    schemaVersion: 1,
    aggregateType: 'TradingSession',
    aggregateId: session.id,
    aggregateVersion: session.version,
    workspaceId: session.workspaceId,
    occurredAt: command.recordedAt,
    recordedAt: command.recordedAt,
    ...(command.correlationId !== undefined && command.correlationId.trim() !== ''
      ? { correlationId: command.correlationId.trim() }
      : {}),
    actorId: command.actorId,
    payload: Object.freeze({
      sessionId: session.id,
      deploymentId: session.deploymentId,
      fromStatus: decided.fromStatus,
      toStatus: decided.toStatus,
      terminalCause: decided.terminalCause,
      fencingTokenReleased: decided.fencingTokenReleased,
      ownerIdReleased: decided.ownerIdReleased,
      leaseReleased: true,
      orderCreated: false,
      runtimeRemainsOperational: true,
    }),
  });
}
