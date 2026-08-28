/**
 * W4-E01-c — Exchange Connectivity restart recovery foundation.
 *
 * Restores W4-E01-b durable workspace exchange connectivity state after a normal process restart.
 * Reuses exchange-adapter owner persistence — not a second recovery engine.
 *
 * Not operational continuity. Not REST/WebSocket I/O. Not connection establishment.
 * Not Business Continuity, HA, DR, or Production Ready.
 */

import {
  EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableExchangeConnectivityState,
} from './durable-exchange-connectivity-state';

export const W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER = 'exchange-adapter' as const;

export class ExchangeConnectivityRestartRecoveryError extends Error {
  readonly owner = W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: ExchangeConnectivityRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'ExchangeConnectivityRestartRecoveryError';
    this.code = code;
  }
}

export type ExchangeConnectivityRecoveryDiagnostics = Readonly<{
  owner: typeof W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function hasConnectionAnchor(state: DurableExchangeConnectivityState): boolean {
  return state.connectionAnchorConnectionId !== null;
}

function hasAdapterAnchor(state: DurableExchangeConnectivityState): boolean {
  return state.adapterAnchorExchangeConnectionId !== null;
}

/**
 * Integrity gate for a single persisted exchange connectivity state row.
 * Never fabricates defaults for missing required fields. Never synthesizes Connected.
 */
export function assertRecoverableExchangeConnectivityState(
  value: DurableExchangeConnectivityState,
  index = 0,
): DurableExchangeConnectivityState {
  const prefix = `workspace[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);

  if (value.schemaVersion !== EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused unsupported schema at ${prefix}`,
    );
  }

  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  if (value.connectionAnchorConnectionId !== null) {
    requireNonEmptyString(value.provider, `${prefix}.provider`);
    requireNonEmptyString(
      value.connectionAnchorConnectionId,
      `${prefix}.connectionAnchorConnectionId`,
    );
    const recordedAt = requireNonEmptyString(
      value.connectionAnchorRecordedAt,
      `${prefix}.connectionAnchorRecordedAt`,
    );
    requireNonEmptyString(
      value.connectionAnchorRecordedByActorId,
      `${prefix}.connectionAnchorRecordedByActorId`,
    );
    assertIso(recordedAt, `${prefix}.connectionAnchorRecordedAt`);
  } else if (
    value.connectionAnchorRecordedAt !== null ||
    value.connectionAnchorRecordedByActorId !== null
  ) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused partial connection anchor at ${prefix}`,
    );
  }

  if (value.adapterAnchorExchangeConnectionId !== null) {
    requireNonEmptyString(value.provider, `${prefix}.provider`);
    requireNonEmptyString(
      value.adapterAnchorExchangeConnectionId,
      `${prefix}.adapterAnchorExchangeConnectionId`,
    );
    const recordedAt = requireNonEmptyString(
      value.adapterAnchorRecordedAt,
      `${prefix}.adapterAnchorRecordedAt`,
    );
    requireNonEmptyString(
      value.adapterAnchorRecordedByActorId,
      `${prefix}.adapterAnchorRecordedByActorId`,
    );
    assertIso(recordedAt, `${prefix}.adapterAnchorRecordedAt`);
  } else if (
    value.adapterAnchorRecordedAt !== null ||
    value.adapterAnchorRecordedByActorId !== null
  ) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused partial adapter anchor at ${prefix}`,
    );
  }

  if (!hasConnectionAnchor(value) && !hasAdapterAnchor(value)) {
    throw new ExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Exchange connectivity recovery refused empty persisted row at ${prefix}`,
    );
  }

  return Object.freeze({
    workspaceId,
    schemaVersion: value.schemaVersion,
    provider: value.provider?.trim().toUpperCase() ?? null,
    connectionAnchorConnectionId: value.connectionAnchorConnectionId,
    connectionAnchorRecordedAt: value.connectionAnchorRecordedAt,
    connectionAnchorRecordedByActorId: value.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: value.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt: value.adapterAnchorRecordedAt,
    adapterAnchorRecordedByActorId: value.adapterAnchorRecordedByActorId,
    correlationId: value.correlationId,
    updatedAt: value.updatedAt,
  });
}

/** Deterministic recovery order: workspaceId ascending. */
export function sortExchangeConnectivityStatesDeterministically(
  states: readonly DurableExchangeConnectivityState[],
): readonly DurableExchangeConnectivityState[] {
  return Object.freeze([...states].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)));
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareExchangeConnectivityStatesForRecovery(
  states: readonly DurableExchangeConnectivityState[],
): readonly DurableExchangeConnectivityState[] {
  const seen = new Set<string>();
  const recovered: DurableExchangeConnectivityState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableExchangeConnectivityState(states[i]!, i);
    if (seen.has(state.workspaceId)) {
      throw new ExchangeConnectivityRestartRecoveryError(
        'CORRUPT_STATE',
        `Exchange connectivity recovery refused duplicate workspaceId "${state.workspaceId}"`,
      );
    }
    seen.add(state.workspaceId);
    recovered.push(state);
  }
  return sortExchangeConnectivityStatesDeterministically(recovered);
}

export function buildExchangeConnectivityRecoveryDiagnostics(
  states: readonly DurableExchangeConnectivityState[],
): ExchangeConnectivityRecoveryDiagnostics {
  const ordered = sortExchangeConnectivityStatesDeterministically(states);
  let connectionAnchorCount = 0;
  let adapterAnchorCount = 0;
  for (const state of ordered) {
    if (hasConnectionAnchor(state)) connectionAnchorCount += 1;
    if (hasAdapterAnchor(state)) adapterAnchorCount += 1;
  }
  return Object.freeze({
    owner: W4_E01_C_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    connectionAnchorCount,
    adapterAnchorCount,
    workspaceIds: Object.freeze(ordered.map((state) => state.workspaceId)),
    recoveryOrder: Object.freeze(ordered.map((state) => state.workspaceId)),
  });
}
