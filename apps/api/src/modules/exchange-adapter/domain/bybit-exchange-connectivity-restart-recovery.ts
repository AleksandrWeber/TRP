/**
 * W4-E02-c — Bybit Exchange Connectivity restart recovery foundation.
 *
 * Restores W4-E02-b durable workspace Bybit exchange connectivity state after a normal process restart.
 * Reuses exchange-adapter owner persistence — not a second recovery engine.
 *
 * Not operational continuity. Not REST/WebSocket I/O. Not connection establishment.
 * Not Business Continuity, HA, DR, or Production Ready.
 */

import {
  BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableBybitExchangeConnectivityState,
} from './durable-bybit-exchange-connectivity-state';

export const W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER = 'exchange-adapter' as const;

export class BybitExchangeConnectivityRestartRecoveryError extends Error {
  readonly owner = W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: BybitExchangeConnectivityRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'BybitExchangeConnectivityRestartRecoveryError';
    this.code = code;
  }
}

export type BybitExchangeConnectivityRecoveryDiagnostics = Readonly<{
  owner: typeof W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function hasConnectionAnchor(state: DurableBybitExchangeConnectivityState): boolean {
  return state.connectionAnchorConnectionId !== null;
}

function hasAdapterAnchor(state: DurableBybitExchangeConnectivityState): boolean {
  return state.adapterAnchorExchangeConnectionId !== null;
}

/**
 * Integrity gate for a single persisted Bybit exchange connectivity state row.
 * Never fabricates defaults for missing required fields. Never synthesizes Connected.
 */
export function assertRecoverableBybitExchangeConnectivityState(
  value: DurableBybitExchangeConnectivityState,
  index = 0,
): DurableBybitExchangeConnectivityState {
  const prefix = `workspace[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);

  if (value.schemaVersion !== BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (value.exchangeIdentifier !== BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER) {
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused unsupported exchange identifier at ${prefix}`,
    );
  }

  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  if (value.connectionAnchorConnectionId !== null) {
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
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused partial connection anchor at ${prefix}`,
    );
  }

  if (value.adapterAnchorExchangeConnectionId !== null) {
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
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused partial adapter anchor at ${prefix}`,
    );
  }

  if (!hasConnectionAnchor(value) && !hasAdapterAnchor(value)) {
    throw new BybitExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Bybit exchange connectivity recovery refused empty persisted row at ${prefix}`,
    );
  }

  return Object.freeze({
    workspaceId,
    schemaVersion: value.schemaVersion,
    exchangeIdentifier: BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    connectionAnchorConnectionId: value.connectionAnchorConnectionId,
    connectionAnchorRecordedAt: value.connectionAnchorRecordedAt,
    connectionAnchorRecordedByActorId: value.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: value.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt: value.adapterAnchorRecordedAt,
    adapterAnchorRecordedByActorId: value.adapterAnchorRecordedByActorId,
    correlationId: value.correlationId,
    integrityMetadataHash: value.integrityMetadataHash,
    updatedAt: value.updatedAt,
  });
}

/** Deterministic recovery order: workspaceId ascending. */
export function sortBybitExchangeConnectivityStatesDeterministically(
  states: readonly DurableBybitExchangeConnectivityState[],
): readonly DurableBybitExchangeConnectivityState[] {
  return Object.freeze([...states].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)));
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareBybitExchangeConnectivityStatesForRecovery(
  states: readonly DurableBybitExchangeConnectivityState[],
): readonly DurableBybitExchangeConnectivityState[] {
  const seen = new Set<string>();
  const recovered: DurableBybitExchangeConnectivityState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableBybitExchangeConnectivityState(states[i]!, i);
    if (seen.has(state.workspaceId)) {
      throw new BybitExchangeConnectivityRestartRecoveryError(
        'CORRUPT_STATE',
        `Bybit exchange connectivity recovery refused duplicate workspaceId "${state.workspaceId}"`,
      );
    }
    seen.add(state.workspaceId);
    recovered.push(state);
  }
  return sortBybitExchangeConnectivityStatesDeterministically(recovered);
}

export function buildBybitExchangeConnectivityRecoveryDiagnostics(
  states: readonly DurableBybitExchangeConnectivityState[],
): BybitExchangeConnectivityRecoveryDiagnostics {
  const ordered = sortBybitExchangeConnectivityStatesDeterministically(states);
  let connectionAnchorCount = 0;
  let adapterAnchorCount = 0;
  for (const state of ordered) {
    if (hasConnectionAnchor(state)) connectionAnchorCount += 1;
    if (hasAdapterAnchor(state)) adapterAnchorCount += 1;
  }
  return Object.freeze({
    owner: W4_E02_C_BYBIT_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    connectionAnchorCount,
    adapterAnchorCount,
    workspaceIds: Object.freeze(ordered.map((state) => state.workspaceId)),
    recoveryOrder: Object.freeze(ordered.map((state) => state.workspaceId)),
  });
}
