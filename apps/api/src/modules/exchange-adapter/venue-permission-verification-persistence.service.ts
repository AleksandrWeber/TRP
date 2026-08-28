import { Inject, Injectable } from '@nestjs/common';
import {
  buildVenuePermissionVerificationAnchorState,
  type DurableVenuePermissionVerificationState,
  type VenuePermissionVerificationPersistenceOutcome,
} from './domain/durable-venue-permission-verification-state';
import {
  VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY,
  type VenuePermissionVerificationStateRepository,
} from './domain/venue-permission-verification-state.repository';
import { VenuePermissionRecoveryStore } from './venue-permission-recovery-store';

export type PersistVenuePermissionVerificationAnchorsCommand = Readonly<{
  workspaceId: string;
  exchangeIdentifier: string;
  connectionId: string;
  adapterExchangeConnectionId: string;
  permissionVerificationId: string;
  vendorPermissionHash: string;
  integrityMetadataHash: string;
  correlationId: string;
  recordedAt: string;
}>;

/**
 * W4-E05-b/c — durable venue permission verification persistence on Exchange Adapter owner.
 * W4-E05-c — write-through to recovery store after hydrate.
 * Storage only — no vendor permission probe I/O or operational continuity.
 */
@Injectable()
export class VenuePermissionVerificationPersistenceService {
  constructor(
    @Inject(VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY)
    private readonly repository: VenuePermissionVerificationStateRepository,
    @Inject(VenuePermissionRecoveryStore)
    private readonly recoveryStore: VenuePermissionRecoveryStore,
  ) {}

  async loadState(
    workspaceId: string,
    exchangeIdentifier: string,
  ): Promise<DurableVenuePermissionVerificationState | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId, exchangeIdentifier);
    }
    return this.repository.loadVenuePermissionVerificationState(workspaceId, exchangeIdentifier);
  }

  async persistVerificationAnchors(
    command: PersistVenuePermissionVerificationAnchorsCommand,
  ): Promise<VenuePermissionVerificationPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId, command.exchangeIdentifier);
    const outcome = buildVenuePermissionVerificationAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveVenuePermissionVerificationState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }
}
