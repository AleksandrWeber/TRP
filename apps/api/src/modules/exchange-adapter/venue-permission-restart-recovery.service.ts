import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableVenuePermissionVerificationState } from './domain/durable-venue-permission-verification-state';
import {
  buildVenuePermissionVerificationRecoveryDiagnostics,
  prepareVenuePermissionVerificationStatesForRecovery,
  type VenuePermissionVerificationRecoveryDiagnostics,
} from './domain/venue-permission-restart-recovery';
import {
  VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY,
  type VenuePermissionVerificationStateRepository,
} from './domain/venue-permission-verification-state.repository';
import {
  recordVenuePermissionRecoveryFailure,
  recordVenuePermissionRecoveryStart,
  recordVenuePermissionRecoverySuccess,
} from './domain/venue-permission-continuity-status';
import { VenuePermissionRecoveryStore } from './venue-permission-recovery-store';

/**
 * W4-E05-c — deterministic restart recovery for durable venue permission verification state.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish vendor permission probe I/O or synthesize permission labels.
 */
@Injectable()
export class VenuePermissionRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY)
    private readonly repository: VenuePermissionVerificationStateRepository,
    @Inject(VenuePermissionRecoveryStore)
    private readonly recoveryStore: VenuePermissionRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<VenuePermissionVerificationRecoveryDiagnostics> {
    recordVenuePermissionRecoveryStart();
    try {
      const persisted = await this.repository.listAllVenuePermissionVerificationStates();
      const recovered = prepareVenuePermissionVerificationStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildVenuePermissionVerificationRecoveryDiagnostics(recovered);
      recordVenuePermissionRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordVenuePermissionRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(
    workspaceId: string,
    exchangeIdentifier: string,
  ): DurableVenuePermissionVerificationState | null {
    return this.recoveryStore.get(workspaceId, exchangeIdentifier);
  }

  getRecoveryDiagnostics(): VenuePermissionVerificationRecoveryDiagnostics {
    return buildVenuePermissionVerificationRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
