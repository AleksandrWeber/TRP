import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { hostname } from 'node:os';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { PrismaTransactionService } from '../../../storage/prisma/prisma-transaction.service';
import {
  decideRecoveryLeaseAcquisition,
  toAcquisitionResult,
  type RecoveryLeaseAcquireCommand,
  type RecoveryLeaseAcquisitionResult,
} from '../domain/recovery-lease-acquisition';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { RecoveryIncidentFailClosedService } from './recovery-incident-fail-closed.service';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

/**
 * Resolve a stable-enough process owner id for recovery lease attempts.
 * Prefer explicit env; otherwise pid+hostname (operational identity only).
 */
export function resolveRecoveryRuntimeOwnerId(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.TRP_RUNTIME_OWNER_ID?.trim();
  if (configured) return configured;
  return `api-${process.pid}-${hostname()}`;
}

/**
 * US241 — Recovery Lease Acquisition (+ US292 fencing token
 * + US293 fail-closed Incident when lease acquire is impossible).
 *
 * After US240 discovery identifies a candidate, acquire exclusive fenced lease
 * ownership via optimistic CAS. Returns LEASE_ACQUIRED or LEASE_DENIED only.
 *
 * Does not load checkpoints, validate, reconcile, change Session status on
 * success, or resume Runtime. Denial fail-closes via US293.
 */
@Injectable()
export class RecoveryLeaseAcquisitionService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: RecoveryLeaseAcquisitionResult | null = null;

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(StartupRecoveryDiscoveryService)
    private readonly discovery: StartupRecoveryDiscoveryService,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(RecoveryIncidentFailClosedService)
    private readonly failClosed: RecoveryIncidentFailClosedService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoveryLeaseAcquisitionService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    const discovered = this.discovery.getLastResult() ?? (await this.discovery.discover());
    if (discovered.outcome !== 'recovery_candidate' || discovered.candidate === null) {
      return;
    }
    const nowIso = new Date().toISOString();
    await this.acquire({
      candidate: discovered.candidate,
      ownerId: resolveRecoveryRuntimeOwnerId(),
      nowIso,
      recordedAt: nowIso,
    });
  }

  getLastResult(): RecoveryLeaseAcquisitionResult | null {
    return this.lastResult;
  }

  /**
   * Attempt exclusive recovery lease acquisition for a US240 candidate.
   * Denial paths perform no Session write.
   */
  async acquire(command: RecoveryLeaseAcquireCommand): Promise<RecoveryLeaseAcquisitionResult> {
    const session = await this.sessions.findById(
      command.candidate.workspaceId,
      command.candidate.sessionId,
    );
    const decision = decideRecoveryLeaseAcquisition(session, command);

    if (decision.outcome === 'LEASE_DENIED') {
      const result = toAcquisitionResult(decision, command);
      this.lastResult = result;
      this.logAcquisition(result, command.candidate);
      await this.failClosed.failClosedOnAmbiguity({
        sessionId: command.candidate.sessionId,
        workspaceId: command.candidate.workspaceId,
        reasonClass: 'lease_acquire_impossible',
        failureReason: `lease_denied:${result.reason}`,
        recordedAt: command.recordedAt,
      });
      return result;
    }

    const saved = await this.transactions.run(async (transaction) => {
      const persisted = await this.sessions.saveIfVersion(
        decision.next,
        decision.expectedVersion,
        transaction,
      );
      if (persisted === null) {
        return null;
      }
      if (persisted.lease !== null) {
        await this.recoveryProgress.recordFencingToken({
          sessionId: persisted.id,
          fencingToken: persisted.lease.fencingToken,
          recordedAt: command.recordedAt,
          transaction,
        });
      }
      return persisted;
    });

    if (saved === null) {
      const result = toAcquisitionResult(decision, command, true);
      this.lastResult = result;
      this.logAcquisition(result, command.candidate);
      await this.failClosed.failClosedOnAmbiguity({
        sessionId: command.candidate.sessionId,
        workspaceId: command.candidate.workspaceId,
        reasonClass: 'lease_acquire_impossible',
        failureReason: `lease_denied:${result.reason}`,
        recordedAt: command.recordedAt,
      });
      return result;
    }

    const result = toAcquisitionResult(decision, command);
    this.lastResult = result;
    this.logAcquisition(result, command.candidate);
    return result;
  }

  private logAcquisition(
    result: RecoveryLeaseAcquisitionResult,
    candidate: RecoveryCandidate,
  ): void {
    this.logger.info('recovery_lease_acquisition', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: candidate.deploymentId,
      ownerId: result.ownerId,
      fencingToken: result.fencingToken,
      expiresAt: result.expiresAt,
      expectedVersion: result.expectedVersion ?? null,
      candidateStatus: candidate.status,
    });
  }
}
