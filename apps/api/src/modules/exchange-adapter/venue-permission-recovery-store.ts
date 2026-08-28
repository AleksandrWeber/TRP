import { Injectable } from '@nestjs/common';
import type { DurableVenuePermissionVerificationState } from './domain/durable-venue-permission-verification-state';
import { sortVenuePermissionVerificationStatesDeterministically } from './domain/venue-permission-restart-recovery';

function compositeKey(workspaceId: string, exchangeIdentifier: string): string {
  return `${workspaceId}:${exchangeIdentifier}`;
}

/**
 * In-memory runtime cache for recovered venue permission verification state (W4-E05-c).
 * Not a second Source of Truth — hydrated from W4-E05-b persistence on restart.
 */
@Injectable()
export class VenuePermissionRecoveryStore {
  private hydrated = false;
  private readonly byCompositeKey = new Map<string, DurableVenuePermissionVerificationState>();

  replaceAll(states: readonly DurableVenuePermissionVerificationState[]): void {
    this.byCompositeKey.clear();
    for (const state of states) {
      this.byCompositeKey.set(compositeKey(state.workspaceId, state.exchangeIdentifier), state);
    }
    this.hydrated = true;
  }

  set(state: DurableVenuePermissionVerificationState): void {
    this.byCompositeKey.set(compositeKey(state.workspaceId, state.exchangeIdentifier), state);
    this.hydrated = true;
  }

  get(
    workspaceId: string,
    exchangeIdentifier: string,
  ): DurableVenuePermissionVerificationState | null {
    return this.byCompositeKey.get(compositeKey(workspaceId, exchangeIdentifier)) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableVenuePermissionVerificationState[] {
    return sortVenuePermissionVerificationStatesDeterministically([
      ...this.byCompositeKey.values(),
    ]);
  }
}
