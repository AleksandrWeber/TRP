import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import { recoveryEligibleStatusValues } from '../domain/recovery-eligibility';
import {
  discoverStartupRecoveryCandidate,
  type StartupRecoveryDiscoveryResult,
} from '../domain/startup-recovery-discovery';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../persistence/trading-session.repository';

/**
 * US240 — Startup Recovery Discovery.
 *
 * On application bootstrap, inspects persistent Trading Sessions, evaluates
 * recovery eligibility, and returns exactly one deterministic candidate or
 * `no_recovery_required`.
 *
 * Discovery only: does not transition Sessions, acquire leases, load
 * checkpoints, reconcile, resume Runtime, or execute Orders.
 */
@Injectable()
export class StartupRecoveryDiscoveryService implements OnApplicationBootstrap {
  private readonly logger: Logger;
  private lastResult: StartupRecoveryDiscoveryResult | null = null;

  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(StartupRecoveryDiscoveryService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.discover();
  }

  /** Last discovery result from bootstrap or an explicit `discover()` call. */
  getLastResult(): StartupRecoveryDiscoveryResult | null {
    return this.lastResult;
  }

  /**
   * Inspect persistent Sessions and select at most one recovery candidate.
   * Idempotent and side-effect free aside from structured logging.
   */
  async discover(): Promise<StartupRecoveryDiscoveryResult> {
    const statuses = recoveryEligibleStatusValues();
    const sessions = await this.sessions.findByStatuses(statuses);
    const result = discoverStartupRecoveryCandidate(sessions);
    this.lastResult = result;
    this.logDiscovery(result);
    return result;
  }

  private logDiscovery(result: StartupRecoveryDiscoveryResult): void {
    if (result.outcome === 'no_recovery_required') {
      this.logger.info('startup_recovery_discovery', {
        outcome: result.outcome,
        eligibleCount: 0,
        candidateSessionId: null,
        eligibleSessionIds: [],
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
    });
  }
}
