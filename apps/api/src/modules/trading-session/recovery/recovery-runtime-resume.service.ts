import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../../strategy-runtime/ports/strategy-runtime.port';
import { RecoveryPhase } from '../domain/durable-recovery-state';
import {
  decideRecoveryRuntimeResume,
  type RecoveryRuntimeResumeResult,
} from '../domain/recovery-runtime-resume';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import { TradingSessionStatus } from '../domain/trading-session-status';
import { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import { RecoveryIncidentFailClosedService } from './recovery-incident-fail-closed.service';
import {
  RecoveryLeaseAcquisitionService,
  resolveRecoveryRuntimeOwnerId,
} from './recovery-lease-acquisition.service';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';
import { RecoveryStateReconciliationService } from './recovery-state-reconciliation.service';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

/**
 * US244 — Deterministic Runtime Resume (+ US292 RECONCILING → READY
 * + US293 fail-closed on resume ambiguity).
 *
 * Hydrates Runtime context after successful recovery while keeping the worker
 * idle. READY here is a recovery operational state, not an ARMED worker state.
 * No ticks, evaluation, SignalIntent, Orders, or checkpoint writes are allowed.
 */
@Injectable()
export class RecoveryRuntimeResumeService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: RecoveryRuntimeResumeResult | null = null;
  private readonly resumedSessions = new Set<string>();

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(RecoveryLeaseAcquisitionService)
    private readonly leases: RecoveryLeaseAcquisitionService,
    @Inject(StartupRecoveryDiscoveryService)
    private readonly discovery: StartupRecoveryDiscoveryService,
    @Inject(RecoveryCheckpointValidationService)
    private readonly checkpoints: RecoveryCheckpointValidationService,
    @Inject(RecoveryStateReconciliationService)
    private readonly reconciliation: RecoveryStateReconciliationService,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(RecoveryIncidentFailClosedService)
    private readonly failClosed: RecoveryIncidentFailClosedService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryRuntimeResumeService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    const discovered = this.discovery.getLastResult() ?? (await this.discovery.discover());
    if (discovered.outcome !== 'recovery_candidate' || discovered.candidate === null) {
      return;
    }
    const lease = await this.resolveLease(discovered.candidate);
    const checkpoint = await this.resolveCheckpoint(lease, discovered.candidate);
    const reconciliation = await this.resolveReconciliation(
      lease,
      checkpoint,
      discovered.candidate,
    );
    await this.resume(lease, checkpoint, reconciliation);
  }

  getLastResult(): RecoveryRuntimeResumeResult | null {
    return this.lastResult;
  }

  async resume(
    lease: Parameters<typeof decideRecoveryRuntimeResume>[0]['lease'],
    checkpoint: Parameters<typeof decideRecoveryRuntimeResume>[0]['checkpoint'],
    reconciliation: Parameters<typeof decideRecoveryRuntimeResume>[0]['reconciliation'],
  ): Promise<RecoveryRuntimeResumeResult> {
    const precheck = this.blockedIfPrerequisitesFail(lease, checkpoint, reconciliation);
    if (precheck) {
      this.lastResult = precheck;
      this.logResult(precheck);
      await this.failClosed.failClosedOnAmbiguity({
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        reasonClass: 'resume_blocked_ambiguity',
        failureReason: `resume_blocked:${precheck.reason}`,
        recordedAt: new Date().toISOString(),
        fencingToken: lease.fencingToken,
      });
      return precheck;
    }

    const key = `${lease.workspaceId}::${lease.sessionId}`;
    const context = await this.runtime.loadContext({
      workspaceId: lease.workspaceId,
      sessionId: lease.sessionId,
      deploymentId: checkpoint.deploymentId,
    });
    const lifecycle = await this.runtime.getLifecycle(lease.workspaceId, lease.sessionId);
    const diagnostics = await this.runtime.getDiagnostics(lease.workspaceId, lease.sessionId);

    const result = decideRecoveryRuntimeResume({
      lease,
      checkpoint,
      reconciliation,
      context,
      lifecycle,
      diagnostics,
      alreadyResumed: this.resumedSessions.has(key),
    });

    const recordedAt = new Date().toISOString();
    if (result.outcome === 'READY') {
      this.resumedSessions.add(key);
      await this.recoveryProgress.advance({
        sessionId: lease.sessionId,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.READY,
        recordedAt,
        fencingToken: lease.fencingToken,
        lastSemanticEventId: checkpoint.checkpoint?.lastProcessedEventId ?? null,
      });
    } else {
      await this.failClosed.failClosedOnAmbiguity({
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        reasonClass: 'resume_blocked_ambiguity',
        failureReason: `resume_blocked:${result.reason}`,
        recordedAt,
        fencingToken: lease.fencingToken,
        lastSemanticEventId: checkpoint.checkpoint?.lastProcessedEventId ?? null,
      });
    }

    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private blockedIfPrerequisitesFail(
    lease: Parameters<typeof decideRecoveryRuntimeResume>[0]['lease'],
    checkpoint: Parameters<typeof decideRecoveryRuntimeResume>[0]['checkpoint'],
    reconciliation: Parameters<typeof decideRecoveryRuntimeResume>[0]['reconciliation'],
  ): RecoveryRuntimeResumeResult | null {
    if (lease.outcome !== 'LEASE_ACQUIRED' || lease.fencingToken === null) {
      return Object.freeze({
        outcome: 'RESUME_BLOCKED',
        reason: 'lease_not_acquired',
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        deploymentId: checkpoint.deploymentId,
        readyState: null,
      });
    }
    if (checkpoint.outcome !== 'VALID_CHECKPOINT' || checkpoint.checkpoint === null) {
      return Object.freeze({
        outcome: 'RESUME_BLOCKED',
        reason: 'checkpoint_not_valid',
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        deploymentId: checkpoint.deploymentId,
        readyState: null,
      });
    }
    if (reconciliation.outcome !== 'RECONCILED') {
      return Object.freeze({
        outcome: 'RESUME_BLOCKED',
        reason: 'reconciliation_failed',
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        deploymentId: checkpoint.deploymentId,
        readyState: null,
      });
    }
    return null;
  }

  private async resolveLease(
    candidate: RecoveryCandidate,
  ): Promise<Parameters<typeof decideRecoveryRuntimeResume>[0]['lease']> {
    const last = this.leases.getLastResult();
    if (
      last !== null &&
      last.outcome === 'LEASE_ACQUIRED' &&
      last.sessionId === candidate.sessionId &&
      last.workspaceId === candidate.workspaceId
    ) {
      return last;
    }
    const nowIso = new Date().toISOString();
    return this.leases.acquire({
      candidate,
      ownerId: resolveRecoveryRuntimeOwnerId(),
      nowIso,
      recordedAt: nowIso,
    });
  }

  private async resolveCheckpoint(
    lease: Parameters<typeof decideRecoveryRuntimeResume>[0]['lease'],
    candidate: RecoveryCandidate,
  ): Promise<Parameters<typeof decideRecoveryRuntimeResume>[0]['checkpoint']> {
    const last = this.checkpoints.getLastResult();
    if (
      last !== null &&
      last.sessionId === candidate.sessionId &&
      last.workspaceId === candidate.workspaceId
    ) {
      return last;
    }
    return this.checkpoints.validateForLease(lease, candidate);
  }

  private async resolveReconciliation(
    lease: Parameters<typeof decideRecoveryRuntimeResume>[0]['lease'],
    checkpoint: Parameters<typeof decideRecoveryRuntimeResume>[0]['checkpoint'],
    candidate: RecoveryCandidate,
  ): Promise<Parameters<typeof decideRecoveryRuntimeResume>[0]['reconciliation']> {
    const last = this.reconciliation.getLastResult();
    if (
      last !== null &&
      last.sessionId === candidate.sessionId &&
      last.workspaceId === candidate.workspaceId &&
      last.outcome === 'RECONCILED'
    ) {
      return last;
    }
    return this.reconciliation.reconcile(lease, checkpoint);
  }

  private logResult(result: RecoveryRuntimeResumeResult): void {
    this.logger.info('recovery_runtime_resume', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      operationalState: result.readyState?.operationalState ?? null,
      workerState: result.readyState?.workerState ?? null,
      acceptsTicks: result.readyState?.acceptsTicks ?? null,
      checkpointEventId: result.readyState?.checkpointEventId ?? null,
      checkpointSequence: result.readyState?.checkpointSequence ?? null,
      fencingToken: result.readyState?.fencingToken ?? null,
    });
  }
}
