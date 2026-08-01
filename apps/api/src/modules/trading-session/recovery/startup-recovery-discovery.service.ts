import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { PrismaTransactionService } from '../../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../../event-processing';
import { TransactionalOutboxAppender } from '../../event-processing/transactional-outbox-appender';
import {
  decideForceConfirmRecovering,
  type RecoveringOpenResult,
} from '../domain/force-confirm-recovering';
import { recoveryEligibleStatusValues } from '../domain/recovery-eligibility';
import {
  discoverStartupRecoveryCandidate,
  toRecoveryCandidate,
  type StartupRecoveryDiscoveryResult,
} from '../domain/startup-recovery-discovery';
import type { TradingSession } from '../domain/trading-session';
import { TradingSessionStatus } from '../domain/trading-session-status';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';

const STARTUP_RECOVERY_ACTOR_ID = 'system:startup-recovery';

/**
 * US240 — Startup Recovery Discovery + US290 force/confirm `RECOVERING` open
 * + US292 durable RecoveryState open (`phase = RECOVERING`).
 *
 * On application bootstrap, inspects persistent Trading Sessions, evaluates
 * recovery eligibility, selects at most one deterministic candidate, then
 * forces or confirms Session status `RECOVERING` with recorded resume intent
 * and opens durable RecoveryState progress.
 *
 * Does not acquire leases, load checkpoints, reconcile, resume/arm Runtime,
 * evaluate strategies, or emit SignalIntent.
 */
