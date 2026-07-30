import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
  RuntimeWorkerState,
} from '../../strategy-runtime';
import {
  decideRecoveryEventAdmission,
  type RecoveryEventAdmissionResult,
} from '../domain/recovery-event-admission';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import {
  RECOVERY_EVENT_ADMISSION_POLICY,
  type RecoveryEventAdmissionPolicy,
} from '../ports/recovery-event-admission-policy.port';
import { RecoveryRuntimeResumeService } from './recovery-runtime-resume.service';

/**
 * US245 — deterministic event admission.
 *
 * Enables external semantic event intake only after US244 READY and operational
 * gates pass. This service does not evaluate, emit SignalIntent, create Orders,
 * or persist checkpoints.
 */
@Injectable()
export class RecoveryEventAdmissionService {
  private readonly logger: Logger;
  private lastResult: RecoveryEventAdmissionResult | null = null;
  private readonly admittedSessions = new Set<string>();

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(RecoveryRuntimeResumeService)
    private readonly resume: RecoveryRuntimeResumeService,
    @Inject(RECOVERY_EVENT_ADMISSION_POLICY)
    private readonly policy: RecoveryEventAdmissionPolicy,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryEventAdmissionService.name);
  }

  getLastResult(): RecoveryEventAdmissionResult | null {
    return this.lastResult;
  }

  async enable(nowIso: string): Promise<RecoveryEventAdmissionResult> {
    const ready = this.resume.getLastResult();
    const session =
      ready === null ? null : await this.sessions.findById(ready.workspaceId, ready.sessionId);
    const lifecycle =
      ready === null ? null : await this.runtime.getLifecycle(ready.workspaceId, ready.sessionId);
    const diagnostics =
      ready === null ? null : await this.runtime.getDiagnostics(ready.workspaceId, ready.sessionId);
    const killSwitchActive =
      ready === null
        ? false
        : await this.policy.isKillSwitchActive(ready.workspaceId, ready.sessionId);
    const key = ready === null ? null : `${ready.workspaceId}::${ready.sessionId}`;

    const result = decideRecoveryEventAdmission({
      ready,
      session,
      lifecycle,
      diagnostics,
      killSwitchActive,
      alreadyAdmitted: key === null ? false : this.admittedSessions.has(key),
      nowIso,
    });

    if (result.outcome === 'ADMISSION_BLOCKED') {
      this.lastResult = result;
      this.logResult(result);
      return result;
    }
    const enabledState = result.enabledState;
    if (enabledState === null) {
      throw new Error('event admission result missing enabled state');
    }

    await this.runtime.enableEventAdmission({
      workspaceId: result.workspaceId,
      sessionId: result.sessionId,
      fencingToken: enabledState.fencingToken,
      nowIso,
      reason: 'recovery event admission enabled',
    });

    const admittedLifecycle = await this.runtime.getLifecycle(result.workspaceId, result.sessionId);
    const admittedDiagnostics = await this.runtime.getDiagnostics(
      result.workspaceId,
      result.sessionId,
    );
    if (
      admittedLifecycle.state !== RuntimeWorkerState.EVENT_ADMISSION_ENABLED ||
      !admittedLifecycle.acceptsTicks ||
      admittedDiagnostics.workerState !== RuntimeWorkerState.EVENT_ADMISSION_ENABLED ||
      !admittedDiagnostics.acceptsTicks
    ) {
      throw new Error('runtime did not settle into EVENT_ADMISSION_ENABLED');
    }

    this.admittedSessions.add(key as string);
    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private logResult(result: RecoveryEventAdmissionResult): void {
    this.logger.info('recovery_event_admission', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      operationalState: result.enabledState?.operationalState ?? null,
      workerState: result.enabledState?.workerState ?? null,
      acceptsTicks: result.enabledState?.acceptsTicks ?? null,
      checkpointEventId: result.enabledState?.checkpointEventId ?? null,
      checkpointSequence: result.enabledState?.checkpointSequence ?? null,
      checkpointVersion: result.enabledState?.checkpointVersion ?? null,
      fencingToken: result.enabledState?.fencingToken ?? null,
    });
  }
}
