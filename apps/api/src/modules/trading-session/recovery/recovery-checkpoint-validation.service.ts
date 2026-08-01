import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../../strategy-runtime/ports/strategy-runtime.port';
import { RecoveryPhase } from '../domain/durable-recovery-state';
import type { RecoveryLeaseAcquisitionResult } from '../domain/recovery-lease-acquisition';
import {
  toLeasedRecoverySession,
  validateRecoveryCheckpoint,
  type RecoveryCheckpointValidationResult,
} from '../domain/recovery-checkpoint-validation';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import { TradingSessionStatus } from '../domain/trading-session-status';
import {
  RecoveryLeaseAcquisitionService,
  resolveRecoveryRuntimeOwnerId,
} from './recovery-lease-acquisition.service';
import { RecoveryIncidentFailClosedService } from './recovery-incident-fail-closed.service';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

/**
 * US242 — Recovery Checkpoint Discovery & Validation (+ US292 phase advances
 * + US293 fail-closed Incident on corruption / invalid checkpoint).
 *
 * After US241 lease acquisition succeeds, load the latest strategy checkpoint
 * via StrategyRuntimePort and validate integrity + Session consistency.
 *
 * Outcomes: VALID_CHECKPOINT | NO_CHECKPOINT | INVALID_CHECKPOINT.
 * Read-only for checkpoints: does not mutate checkpoints, resume Runtime, or
 * reconcile Orders. Advances durable RecoveryPhase per E17 §4.5 mapping.
 */
@Injectable()
export class RecoveryCheckpointValidationService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: RecoveryCheckpointValidationResult | null = null;

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(RecoveryLeaseAcquisitionService)
    private readonly leases: RecoveryLeaseAcquisitionService,
    @Inject(StartupRecoveryDiscoveryService)
    private readonly discovery: StartupRecoveryDiscoveryService,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(RecoveryIncidentFailClosedService)
    private readonly failClosed: RecoveryIncidentFailClosedService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryCheckpointValidationService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    const discovered = this.discovery.getLastResult() ?? (await this.discovery.discover());
    if (discovered.outcome !== 'recovery_candidate' || discovered.candidate === null) {
      return;
    }
    const lease = await this.resolveLease(discovered.candidate);
    await this.validateForLease(lease, discovered.candidate);
  }

  getLastResult(): RecoveryCheckpointValidationResult | null {
    return this.lastResult;
  }

  /**
   * Discover + validate the latest checkpoint for a leased recovery Session.
   */
  async validateForLease(
    lease: Parameters<typeof toLeasedRecoverySession>[0],
    candidate: RecoveryCandidate,
  ): Promise<RecoveryCheckpointValidationResult> {
    const leased = toLeasedRecoverySession(lease, candidate);
    if (leased === null) {
      const result = validateRecoveryCheckpoint(null, null);
      this.lastResult = result;
      this.logValidation(result);
      return result;
    }

    const recordedAt = new Date().toISOString();
    let checkpoint;
    try {
      checkpoint = await this.runtime.loadCheckpoint(leased.workspaceId, leased.sessionId);
    } catch {
      const result: RecoveryCheckpointValidationResult = Object.freeze({
        outcome: 'INVALID_CHECKPOINT',
        reason: 'load_failed',
        sessionId: leased.sessionId,
        workspaceId: leased.workspaceId,
        deploymentId: leased.deploymentId,
        fencingToken: leased.fencingToken,
        checkpoint: null,
      });
      this.lastResult = result;
      this.logValidation(result);
      await this.failPhase(
        leased.sessionId,
        leased.workspaceId,
        leased.fencingToken,
        recordedAt,
        'load_failed',
      );
      return result;
    }

    // loadCheckpoint is the sole current row per Session — deterministic "latest".
    // Lease + assembly load committed → VALIDATING; validation passed → RECONCILING.
    await this.recoveryProgress.advance({
      sessionId: leased.sessionId,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.VALIDATING,
      recordedAt,
      fencingToken: leased.fencingToken,
      lastSemanticEventId: checkpoint?.lastProcessedEventId ?? null,
    });

    const result = validateRecoveryCheckpoint(leased, checkpoint);
    this.lastResult = result;
    this.logValidation(result);

    if (result.outcome === 'VALID_CHECKPOINT') {
      await this.recoveryProgress.advance({
        sessionId: leased.sessionId,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.RECONCILING,
        recordedAt,
        fencingToken: leased.fencingToken,
        lastSemanticEventId: result.checkpoint?.lastProcessedEventId ?? null,
      });
    } else {
      await this.failPhase(
        leased.sessionId,
        leased.workspaceId,
        leased.fencingToken,
        recordedAt,
        result.reason || result.outcome,
      );
    }
    return result;
  }

  private async failPhase(
    sessionId: string,
    workspaceId: string,
    fencingToken: number,
    recordedAt: string,
    failureReason: string,
  ): Promise<void> {
    await this.failClosed.failClosedOnAmbiguity({
      sessionId,
      workspaceId,
      reasonClass: 'checkpoint_corruption',
      failureReason: `checkpoint:${failureReason}`,
      recordedAt,
      fencingToken,
    });
  }

  private async resolveLease(
    candidate: RecoveryCandidate,
  ): Promise<RecoveryLeaseAcquisitionResult> {
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

  private logValidation(result: RecoveryCheckpointValidationResult): void {
    this.logger.info('recovery_checkpoint_validation', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId || undefined,
      workspaceId: result.workspaceId || undefined,
      deploymentId: result.deploymentId || undefined,
      fencingToken: result.fencingToken,
      checkpointId: result.checkpoint?.checkpointId ?? null,
      lastProcessedEventId: result.checkpoint?.lastProcessedEventId ?? null,
      checkpointVersion: result.checkpoint?.version ?? null,
      runtimeVersion: result.checkpoint?.runtimeVersion ?? null,
    });
  }
}
