export const BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER = 'BYBIT' as const;

export const BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION = 1;

export type DurableBybitExchangeConnectivityState = Readonly<{
  workspaceId: string;
  schemaVersion: number;
  exchangeIdentifier: typeof BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER;
  connectionAnchorConnectionId: string | null;
  connectionAnchorRecordedAt: string | null;
  connectionAnchorRecordedByActorId: string | null;
  adapterAnchorExchangeConnectionId: string | null;
  adapterAnchorRecordedAt: string | null;
  adapterAnchorRecordedByActorId: string | null;
  correlationId: string | null;
  integrityMetadataHash: string | null;
  updatedAt: string;
}>;

export type BybitExchangeConnectivityPersistenceOutcome =
  | Readonly<{ ok: true; state: DurableBybitExchangeConnectivityState }>
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

function emptyState(workspaceId: string, updatedAt: string): DurableBybitExchangeConnectivityState {
  return Object.freeze({
    workspaceId,
    schemaVersion: BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
    exchangeIdentifier: BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    connectionAnchorConnectionId: null,
    connectionAnchorRecordedAt: null,
    connectionAnchorRecordedByActorId: null,
    adapterAnchorExchangeConnectionId: null,
    adapterAnchorRecordedAt: null,
    adapterAnchorRecordedByActorId: null,
    correlationId: null,
    integrityMetadataHash: null,
    updatedAt,
  });
}

/**
 * Build durable Connection Management anchor for BYBIT persistence (W4-E02-b).
 * Stores explicit connection id and exchange identifier only — not synthetic Connected.
 */
export function buildBybitConnectionManagementAnchorState(input: {
  workspaceId: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
  prior: DurableBybitExchangeConnectivityState | null;
}): BybitExchangeConnectivityPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.connectionId, 'connectionId');
  assertNonEmpty(input.actorId, 'actorId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  const base = input.prior ?? emptyState(input.workspaceId, input.recordedAt);

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...base,
      connectionAnchorConnectionId: input.connectionId.trim(),
      connectionAnchorRecordedAt: input.recordedAt,
      connectionAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      integrityMetadataHash: input.integrityMetadataHash ?? base.integrityMetadataHash,
      updatedAt: input.recordedAt,
    }),
  });
}

/**
 * Build durable Exchange Adapter layer anchor for BYBIT persistence (W4-E02-b).
 * Stores explicit adapter exchange_connection id only — not runtime connected flag.
 */
export function buildBybitAdapterLayerAnchorState(input: {
  workspaceId: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
  prior: DurableBybitExchangeConnectivityState | null;
}): BybitExchangeConnectivityPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.exchangeConnectionId, 'exchangeConnectionId');
  assertNonEmpty(input.actorId, 'actorId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  const base = input.prior ?? emptyState(input.workspaceId, input.recordedAt);

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...base,
      adapterAnchorExchangeConnectionId: input.exchangeConnectionId.trim(),
      adapterAnchorRecordedAt: input.recordedAt,
      adapterAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      integrityMetadataHash: input.integrityMetadataHash ?? base.integrityMetadataHash,
      updatedAt: input.recordedAt,
    }),
  });
}
