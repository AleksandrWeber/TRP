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
 * US241 — Recovery Lease Acquisition.
 *
 * After US240 discovery identifies a candidate, acquire exclusive fenced lease
 * ownership via optimistic CAS. Returns LEASE_ACQUIRED or LEASE_DENIED only.
 *
 * Does not load checkpoints, validate, reconcile, change Session status, or
 * resume Runtime.
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
      return result;
    }

    const saved = await this.transactions.run(async (transaction) => {
      return this.sessions.saveIfVersion(decision.next, decision.expectedVersion, transaction);
    });

    if (saved === null) {
      const result = toAcquisitionResult(decision, command, true);
      this.lastResult = result;
      this.logAcquisition(result, command.candidate);
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
