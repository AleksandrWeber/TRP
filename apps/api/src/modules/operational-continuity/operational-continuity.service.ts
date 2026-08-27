/**
 * W3-O01-d / W3-O02-d — Operational Continuity service.
 *
 * Extends recovered analytical owners with readiness / graceful degradation projection.
 * W3-O02-d adds Notification Durable Queue operational continuity (derived).
 * Recovery itself remains W3-O01-c / W3-O02-c only. No new persistence / BC / HA / monitoring.
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  getAnalyticalOwnerBootOutcome,
  listAnalyticalOwnerBootOutcomes,
  recordAnalyticalOwnerBootOutcome,
  resetAnalyticalOwnerBootOutcomes,
  type AnalyticalOwnerBootOutcome,
} from '../../persistence/analytical-owner-continuity-status';
import {
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../../persistence/analytical-restart-recovery';
import { getNotificationQueueContinuityRecord } from '../notification-delivery/domain/notification-queue-continuity-status';
import { buildNotificationQueueContinuityProjection } from '../notification-delivery/domain/notification-queue-operational-continuity';
import { OperationalContinuityAudit } from './operational-continuity-audit';
import {
  buildPlatformOperationalProjection,
  evaluateOwnerOperationalStates,
  type PlatformOperationalProjection,
} from './operational-readiness';

@Injectable()
export class OperationalContinuityService implements OnApplicationBootstrap {
  private projection: PlatformOperationalProjection;
  private recoveryStartedAt: number | null = null;
  private finalized = false;

  constructor(private readonly audit: OperationalContinuityAudit) {
    this.recoveryStartedAt = Date.now();
    this.projection = buildPlatformOperationalProjection({
      owners: evaluateOwnerOperationalStates({
        bootByOwner: new Map(),
        recovering: true,
      }),
      recoveryTimestamp: null,
      recoveryDurationMs: null,
      notificationQueue: buildNotificationQueueContinuityProjection({
        recovering: true,
        ownerBoot: 'ready',
        continuity: null,
      }),
    });
  }

  /**
   * Runs after Nest modules finish constructing (including W3-O01-c / W3-O02-c hydrates).
   * Continuity begins only after successful recovery path completion.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.finalized) {
      await this.finalizeFromBootRegistry();
    }
  }

  /** Read-only platform readiness projection (includes Notification Queue continuity). */
  getProjection(): PlatformOperationalProjection {
    return this.projection;
  }

  /**
   * Test / controlled evaluation: set boot outcomes then finalize.
   * Production path uses Nest OnModuleInit after hydrates.
   */
  async applyBootOutcomesForTest(
    outcomes: ReadonlyArray<{
      owner: W3O01CRecoveryOwner;
      outcome: AnalyticalOwnerBootOutcome;
      reason?: string;
    }>,
  ): Promise<PlatformOperationalProjection> {
    resetAnalyticalOwnerBootOutcomes();
    for (const row of outcomes) {
      recordAnalyticalOwnerBootOutcome(row.owner, row.outcome, row.reason);
    }
    return this.finalizeFromBootRegistry();
  }

  private buildNotificationQueueView(input: {
    recovering: boolean;
    ownerBoot: AnalyticalOwnerBootOutcome;
  }) {
    return buildNotificationQueueContinuityProjection({
      recovering: input.recovering,
      ownerBoot: input.ownerBoot,
      continuity: getNotificationQueueContinuityRecord(),
    });
  }

  private async finalizeFromBootRegistry(): Promise<PlatformOperationalProjection> {
    this.recoveryStartedAt = this.recoveryStartedAt ?? Date.now();
    this.finalized = false;

    const bootByOwner = new Map<W3O01CRecoveryOwner, AnalyticalOwnerBootOutcome>();
    const bootReasons = new Map<W3O01CRecoveryOwner, string | undefined>();

    for (const owner of W3_O01_C_RECOVERY_ORDER) {
      const recorded = getAnalyticalOwnerBootOutcome(owner);
      if (recorded) {
        bootByOwner.set(owner, recorded.outcome);
        bootReasons.set(owner, recorded.reason);
      } else {
        bootByOwner.set(owner, 'ready');
      }
    }

    const notificationOwnerBoot = bootByOwner.get('notification-delivery') ?? 'ready';

    this.projection = buildPlatformOperationalProjection({
      owners: evaluateOwnerOperationalStates({
        bootByOwner,
        bootReasons,
        recovering: true,
      }),
      recoveryTimestamp: null,
      recoveryDurationMs: null,
      notificationQueue: this.buildNotificationQueueView({
        recovering: true,
        ownerBoot: notificationOwnerBoot,
      }),
    });

    const owners = evaluateOwnerOperationalStates({
      bootByOwner,
      bootReasons,
      recovering: false,
    });
    const recoveryTimestamp = new Date().toISOString();
    const recoveryDurationMs = Math.max(0, Date.now() - (this.recoveryStartedAt ?? Date.now()));
    const notificationQueueBase = this.buildNotificationQueueView({
      recovering: false,
      ownerBoot: notificationOwnerBoot,
    });
    const notificationQueue = Object.freeze({
      ...notificationQueueBase,
      recoveryTimestamp:
        notificationQueueBase.recoveryTimestamp ??
        (notificationQueueBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        notificationQueueBase.recoveryDurationMs ??
        (notificationQueueBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    this.projection = buildPlatformOperationalProjection({
      owners,
      recoveryTimestamp,
      recoveryDurationMs,
      notificationQueue,
    });
    this.finalized = true;

    for (const owner of owners) {
      if (owner.state === 'Ready' || owner.state === 'Degraded' || owner.state === 'Unavailable') {
        await this.audit.recordOwnerState({
          owner: owner.owner,
          state: owner.state,
          reason: owner.reason,
        });
      }
    }
    await this.audit.recordRecoveryCompleted({
      platformState: this.projection.platformState,
      recoveryDurationMs,
      unavailableOwners: this.projection.unavailableOwners,
      degradedOwners: this.projection.degradedOwners,
    });

    return this.projection;
  }

  /** Diagnostics for tests. */
  isFinalized(): boolean {
    return this.finalized;
  }

  /** Diagnostics for tests. */
  bootRegistrySnapshot() {
    return listAnalyticalOwnerBootOutcomes();
  }
}
