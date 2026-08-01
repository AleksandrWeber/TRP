import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import {
  advanceDurableRecoveryPhase,
  correlateIncidentOnFailedRecoveryState,
  finalizeDurableRecoveryState,
  openDurableRecoveryState,
  withRecoveryFencingToken,
  type DurableRecoveryState,
  type RecoveryPhase,
} from '../domain/durable-recovery-state';
import type { DiscoveryResumeIntent } from '../domain/force-confirm-recovering';
import {
  RECOVERY_STATE_REPOSITORY,
  type RecoveryStateRepository,
} from '../domain/recovery-state.repository';
import type { TradingSessionStatus } from '../domain/trading-session-status';

/**
 * US292 — thin Trading Session helper for durable RecoveryPhase progress.
 * Does not own Session lifecycle transitions; does not redesign the pipeline.
 */
@Injectable()
export class RecoveryPhaseProgressService {
  private readonly logger: Logger;

  constructor(
    @Inject(RECOVERY_STATE_REPOSITORY)
    private readonly recoveryStates: RecoveryStateRepository,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryPhaseProgressService.name);
  }

  load(sessionId: string): Promise<DurableRecoveryState | null> {
    return this.recoveryStates.loadRecoveryState(sessionId);
  }

  async open(input: {
    sessionId: string;
    workspaceId: string;
    sessionStatus: TradingSessionStatus;
    preRecoveryStatus: TradingSessionStatus;
    resumeIntent: DiscoveryResumeIntent;
    recordedAt: string;
    fencingToken?: number | null;
    transaction?: TransactionContext;
  }): Promise<DurableRecoveryState | null> {
    const prior = await this.recoveryStates.loadRecoveryState(input.sessionId);
    const decided = openDurableRecoveryState({
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      sessionStatus: input.sessionStatus,
      preRecoveryStatus: input.preRecoveryStatus,
      resumeIntent: input.resumeIntent,
      recordedAt: input.recordedAt,
      prior,
      fencingToken: input.fencingToken,
    });
    if (!decided.ok) {
      this.logger.warn('recovery_state_open_rejected', {
        sessionId: input.sessionId,
        reason: decided.reason,
      });
      return null;
    }
    await this.recoveryStates.saveRecoveryState(decided.state, input.transaction);
    this.logger.info('recovery_state_opened', {
      sessionId: decided.state.sessionId,
      phase: decided.state.phase,
      resumeIntent: decided.state.resumeIntent,
      preRecoveryStatus: decided.state.preRecoveryStatus,
      recoveryAttempt: decided.state.recoveryAttempt,
    });
    return decided.state;
  }

  async recordFencingToken(input: {
    sessionId: string;
    fencingToken: number;
    recordedAt: string;
    transaction?: TransactionContext;
  }): Promise<DurableRecoveryState | null> {
    const state = await this.recoveryStates.loadRecoveryState(input.sessionId);
    if (state === null || state.completedAt !== null) {
      return null;
    }
    const next = withRecoveryFencingToken(state, input.fencingToken, input.recordedAt);
    await this.recoveryStates.saveRecoveryState(next, input.transaction);
    return next;
  }

  async advance(input: {
    sessionId: string;
    sessionStatus: TradingSessionStatus;
    to: RecoveryPhase;
    recordedAt: string;
    fencingToken?: number | null;
    lastSemanticEventId?: string | null;
    failureReason?: string | null;
    incidentId?: string | null;
    transaction?: TransactionContext;
  }): Promise<DurableRecoveryState | null> {
    const state = await this.recoveryStates.loadRecoveryState(input.sessionId);
    if (state === null) {
      this.logger.warn('recovery_phase_advance_missing_state', {
        sessionId: input.sessionId,
        to: input.to,
      });
      return null;
    }
    const decided = advanceDurableRecoveryPhase({
      state,
      sessionStatus: input.sessionStatus,
      to: input.to,
      recordedAt: input.recordedAt,
      fencingToken: input.fencingToken,
      lastSemanticEventId: input.lastSemanticEventId,
      failureReason: input.failureReason,
      incidentId: input.incidentId,
    });
    if (!decided.ok) {
      this.logger.warn('recovery_phase_advance_rejected', {
        sessionId: input.sessionId,
        from: state.phase,
        to: input.to,
        reason: decided.reason,
      });
      return null;
    }
    await this.recoveryStates.saveRecoveryState(decided.state, input.transaction);
    this.logger.info('recovery_phase_advanced', {
      sessionId: decided.state.sessionId,
      phase: decided.state.phase,
      lastAttemptedPhase: decided.state.lastAttemptedPhase,
      incidentId: decided.state.incidentId,
    });
    return decided.state;
  }

  /**
   * US293: correlate Incident onto an already-FAILED RecoveryState (no phase move).
   */
  async correlateIncident(input: {
    sessionId: string;
    incidentId: string;
    recordedAt: string;
    failureReason?: string | null;
    transaction?: TransactionContext;
  }): Promise<DurableRecoveryState | null> {
    const state = await this.recoveryStates.loadRecoveryState(input.sessionId);
    if (state === null) {
      return null;
    }
    const decided = correlateIncidentOnFailedRecoveryState({
      state,
      incidentId: input.incidentId,
      recordedAt: input.recordedAt,
      failureReason: input.failureReason,
    });
    if (!decided.ok) {
      this.logger.warn('recovery_incident_correlate_rejected', {
        sessionId: input.sessionId,
        reason: decided.reason,
        phase: state.phase,
      });
      return null;
    }
    await this.recoveryStates.saveRecoveryState(decided.state, input.transaction);
    return decided.state;
  }

  async finalizeCompleted(input: {
    sessionId: string;
    sessionStatus: TradingSessionStatus;
    recordedAt: string;
    transaction?: TransactionContext;
  }): Promise<DurableRecoveryState | null> {
    const state = await this.recoveryStates.loadRecoveryState(input.sessionId);
    if (state === null) {
      return null;
    }
    const decided = finalizeDurableRecoveryState({
      state,
      sessionStatus: input.sessionStatus,
      recordedAt: input.recordedAt,
    });
    if (!decided.ok) {
      this.logger.warn('recovery_state_finalize_rejected', {
        sessionId: input.sessionId,
        reason: decided.reason,
        phase: state.phase,
      });
      return null;
    }
    await this.recoveryStates.saveRecoveryState(decided.state, input.transaction);
    this.logger.info('recovery_state_finalized', {
      sessionId: decided.state.sessionId,
      phase: decided.state.phase,
      completedAt: decided.state.completedAt,
    });
    return decided.state;
  }
}
