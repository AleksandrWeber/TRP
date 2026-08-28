import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableVenuePermissionVerificationState } from './durable-venue-permission-verification-state';

/**
 * Persistence port for durable venue permission verification state (W4-E05-b).
 * Implementations belong to exchange-adapter infrastructure.
 */
export interface VenuePermissionVerificationStateRepository {
  saveVenuePermissionVerificationState(
    state: DurableVenuePermissionVerificationState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadVenuePermissionVerificationState(
    workspaceId: string,
    exchangeIdentifier: string,
  ): Promise<DurableVenuePermissionVerificationState | null>;

  /** Deterministic load for future restart recovery (W4-E05-c). */
  listAllVenuePermissionVerificationStates(): Promise<
    readonly DurableVenuePermissionVerificationState[]
  >;
}

export const VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY = Symbol(
  'VENUE_PERMISSION_VERIFICATION_STATE_REPOSITORY',
);
