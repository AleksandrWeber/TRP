/**
 * W4-E05-c — Venue Permission Verification restart recovery foundation.
 *
 * W4-E05-b uses `assertRecoverableVenuePermissionVerificationState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W4-E05-c.
 */

import {
  VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
  type DurableVenuePermissionVerificationState,
} from './durable-venue-permission-verification-state';

export const W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER = 'exchange-adapter' as const;

export class VenuePermissionRestartRecoveryError extends Error {
  readonly owner = W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: VenuePermissionRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'VenuePermissionRestartRecoveryError';
    this.code = code;
  }
}

export type VenuePermissionVerificationRecoveryDiagnostics = Readonly<{
  owner: typeof W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER;
  restoredCount: number;
  verifiedAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending, then exchangeIdentifier). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new VenuePermissionRestartRecoveryError(
      'CORRUPT_STATE',
      `Venue permission recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new VenuePermissionRestartRecoveryError(
      'CORRUPT_STATE',
      `Venue permission recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function compositeKey(workspaceId: string, exchangeIdentifier: string): string {
  return `${workspaceId}:${exchangeIdentifier}`;
}

function hasVerifiedAnchors(state: DurableVenuePermissionVerificationState): boolean {
  return (
    state.connectionId !== null &&
    state.adapterExchangeConnectionId !== null &&
    state.permissionVerificationId !== null &&
    state.vendorPermissionHash !== null &&
    state.integrityMetadataHash !== null &&
    state.correlationId !== null
  );
}

/**
 * Integrity gate for a single persisted venue permission verification state row.
 * Never fabricates defaults for missing required fields. Never synthesizes permission labels.
 */
export function assertRecoverableVenuePermissionVerificationState(
  value: DurableVenuePermissionVerificationState,
  index = 0,
): DurableVenuePermissionVerificationState {
  const prefix = `row[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);
  const exchangeIdentifier = requireNonEmptyString(
    value.exchangeIdentifier,
    `${prefix}.exchangeIdentifier`,
  );

  if (value.schemaVersion !== VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION) {
    throw new VenuePermissionRestartRecoveryError(
      'CORRUPT_STATE',
      `Venue permission recovery refused unsupported schema at ${prefix}`,
    );
  }

  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  requireNonEmptyString(value.connectionId, `${prefix}.connectionId`);
  requireNonEmptyString(value.adapterExchangeConnectionId, `${prefix}.adapterExchangeConnectionId`);
  requireNonEmptyString(value.permissionVerificationId, `${prefix}.permissionVerificationId`);
  requireNonEmptyString(value.vendorPermissionHash, `${prefix}.vendorPermissionHash`);
  requireNonEmptyString(value.integrityMetadataHash, `${prefix}.integrityMetadataHash`);
  requireNonEmptyString(value.correlationId, `${prefix}.correlationId`);

  if (!hasVerifiedAnchors(value)) {
    throw new VenuePermissionRestartRecoveryError(
      'CORRUPT_STATE',
      `Venue permission recovery refused incomplete persisted row at ${prefix}`,
    );
  }

  return Object.freeze({
    workspaceId,
    schemaVersion: value.schemaVersion,
    exchangeIdentifier,
    connectionId: value.connectionId,
    adapterExchangeConnectionId: value.adapterExchangeConnectionId,
    permissionVerificationId: value.permissionVerificationId,
    vendorPermissionHash: value.vendorPermissionHash,
    integrityMetadataHash: value.integrityMetadataHash,
    correlationId: value.correlationId,
    updatedAt: value.updatedAt,
  });
}

/** Deterministic recovery order: workspaceId ascending, then exchangeIdentifier. */
export function sortVenuePermissionVerificationStatesDeterministically(
  states: readonly DurableVenuePermissionVerificationState[],
): readonly DurableVenuePermissionVerificationState[] {
  return Object.freeze(
    [...states].sort((a, b) => {
      const byWorkspace = a.workspaceId.localeCompare(b.workspaceId);
      if (byWorkspace !== 0) {
        return byWorkspace;
      }
      return a.exchangeIdentifier.localeCompare(b.exchangeIdentifier);
    }),
  );
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareVenuePermissionVerificationStatesForRecovery(
  states: readonly DurableVenuePermissionVerificationState[],
): readonly DurableVenuePermissionVerificationState[] {
  const seen = new Set<string>();
  const recovered: DurableVenuePermissionVerificationState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableVenuePermissionVerificationState(states[i]!, i);
    const key = compositeKey(state.workspaceId, state.exchangeIdentifier);
    if (seen.has(key)) {
      throw new VenuePermissionRestartRecoveryError(
        'CORRUPT_STATE',
        `Venue permission recovery refused duplicate row "${key}"`,
      );
    }
    seen.add(key);
    recovered.push(state);
  }
  return sortVenuePermissionVerificationStatesDeterministically(recovered);
}

export function buildVenuePermissionVerificationRecoveryDiagnostics(
  states: readonly DurableVenuePermissionVerificationState[],
): VenuePermissionVerificationRecoveryDiagnostics {
  const ordered = sortVenuePermissionVerificationStatesDeterministically(states);
  let verifiedAnchorCount = 0;
  for (const state of ordered) {
    if (hasVerifiedAnchors(state)) verifiedAnchorCount += 1;
  }
  const workspaceIds = Object.freeze([...new Set(ordered.map((state) => state.workspaceId))]);
  return Object.freeze({
    owner: W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER,
    restoredCount: ordered.length,
    verifiedAnchorCount,
    workspaceIds,
    recoveryOrder: Object.freeze(
      ordered.map((state) => compositeKey(state.workspaceId, state.exchangeIdentifier)),
    ),
  });
}
