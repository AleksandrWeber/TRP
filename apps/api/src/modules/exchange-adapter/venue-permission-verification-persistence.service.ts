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
 * W4-E05-b — durable venue permission verification persistence on Exchange Adapter owner.
 * Storage only — no recovery store, runtime cache, restart recovery, or operational continuity.
 */
@Injectable()
export class VenuePermissionVerificationPersistenceService {
  constructor(
    @Inject(VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY)
    private readonly repository: VenuePermissionVerificationStateRepository,
  ) {}

  async loadState(
    workspaceId: string,
    exchangeIdentifier: string,
  ): Promise<DurableVenuePermissionVerificationState | null> {
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
    return outcome;
  }
}
