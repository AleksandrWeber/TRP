import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
  RuntimeWorkerState,
} from '../../strategy-runtime';
import {
  decideRecoveryRuntimeArming,
  type RecoveryRuntimeArmingResult,
} from '../domain/recovery-runtime-arming';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import {
  RECOVERY_EVENT_ADMISSION_POLICY,
  type RecoveryEventAdmissionPolicy,
} from '../ports/recovery-event-admission-policy.port';
import { RecoveryEventAdmissionService } from './recovery-event-admission.service';

/**
 * US246 — deterministic Runtime arming.
 *
 * Transitions EVENT_ADMISSION_ENABLED → ARMED only after operational gates pass.
 * Authorizes future strategy evaluation without evaluating, emitting SignalIntent,
 * creating Orders, or persisting checkpoints.
 */
@Injectable()
export class RecoveryRuntimeArmingService {
  private readonly logger: Logger;
  private lastResult: RecoveryRuntimeArmingResult | null = null;
  private readonly armedSessions = new Set<string>();

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(RecoveryEventAdmissionService)
    private readonly admission: RecoveryEventAdmissionService,
    @Inject(RECOVERY_EVENT_ADMISSION_POLICY)
    private readonly policy: RecoveryEventAdmissionPolicy,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryRuntimeArmingService.name);
  }

  getLastResult(): RecoveryRuntimeArmingResult | null {
    return this.lastResult;
  }

  async arm(nowIso: string): Promise<RecoveryRuntimeArmingResult> {
    const admission = this.admission.getLastResult();
    const session =
      admission === null
        ? null
        : await this.sessions.findById(admission.workspaceId, admission.sessionId);
    const lifecycle =
      admission === null
        ? null
        : await this.runtime.getLifecycle(admission.workspaceId, admission.sessionId);
    const diagnostics =
      admission === null
        ? null
        : await this.runtime.getDiagnostics(admission.workspaceId, admission.sessionId);
    const killSwitchActive =
      admission === null
        ? false
        : await this.policy.isKillSwitchActive(admission.workspaceId, admission.sessionId);
    const key = admission === null ? null : `${admission.workspaceId}::${admission.sessionId}`;

    const result = decideRecoveryRuntimeArming({
      admission,
      session,
      lifecycle,
      diagnostics,
      killSwitchActive,
      alreadyArmed: key === null ? false : this.armedSessions.has(key),
      nowIso,
    });

    if (result.outcome === 'ARMING_BLOCKED') {
      this.lastResult = result;
      this.logResult(result);
      return result;
    }
    const armedState = result.armedState;
    if (armedState === null) {
      throw new Error('runtime arming result missing armed state');
    }

    await this.runtime.arm({
      workspaceId: result.workspaceId,
      sessionId: result.sessionId,
      fencingToken: armedState.fencingToken,
      nowIso,
      reason: 'recovery runtime armed',
    });

    const armedLifecycle = await this.runtime.getLifecycle(result.workspaceId, result.sessionId);
    const armedDiagnostics = await this.runtime.getDiagnostics(
      result.workspaceId,
      result.sessionId,
    );
    if (
      armedLifecycle.state !== RuntimeWorkerState.ARMED ||
      !armedLifecycle.acceptsTicks ||
      armedDiagnostics.workerState !== RuntimeWorkerState.ARMED ||
      !armedDiagnostics.acceptsTicks
    ) {
      throw new Error('runtime did not settle into ARMED');
    }

    this.armedSessions.add(key as string);
    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private logResult(result: RecoveryRuntimeArmingResult): void {
    this.logger.info('recovery_runtime_arming', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      operationalState: result.armedState?.operationalState ?? null,
      workerState: result.armedState?.workerState ?? null,
      acceptsTicks: result.armedState?.acceptsTicks ?? null,
      checkpointEventId: result.armedState?.checkpointEventId ?? null,
      checkpointSequence: result.armedState?.checkpointSequence ?? null,
      checkpointVersion: result.armedState?.checkpointVersion ?? null,
      fencingToken: result.armedState?.fencingToken ?? null,
    });
  }
}
