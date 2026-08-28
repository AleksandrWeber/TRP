export const VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION = 1;

export type DurableVenuePermissionVerificationState = Readonly<{
  workspaceId: string;
  schemaVersion: number;
  exchangeIdentifier: string;
  connectionId: string | null;
  adapterExchangeConnectionId: string | null;
  permissionVerificationId: string | null;
  vendorPermissionHash: string | null;
  integrityMetadataHash: string | null;
  correlationId: string | null;
  updatedAt: string;
}>;

export type VenuePermissionVerificationPersistenceOutcome =
  | Readonly<{ ok: true; state: DurableVenuePermissionVerificationState }>
  | Readonly<{ ok: false; reason: string }>;

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ISO timestamp for ${label}: ${value}`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

function emptyState(
  workspaceId: string,
  exchangeIdentifier: string,
  updatedAt: string,
): DurableVenuePermissionVerificationState {
  return Object.freeze({
    workspaceId,
    schemaVersion: VENUE_PERMISSION_VERIFICATION_STATE_SCHEMA_VERSION,
    exchangeIdentifier,
    connectionId: null,
    adapterExchangeConnectionId: null,
    permissionVerificationId: null,
    vendorPermissionHash: null,
    integrityMetadataHash: null,
    correlationId: null,
    updatedAt,
  });
}

/**
 * Build durable venue permission verification anchors for persistence (W4-E05-b).
 * Stores canonical verification anchors only — not runtime permission cache.
 */
export function buildVenuePermissionVerificationAnchorState(input: {
  workspaceId: string;
  exchangeIdentifier: string;
  connectionId: string;
  adapterExchangeConnectionId: string;
  permissionVerificationId: string;
  vendorPermissionHash: string;
  integrityMetadataHash: string;
  correlationId: string;
  recordedAt: string;
  prior: DurableVenuePermissionVerificationState | null;
}): VenuePermissionVerificationPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.exchangeIdentifier, 'exchangeIdentifier');
  assertNonEmpty(input.connectionId, 'connectionId');
  assertNonEmpty(input.adapterExchangeConnectionId, 'adapterExchangeConnectionId');
  assertNonEmpty(input.permissionVerificationId, 'permissionVerificationId');
  assertNonEmpty(input.vendorPermissionHash, 'vendorPermissionHash');
  assertNonEmpty(input.integrityMetadataHash, 'integrityMetadataHash');
  assertNonEmpty(input.correlationId, 'correlationId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null) {
    if (input.prior.workspaceId !== input.workspaceId) {
      return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
    }
    if (input.prior.exchangeIdentifier !== input.exchangeIdentifier) {
      return Object.freeze({ ok: false, reason: 'exchange_identifier_mismatch' });
    }
  }

  const base =
    input.prior ?? emptyState(input.workspaceId, input.exchangeIdentifier, input.recordedAt);

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...base,
      connectionId: input.connectionId.trim(),
      adapterExchangeConnectionId: input.adapterExchangeConnectionId.trim(),
      permissionVerificationId: input.permissionVerificationId.trim(),
      vendorPermissionHash: input.vendorPermissionHash.trim(),
      integrityMetadataHash: input.integrityMetadataHash.trim(),
      correlationId: input.correlationId.trim(),
      updatedAt: input.recordedAt,
    }),
  });
}
