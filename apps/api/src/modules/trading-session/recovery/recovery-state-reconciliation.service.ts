import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../../strategy-runtime/ports/strategy-runtime.port';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import type { RecoveryCheckpointValidationResult } from '../domain/recovery-checkpoint-validation';
import {
  reconcileRecoveryState,
  type RecoverySessionSnapshot,
  type RecoveryStateReconciliationResult,
} from '../domain/recovery-state-reconciliation';
import type { RecoveryLeaseAcquisitionResult } from '../domain/recovery-lease-acquisition';
import {
  RECOVERY_RECONCILIATION_PORTS,
  type RecoveryExecutionSnapshot,
  type RecoveryReconciliationPorts,
} from '../ports/recovery-reconciliation.ports';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';
import { RecoveryCheckpointValidationService } from './recovery-checkpoint-validation.service';
import {
  RecoveryLeaseAcquisitionService,
  resolveRecoveryRuntimeOwnerId,
} from './recovery-lease-acquisition.service';

/**
 * US243 — Recovery State Reconciliation.
 *
 * After US241 lease + US242 VALID_CHECKPOINT, collect read-only snapshots from
 * participating contexts and deterministically reconcile the recovery point.
 *
 * Outcomes: RECONCILED | RECONCILIATION_FAILED.
 * No Runtime resume, Order/Accounting mutations, or checkpoint writes.
 */
@Injectable()
export class RecoveryStateReconciliationService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: RecoveryStateReconciliationResult | null = null;

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(RECOVERY_RECONCILIATION_PORTS)
    private readonly ports: RecoveryReconciliationPorts,
    @Inject(StartupRecoveryDiscoveryService)
    private readonly discovery: StartupRecoveryDiscoveryService,
    @Inject(RecoveryLeaseAcquisitionService)
    private readonly leases: RecoveryLeaseAcquisitionService,
    @Inject(RecoveryCheckpointValidationService)
    private readonly checkpoints: RecoveryCheckpointValidationService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryStateReconciliationService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    const discovered = this.discovery.getLastResult() ?? (await this.discovery.discover());
    if (discovered.outcome !== 'recovery_candidate' || discovered.candidate === null) {
      return;
    }
    const lease = await this.resolveLease(discovered.candidate);
    const validation = await this.resolveCheckpoint(lease, discovered.candidate);
    await this.reconcile(lease, validation);
  }

  getLastResult(): RecoveryStateReconciliationResult | null {
    return this.lastResult;
  }

  async reconcile(
    lease: RecoveryLeaseAcquisitionResult,
    validation: RecoveryCheckpointValidationResult,
  ): Promise<RecoveryStateReconciliationResult> {
    if (
      lease.outcome !== 'LEASE_ACQUIRED' ||
      lease.fencingToken === null ||
      validation.outcome !== 'VALID_CHECKPOINT' ||
      validation.checkpoint === null
    ) {
      const result: RecoveryStateReconciliationResult = Object.freeze({
        outcome: 'RECONCILIATION_FAILED',
        failedContext: 'prerequisite',
        reason: 'requires LEASE_ACQUIRED and VALID_CHECKPOINT',
        sessionId: lease.sessionId,
        workspaceId: lease.workspaceId,
        recoveryPointEventId: validation.checkpoint?.lastProcessedEventId ?? '',
        mismatches: Object.freeze(['prerequisite:requires LEASE_ACQUIRED and VALID_CHECKPOINT']),
      });
      this.lastResult = result;
      this.logResult(result);
      return result;
    }

    const leased = {
      sessionId: lease.sessionId,
      workspaceId: lease.workspaceId,
      deploymentId: validation.deploymentId,
      ownerId: lease.ownerId,
      fencingToken: lease.fencingToken,
    };
    const checkpoint = validation.checkpoint;

    const sessionRow = await this.sessions.findById(leased.workspaceId, leased.sessionId);
    const session: RecoverySessionSnapshot | null = sessionRow
      ? Object.freeze({
          sessionId: sessionRow.id,
          workspaceId: sessionRow.workspaceId,
          deploymentId: sessionRow.deploymentId,
          paperAccountId: sessionRow.paperAccountId,
          status: sessionRow.status,
          fencingToken: sessionRow.lease?.fencingToken ?? null,
        })
      : null;

    const intents = await this.runtime.listSignalIntents(leased.workspaceId, leased.sessionId);
    const orders = await this.ports.listOrdersBySession(leased.workspaceId, leased.sessionId);
    const execution: RecoveryExecutionSnapshot[] = [];
    for (const order of [...orders].sort((a, b) => a.orderId.localeCompare(b.orderId))) {
      execution.push(await this.ports.reconcileExecution(leased.workspaceId, order.orderId));
    }
    const accounting = session
      ? await this.ports.readAccounting(leased.workspaceId, session.paperAccountId)
      : null;
    const risk = await this.ports.readRisk(leased.workspaceId, leased.sessionId);

    const result = reconcileRecoveryState({
      leased,
      checkpoint,
      session,
      runtime: {
        checkpointEventId: checkpoint.lastProcessedEventId,
        checkpointStreamId: checkpoint.streamId,
        checkpointSequence: checkpoint.sequence,
        deploymentId: checkpoint.deploymentId,
        intents: intents.map((intent) =>
          Object.freeze({
            intentId: intent.id,
            sessionId: intent.sessionId,
            deploymentId: intent.deploymentId,
            eventId: intent.marketCheckpoint.eventId,
            streamId: intent.marketCheckpoint.streamId,
            sequence: intent.marketCheckpoint.sequence,
          }),
        ),
      },
      orders,
      execution,
      accounting,
      risk,
    });

    this.lastResult = result;
    this.logResult(result);
    return result;
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
      ownerId: this.leases.getLastResult()?.ownerId ?? resolveRecoveryRuntimeOwnerId(),
      nowIso,
      recordedAt: nowIso,
    });
  }

  private async resolveCheckpoint(
    lease: RecoveryLeaseAcquisitionResult,
    candidate: RecoveryCandidate,
  ): Promise<RecoveryCheckpointValidationResult> {
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

  private logResult(result: RecoveryStateReconciliationResult): void {
    this.logger.info('recovery_state_reconciliation', {
      outcome: result.outcome,
      failedContext: result.failedContext,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      recoveryPointEventId: result.recoveryPointEventId || null,
      mismatches: [...result.mismatches],
    });
  }
}
