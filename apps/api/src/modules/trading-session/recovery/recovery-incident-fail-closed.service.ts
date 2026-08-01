import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { PrismaTransactionService } from '../../../storage/prisma/prisma-transaction.service';
import { RecoveryPhase } from '../domain/durable-recovery-state';
import {
  createRecoveryIncident,
  type RecoveryIncident,
  type RecoveryIncidentReasonClass,
} from '../domain/recovery-incident';
import {
  RECOVERY_INCIDENT_REPOSITORY,
  type RecoveryIncidentRepository,
} from '../domain/recovery-incident.repository';
import { clearLease, transitionSession, type TradingSession } from '../domain/trading-session';
import { TradingSessionStatus } from '../domain/trading-session-status';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';

export type RecoveryFailClosedResult = Readonly<{
  outcome: 'FAILED_CLOSED' | 'ALREADY_FAILED_CLOSED' | 'BLOCKED';
  reason: string;
  incident: RecoveryIncident | null;
  sessionId: string;
  workspaceId: string;
  sessionStatus: TradingSessionStatus | null;
  recoveryPhase: RecoveryPhase | null;
  /** US293 forbidden: never true from this service. */
  evaluationAdmitted: false;
  signalIntentEmitted: false;
}>;

/**
 * US293 — Durable Incident on recovery ambiguity + fail-closed Session terminality.
 *
 * Binding persistence order:
 *   Ambiguity detected → Incident persisted → RecoveryState FAILED+incidentId
 *   → TradingSession FAILED
 *
 * Must never leave a FAILED TradingSession without a persisted Incident.
 * Does not resolve/clear Incident, retry Recovery, restart Runtime, or implement E19.
 */
@Injectable()
export class RecoveryIncidentFailClosedService {
  private readonly logger: Logger;

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(RECOVERY_INCIDENT_REPOSITORY)
    private readonly incidents: RecoveryIncidentRepository,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryIncidentFailClosedService.name);
  }

  /**
   * Fail closed on an approved ambiguity/corruption class.
   * Idempotent when Session is already FAILED with a correlated Incident.
   */
  async failClosedOnAmbiguity(input: {
    sessionId: string;
    workspaceId: string;
    reasonClass: RecoveryIncidentReasonClass;
    failureReason: string;
    recordedAt: string;
    fencingToken?: number | null;
    lastSemanticEventId?: string | null;
  }): Promise<RecoveryFailClosedResult> {
    const existingState = await this.recoveryProgress.load(input.sessionId);
    const existingSession = await this.sessions.findById(input.workspaceId, input.sessionId);
    const existingOpen = await this.incidents.loadOpenIncidentBySession(input.sessionId);

    if (
      existingSession?.status === TradingSessionStatus.FAILED &&
      existingState?.phase === RecoveryPhase.FAILED &&
      existingState.incidentId !== null
    ) {
      const incident =
        existingOpen?.incidentId === existingState.incidentId
          ? existingOpen
          : ((await this.incidents.loadIncident(existingState.incidentId)) ?? existingOpen);
      this.logger.info('recovery_fail_closed_idempotent', {
        sessionId: input.sessionId,
        incidentId: existingState.incidentId,
      });
      return Object.freeze({
        outcome: 'ALREADY_FAILED_CLOSED',
        reason: 'already_failed_with_incident',
        incident,
        sessionId: input.sessionId,
        workspaceId: input.workspaceId,
        sessionStatus: TradingSessionStatus.FAILED,
        recoveryPhase: RecoveryPhase.FAILED,
        evaluationAdmitted: false as const,
        signalIntentEmitted: false as const,
      });
    }

    if (existingSession === null) {
      return Object.freeze({
        outcome: 'BLOCKED',
        reason: 'session_not_found',
        incident: null,
        sessionId: input.sessionId,
        workspaceId: input.workspaceId,
        sessionStatus: null,
        recoveryPhase: existingState?.phase ?? null,
        evaluationAdmitted: false as const,
        signalIntentEmitted: false as const,
      });
    }

    if (
      existingSession.status !== TradingSessionStatus.RECOVERING &&
      existingSession.status !== TradingSessionStatus.FAILED
    ) {
      return Object.freeze({
        outcome: 'BLOCKED',
        reason: `session_not_recovering:${existingSession.status}`,
        incident: null,
        sessionId: input.sessionId,
        workspaceId: input.workspaceId,
        sessionStatus: existingSession.status,
        recoveryPhase: existingState?.phase ?? null,
        evaluationAdmitted: false as const,
        signalIntentEmitted: false as const,
      });
    }

    const incident = createRecoveryIncident({
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      recoveryId: existingState?.recoveryId ?? null,
      recoveryAttempt: existingState?.recoveryAttempt ?? null,
      reasonClass: input.reasonClass,
      failureReason: input.failureReason,
      createdAt: input.recordedAt,
      incidentId: existingOpen?.incidentId ?? existingState?.incidentId ?? undefined,
    });

    const committed = await this.transactions.run(async (transaction) => {
      // 1) Incident persisted
      await this.incidents.saveIncident(incident, transaction);

      // 2) RecoveryState updated (FAILED + incident reference)
      const failedState =
        existingState !== null && existingState.phase === RecoveryPhase.FAILED
          ? await this.recoveryProgress.correlateIncident({
              sessionId: input.sessionId,
              incidentId: incident.incidentId,
              recordedAt: input.recordedAt,
              failureReason: input.failureReason,
              transaction,
            })
          : await this.recoveryProgress.advance({
              sessionId: input.sessionId,
              sessionStatus: TradingSessionStatus.RECOVERING,
              to: RecoveryPhase.FAILED,
              recordedAt: input.recordedAt,
              fencingToken: input.fencingToken,
              lastSemanticEventId: input.lastSemanticEventId,
              failureReason: input.failureReason,
              incidentId: incident.incidentId,
              transaction,
            });

      // 3) TradingSession transitioned to FAILED (never without persisted Incident)
      let nextSession: TradingSession = existingSession;
      if (existingSession.status === TradingSessionStatus.RECOVERING) {
        nextSession = clearLease(
          transitionSession(existingSession, TradingSessionStatus.FAILED, input.recordedAt, {
            failureReason: input.failureReason,
          }),
        );
        nextSession = await this.sessions.save(nextSession, transaction);
      }

      return Object.freeze({ incident, failedState, session: nextSession });
    });

    this.logger.info('recovery_fail_closed', {
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      incidentId: committed.incident.incidentId,
      reasonClass: input.reasonClass,
      failureReason: input.failureReason,
      recoveryPhase: committed.failedState?.phase ?? null,
      sessionStatus: committed.session.status,
    });

    return Object.freeze({
      outcome: 'FAILED_CLOSED',
      reason: input.failureReason,
      incident: committed.incident,
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      sessionStatus: committed.session.status,
      recoveryPhase: committed.failedState?.phase ?? existingState?.phase ?? null,
      evaluationAdmitted: false as const,
      signalIntentEmitted: false as const,
    });
  }
}