@Injectable()
export class StartupRecoveryDiscoveryService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: StartupRecoveryDiscoveryResult | null = null;

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(RecoveryPhaseProgressService)
    private readonly recoveryProgress: RecoveryPhaseProgressService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(StartupRecoveryDiscoveryService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.discover();
  }

  /** Last discovery + recovering-open result from bootstrap or an explicit `discover()` call. */
  getLastResult(): StartupRecoveryDiscoveryResult | null {
    return this.lastResult;
  }

  /**
   * Inspect persistent Sessions, select at most one recovery candidate, then
   * force/confirm `RECOVERING` (US290) with durable RecoveryState open (US292).
   */
  async discover(
    recordedAt: string = new Date().toISOString(),
  ): Promise<StartupRecoveryDiscoveryResult> {
    const statuses = recoveryEligibleStatusValues();
    const sessions = await this.sessions.findByStatuses(statuses);
    const selected = discoverStartupRecoveryCandidate(sessions);

    if (selected.outcome === 'no_recovery_required' || selected.candidate === null) {
      const recoveringOpen = decideForceConfirmRecovering({
        discovery: selected,
        session: null,
        recordedAt,
        priorOpen: this.lastResult?.recoveringOpen ?? null,
      });
      const result = Object.freeze({
        ...selected,
        recoveringOpen,
      });
      this.lastResult = result;
      this.logDiscovery(result);
      return result;
    }

    const session = await this.sessions.findById(
      selected.candidate.workspaceId,
      selected.candidate.sessionId,
    );
    const priorOpen = await this.resolvePriorOpen(selected.candidate.sessionId);
    const decision = decideForceConfirmRecovering({
      discovery: selected,
      session,
      recordedAt,
      priorOpen,
    });

    const recoveringOpen = await this.persistRecoveringOpen(decision, session, recordedAt);
    const openedSession =
      recoveringOpen.action === 'forced'
        ? recoveringOpen.nextSession
        : recoveringOpen.action === 'confirmed'
          ? session
          : null;

    const result = Object.freeze({
      ...selected,
      candidate: openedSession !== null ? toRecoveryCandidate(openedSession) : selected.candidate,
      recoveringOpen,
    });
    this.lastResult = result;
    this.logDiscovery(result);
    return result;
  }

  private async resolvePriorOpen(sessionId: string): Promise<RecoveringOpenResult | null> {
    if (
      this.lastResult?.recoveringOpen !== undefined &&
      this.lastResult.recoveringOpen !== null &&
      this.lastResult.recoveringOpen.sessionId === sessionId &&
      (this.lastResult.recoveringOpen.action === 'forced' ||
        this.lastResult.recoveringOpen.action === 'confirmed')
    ) {
      return this.lastResult.recoveringOpen;
    }

    const durable = await this.recoveryProgress.load(sessionId);
    if (durable === null || durable.completedAt !== null) {
      return null;
    }

    return Object.freeze({
      action: 'confirmed' as const,
      reason: 'durable_recovery_state',
      sessionId: durable.sessionId,
      workspaceId: durable.workspaceId,
      deploymentId: null,
      preRecoveryStatus: durable.preRecoveryStatus,
      resumeIntent: durable.resumeIntent,
      fromStatus: TradingSessionStatus.RECOVERING,
      toStatus: TradingSessionStatus.RECOVERING,
      transitioned: false,
      nextSession: null,
      expectedVersion: null,
      evaluationAdmitted: false as const,
      signalIntentEmitted: false as const,
    });
  }

  private async persistRecoveringOpen(
    decision: RecoveringOpenResult,
    session: TradingSession | null,
    recordedAt: string,
  ): Promise<RecoveringOpenResult> {
    if (decision.action === 'forced' && decision.nextSession !== null) {
      const expectedVersion = decision.expectedVersion!;
      const saved = await this.transactions.run(async (transaction) => {
        const persisted = await this.sessions.saveIfVersion(
          decision.nextSession!,
          expectedVersion,
          transaction,
        );
        if (persisted === null) {
          return null;
        }
        await this.outbox.append(
          transaction,
          recoveringOpenEnvelope(persisted, decision, recordedAt),
          recordedAt,
        );
        if (decision.resumeIntent !== null && decision.preRecoveryStatus !== null) {
          await this.recoveryProgress.open({
            sessionId: persisted.id,
            workspaceId: persisted.workspaceId,
            sessionStatus: persisted.status,
            preRecoveryStatus: decision.preRecoveryStatus,
            resumeIntent: decision.resumeIntent,
            recordedAt,
            transaction,
          });
        }
        return persisted;
      });

      if (saved === null) {
        return Object.freeze({
          ...decision,
          action: 'blocked' as const,
          reason: 'version_conflict',
          transitioned: false,
          nextSession: null,
          toStatus: null,
        });
      }

      return Object.freeze({
        ...decision,
        nextSession: saved,
      });
    }

    if (decision.action === 'confirmed' && session !== null) {
      await this.transactions.run(async (transaction) => {
        await this.outbox.append(
          transaction,
          recoveringOpenEnvelope(session, decision, recordedAt),
          recordedAt,
        );
        if (decision.resumeIntent !== null && decision.preRecoveryStatus !== null) {
          await this.recoveryProgress.open({
            sessionId: session.id,
            workspaceId: session.workspaceId,
            sessionStatus: session.status,
            preRecoveryStatus: decision.preRecoveryStatus,
            resumeIntent: decision.resumeIntent,
            recordedAt,
            transaction,
          });
        }
      });
      return decision;
    }

    return decision;
  }

  private logDiscovery(result: StartupRecoveryDiscoveryResult): void {
    const open = result.recoveringOpen;
    if (result.outcome === 'no_recovery_required') {
      this.logger.info('startup_recovery_discovery', {
        outcome: result.outcome,
        eligibleCount: 0,
        candidateSessionId: null,
        eligibleSessionIds: [],
        recoveringOpenAction: open?.action ?? null,
        recoveringOpenReason: open?.reason ?? null,
      });
      return;
    }

    this.logger.info('startup_recovery_discovery', {
      outcome: result.outcome,
      eligibleCount: result.eligibleCount,
      candidateSessionId: result.candidate?.sessionId ?? null,
      candidateWorkspaceId: result.candidate?.workspaceId ?? null,
      candidateStatus: result.candidate?.status ?? null,
      candidateCreatedAt: result.candidate?.createdAt ?? null,
      eligibleSessionIds: [...result.eligibleSessionIds],
      recoveringOpenAction: open?.action ?? null,
      recoveringOpenReason: open?.reason ?? null,
      preRecoveryStatus: open?.preRecoveryStatus ?? null,
      resumeIntent: open?.resumeIntent ?? null,
      recoveringTransitioned: open?.transitioned ?? null,
      evaluationAdmitted: open?.evaluationAdmitted ?? false,
      signalIntentEmitted: open?.signalIntentEmitted ?? false,
    });
  }
}

function recoveringOpenEnvelope(
  session: TradingSession,
  open: RecoveringOpenResult,
  recordedAt: string,
): DurableEventEnvelope {
  const eventType =
    open.action === 'confirmed' ? 'TradingSessionRecoveringConfirmed' : 'TradingSessionRecovering';
  return Object.freeze({
    eventId: toDurableEventId(
      `trading-session:${session.id}:${eventType}:v${session.version}:${open.action}`,
    ),
    eventType,
    schemaVersion: 1,
    aggregateType: 'TradingSession',
    aggregateId: session.id,
    aggregateVersion: session.version,
    workspaceId: session.workspaceId,
    occurredAt: recordedAt,
    recordedAt,
    actorId: STARTUP_RECOVERY_ACTOR_ID,
    payload: Object.freeze({
      sessionId: session.id,
      paperAccountId: session.paperAccountId,
      deploymentId: session.deploymentId,
      origin: session.origin,
      action: open.action,
      reason: open.reason,
      fromStatus: open.fromStatus,
      toStatus: open.toStatus,
      preRecoveryStatus: open.preRecoveryStatus,
      resumeIntent: open.resumeIntent,
      transitioned: open.transitioned,
      evaluationAdmitted: false,
      signalIntentEmitted: false,
    }),
  });
}
