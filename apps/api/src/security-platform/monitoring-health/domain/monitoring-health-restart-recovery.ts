/**
 * W3-O05-c — Monitoring & Security Health restart recovery foundation.
 *
 * Restores W3-O05-b durable workspace monitoring health state after a normal process restart.
 * Reuses Security Platform owner persistence — not a second recovery engine.
 *
 * Not operational continuity. Not monitoring evaluation. Not dashboards or alerting.
 * Not Business Continuity, HA, DR, or Production Ready.
 */

import {
  MONITORING_HEALTH_STATE_SCHEMA_VERSION,
  type DurableMonitoringHealthState,
} from './durable-monitoring-health-state';

export const W3_O05_C_MONITORING_RECOVERY_OWNER = 'security-platform' as const;

export class MonitoringHealthRestartRecoveryError extends Error {
  readonly owner = W3_O05_C_MONITORING_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: MonitoringHealthRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'MonitoringHealthRestartRecoveryError';
    this.code = code;
  }
}

export type MonitoringHealthRecoveryDiagnostics = Readonly<{
  owner: typeof W3_O05_C_MONITORING_RECOVERY_OWNER;
  restoredCount: number;
  securityHealthAnchorCount: number;
  connectionHealthAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function hasSecurityAnchor(state: DurableMonitoringHealthState): boolean {
  return state.securityHealthAnchorIncidentId !== null;
}

function hasConnectionAnchor(state: DurableMonitoringHealthState): boolean {
  return state.connectionHealthAnchorSessionId !== null;
}

/**
 * Integrity gate for a single persisted monitoring health state row.
 * Never fabricates defaults for missing required fields.
 */
export function assertRecoverableMonitoringHealthState(
  value: DurableMonitoringHealthState,
  index = 0,
): DurableMonitoringHealthState {
  const prefix = `workspace[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);

  if (value.schemaVersion !== MONITORING_HEALTH_STATE_SCHEMA_VERSION) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused unsupported schema at ${prefix}`,
    );
  }

  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  if (value.securityHealthAnchorIncidentId !== null) {
    requireNonEmptyString(
      value.securityHealthAnchorIncidentId,
      `${prefix}.securityHealthAnchorIncidentId`,
    );
    const recordedAt = requireNonEmptyString(
      value.securityHealthAnchorRecordedAt,
      `${prefix}.securityHealthAnchorRecordedAt`,
    );
    requireNonEmptyString(
      value.securityHealthAnchorRecordedByActorId,
      `${prefix}.securityHealthAnchorRecordedByActorId`,
    );
    assertIso(recordedAt, `${prefix}.securityHealthAnchorRecordedAt`);
  } else if (
    value.securityHealthAnchorRecordedAt !== null ||
    value.securityHealthAnchorRecordedByActorId !== null
  ) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused partial security anchor at ${prefix}`,
    );
  }

  if (value.connectionHealthAnchorSessionId !== null) {
    requireNonEmptyString(
      value.connectionHealthAnchorSessionId,
      `${prefix}.connectionHealthAnchorSessionId`,
    );
    const recordedAt = requireNonEmptyString(
      value.connectionHealthAnchorRecordedAt,
      `${prefix}.connectionHealthAnchorRecordedAt`,
    );
    requireNonEmptyString(
      value.connectionHealthAnchorRecordedByActorId,
      `${prefix}.connectionHealthAnchorRecordedByActorId`,
    );
    assertIso(recordedAt, `${prefix}.connectionHealthAnchorRecordedAt`);
  } else if (
    value.connectionHealthAnchorRecordedAt !== null ||
    value.connectionHealthAnchorRecordedByActorId !== null
  ) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused partial connection anchor at ${prefix}`,
    );
  }

  if (!hasSecurityAnchor(value) && !hasConnectionAnchor(value)) {
    throw new MonitoringHealthRestartRecoveryError(
      'CORRUPT_STATE',
      `Monitoring health recovery refused empty persisted row at ${prefix}`,
    );
  }

  return Object.freeze({
    workspaceId,
    schemaVersion: value.schemaVersion,
    securityHealthAnchorIncidentId: value.securityHealthAnchorIncidentId,
    securityHealthAnchorRecordedAt: value.securityHealthAnchorRecordedAt,
    securityHealthAnchorRecordedByActorId: value.securityHealthAnchorRecordedByActorId,
    connectionHealthAnchorSessionId: value.connectionHealthAnchorSessionId,
    connectionHealthAnchorRecordedAt: value.connectionHealthAnchorRecordedAt,
    connectionHealthAnchorRecordedByActorId: value.connectionHealthAnchorRecordedByActorId,
    correlationId: value.correlationId,
    updatedAt: value.updatedAt,
  });
}

/** Deterministic recovery order: workspaceId ascending. */
export function sortMonitoringHealthStatesDeterministically(
  states: readonly DurableMonitoringHealthState[],
): readonly DurableMonitoringHealthState[] {
  return Object.freeze([...states].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)));
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareMonitoringHealthStatesForRecovery(
  states: readonly DurableMonitoringHealthState[],
): readonly DurableMonitoringHealthState[] {
  const seen = new Set<string>();
  const recovered: DurableMonitoringHealthState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableMonitoringHealthState(states[i]!, i);
    if (seen.has(state.workspaceId)) {
      throw new MonitoringHealthRestartRecoveryError(
        'CORRUPT_STATE',
        `Monitoring health recovery refused duplicate workspaceId "${state.workspaceId}"`,
      );
    }
    seen.add(state.workspaceId);
    recovered.push(state);
  }
  return sortMonitoringHealthStatesDeterministically(recovered);
}

export function buildMonitoringHealthRecoveryDiagnostics(
  states: readonly DurableMonitoringHealthState[],
): MonitoringHealthRecoveryDiagnostics {
  const ordered = sortMonitoringHealthStatesDeterministically(states);
  let securityHealthAnchorCount = 0;
  let connectionHealthAnchorCount = 0;
  for (const state of ordered) {
    if (hasSecurityAnchor(state)) securityHealthAnchorCount += 1;
    if (hasConnectionAnchor(state)) connectionHealthAnchorCount += 1;
  }
  return Object.freeze({
    owner: W3_O05_C_MONITORING_RECOVERY_OWNER,
    restoredCount: ordered.length,
    securityHealthAnchorCount,
    connectionHealthAnchorCount,
    workspaceIds: Object.freeze(ordered.map((state) => state.workspaceId)),
    recoveryOrder: Object.freeze(ordered.map((state) => state.workspaceId)),
  });
}
