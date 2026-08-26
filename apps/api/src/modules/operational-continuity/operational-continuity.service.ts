/**
 * W3-O01-d — Operational Continuity service.
 *
 * Extends recovered analytical owners with readiness / graceful degradation projection.
 * Recovery itself remains W3-O01-c only. No new persistence / BC / HA / monitoring.
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  getAnalyticalOwnerBootOutcome,
  listAnalyticalOwnerBootOutcomes,
  recordAnalyticalOwnerBootOutcome,
  resetAnalyticalOwnerBootOutcomes,
} from '../../persistence/analytical-owner-continuity-status';
import {
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../../persistence/analytical-restart-recovery';
import type { AnalyticalOwnerBootOutcome } from '../../persistence/analytical-owner-continuity-status';
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
    });
  }

  /**
   * Runs after Nest modules finish constructing (including W3-O01-c hydrates).
   * Continuity begins only after successful recovery path completion.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.finalized) {
      await this.finalizeFromBootRegistry();
    }
  }

  /** Read-only platform readiness projection. */
  getProjection(): PlatformOperationalProjection {
    return this.projection;
  }

  /**
   * Test / controlled evaluation: set boot outcomes then finalize.
   * Production path uses Nest OnModuleInit after W3-O01-c hydrates.
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
        // Owner module not yet recorded (or memory path without owner tag): Ready after recovery.
        bootByOwner.set(owner, 'ready');
      }
    }

    // Intermediate Recovering projection (honest while evaluating).
    this.projection = buildPlatformOperationalProjection({
      owners: evaluateOwnerOperationalStates({
        bootByOwner,
        bootReasons,
        recovering: true,
      }),
      recoveryTimestamp: null,
      recoveryDurationMs: null,
    });

    const owners = evaluateOwnerOperationalStates({
      bootByOwner,
      bootReasons,
      recovering: false,
    });
    const recoveryTimestamp = new Date().toISOString();
    const recoveryDurationMs = Math.max(0, Date.now() - (this.recoveryStartedAt ?? Date.now()));
    this.projection = buildPlatformOperationalProjection({
      owners,
      recoveryTimestamp,
      recoveryDurationMs,
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
