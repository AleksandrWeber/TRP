import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableKillSwitchState } from '../domain/durable-kill-switch-state';
import {
  buildKillSwitchRecoveryDiagnostics,
  prepareKillSwitchStatesForRecovery,
  type KillSwitchRecoveryDiagnostics,
} from '../domain/kill-switch-restart-recovery';
import {
  KILL_SWITCH_STATE_REPOSITORY,
  type KillSwitchStateRepository,
} from '../domain/kill-switch-state.repository';
import {
  recordKillSwitchRecoveryFailure,
  recordKillSwitchRecoveryStart,
  recordKillSwitchRecoverySuccess,
} from '../domain/kill-switch-continuity-status';
import { KillSwitchRecoveryStore } from './kill-switch-recovery-store';

/**
 * W3-O04-c/d — deterministic restart recovery for durable Kill Switch state.
 * Hydrates in-memory runtime cache from persistence and records W3-O04-d continuity outcomes.
 * Does not execute halt or wire admission.
 */
@Injectable()
export class KillSwitchRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(KILL_SWITCH_STATE_REPOSITORY)
    private readonly repository: KillSwitchStateRepository,
    private readonly recoveryStore: KillSwitchRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<KillSwitchRecoveryDiagnostics> {
    recordKillSwitchRecoveryStart();
    try {
      const persisted = await this.repository.listAllKillSwitchStates();
      const recovered = prepareKillSwitchStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildKillSwitchRecoveryDiagnostics(recovered);
      recordKillSwitchRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordKillSwitchRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(workspaceId: string): DurableKillSwitchState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): KillSwitchRecoveryDiagnostics {
    return buildKillSwitchRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
