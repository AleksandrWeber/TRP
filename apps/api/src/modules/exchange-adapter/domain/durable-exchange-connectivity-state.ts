export const EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION = 1;

export type DurableExchangeConnectivityState = Readonly<{
  workspaceId: string;
  schemaVersion: number;
  provider: string | null;
  connectionAnchorConnectionId: string | null;
  connectionAnchorRecordedAt: string | null;
  connectionAnchorRecordedByActorId: string | null;
  adapterAnchorExchangeConnectionId: string | null;
  adapterAnchorRecordedAt: string | null;
  adapterAnchorRecordedByActorId: string | null;
  correlationId: string | null;
  updatedAt: string;
}>;

export type ExchangeConnectivityPersistenceOutcome =
  | Readonly<{ ok: true; state: DurableExchangeConnectivityState }>
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

function emptyState(workspaceId: string, updatedAt: string): DurableExchangeConnectivityState {
  return Object.freeze({
    workspaceId,
    schemaVersion: EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
    provider: null,
    connectionAnchorConnectionId: null,
    connectionAnchorRecordedAt: null,
    connectionAnchorRecordedByActorId: null,
    adapterAnchorExchangeConnectionId: null,
    adapterAnchorRecordedAt: null,
    adapterAnchorRecordedByActorId: null,
    correlationId: null,
    updatedAt,
  });
}

/**
 * Build durable Connection Management anchor for persistence (W4-E01-b).
 * Stores explicit connection id and provider only — not synthetic Connected.
 */
export function buildConnectionManagementAnchorState(input: {
  workspaceId: string;
  provider: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableExchangeConnectivityState | null;
}): ExchangeConnectivityPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.provider, 'provider');
  assertNonEmpty(input.connectionId, 'connectionId');
  assertNonEmpty(input.actorId, 'actorId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  const base = input.prior ?? emptyState(input.workspaceId, input.recordedAt);
  const provider = input.provider.trim().toUpperCase();

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...base,
      provider,
      connectionAnchorConnectionId: input.connectionId.trim(),
      connectionAnchorRecordedAt: input.recordedAt,
      connectionAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      updatedAt: input.recordedAt,
    }),
  });
}

/**
 * Build durable Exchange Adapter layer anchor for persistence (W4-E01-b).
 * Stores explicit adapter exchange_connection id only — not runtime connected flag.
 */
export function buildAdapterLayerAnchorState(input: {
  workspaceId: string;
  provider: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableExchangeConnectivityState | null;
}): ExchangeConnectivityPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.provider, 'provider');
  assertNonEmpty(input.exchangeConnectionId, 'exchangeConnectionId');
  assertNonEmpty(input.actorId, 'actorId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  const base = input.prior ?? emptyState(input.workspaceId, input.recordedAt);
  const provider = input.provider.trim().toUpperCase();

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      ...base,
      provider,
      adapterAnchorExchangeConnectionId: input.exchangeConnectionId.trim(),
      adapterAnchorRecordedAt: input.recordedAt,
      adapterAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      updatedAt: input.recordedAt,
    }),
  });
}
