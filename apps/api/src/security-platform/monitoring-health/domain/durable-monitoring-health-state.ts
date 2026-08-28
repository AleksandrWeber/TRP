export const MONITORING_HEALTH_STATE_SCHEMA_VERSION = 1;

export type DurableMonitoringHealthState = Readonly<{
  workspaceId: string;
  schemaVersion: number;
  securityHealthAnchorIncidentId: string | null;
  securityHealthAnchorRecordedAt: string | null;
  securityHealthAnchorRecordedByActorId: string | null;
  connectionHealthAnchorSessionId: string | null;
  connectionHealthAnchorRecordedAt: string | null;
  connectionHealthAnchorRecordedByActorId: string | null;
  correlationId: string | null;
  updatedAt: string;
}>;

export type MonitoringHealthPersistenceOutcome =
  | Readonly<{ ok: true; state: DurableMonitoringHealthState }>
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

function emptyState(workspaceId: string, updatedAt: string): DurableMonitoringHealthState {
  return Object.freeze({
    workspaceId,
    schemaVersion: MONITORING_HEALTH_STATE_SCHEMA_VERSION,
    securityHealthAnchorIncidentId: null,
    securityHealthAnchorRecordedAt: null,
    securityHealthAnchorRecordedByActorId: null,
    connectionHealthAnchorSessionId: null,
    connectionHealthAnchorRecordedAt: null,
    connectionHealthAnchorRecordedByActorId: null,
    correlationId: null,
    updatedAt,
  });
}

/**
 * Build durable security health anchor for persistence (W3-O05-b).
 * Stores explicit incident anchor only — not computed SEC-15 dashboard health.
 */
export function buildSecurityHealthAnchorState(input: {
  workspaceId: string;
  incidentId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableMonitoringHealthState | null;
}): MonitoringHealthPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.incidentId, 'incidentId');
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
      securityHealthAnchorIncidentId: input.incidentId.trim(),
      securityHealthAnchorRecordedAt: input.recordedAt,
      securityHealthAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      updatedAt: input.recordedAt,
    }),
  });
}

/**
 * Build durable connection health anchor for persistence (W3-O05-b).
 * Stores explicit session anchor only — not computed connection health enum.
 */
export function buildConnectionHealthAnchorState(input: {
  workspaceId: string;
  sessionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableMonitoringHealthState | null;
}): MonitoringHealthPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.sessionId, 'sessionId');
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
      connectionHealthAnchorSessionId: input.sessionId.trim(),
      connectionHealthAnchorRecordedAt: input.recordedAt,
      connectionHealthAnchorRecordedByActorId: input.actorId,
      correlationId: input.correlationId ?? base.correlationId,
      updatedAt: input.recordedAt,
    }),
  });
}
