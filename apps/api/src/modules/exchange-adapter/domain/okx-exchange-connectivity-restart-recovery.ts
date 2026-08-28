/**
 * W4-E03-c — OKX Exchange Connectivity restart recovery foundation.
 *
 * W4-E03-b uses `assertRecoverableOkxExchangeConnectivityState` for persisted-row integrity only.
 * Full restart recovery hydrate is implemented in W4-E03-c.
 */

import {
  OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
  type DurableOkxExchangeConnectivityState,
} from './durable-okx-exchange-connectivity-state';

export const W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER = 'exchange-adapter' as const;

export class OkxExchangeConnectivityRestartRecoveryError extends Error {
  readonly owner = W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: OkxExchangeConnectivityRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'OkxExchangeConnectivityRestartRecoveryError';
    this.code = code;
  }
}

export type OkxExchangeConnectivityRecoveryDiagnostics = Readonly<{
  owner: typeof W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

function hasConnectionAnchor(state: DurableOkxExchangeConnectivityState): boolean {
  return state.connectionAnchorConnectionId !== null;
}

function hasAdapterAnchor(state: DurableOkxExchangeConnectivityState): boolean {
  return state.adapterAnchorExchangeConnectionId !== null;
}

/**
 * Integrity gate for a single persisted Okx exchange connectivity state row.
 * Never fabricates defaults for missing required fields. Never synthesizes Connected.
 */
export function assertRecoverableOkxExchangeConnectivityState(
  value: DurableOkxExchangeConnectivityState,
  index = 0,
): DurableOkxExchangeConnectivityState {
  const prefix = `workspace[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);

  if (value.schemaVersion !== OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION) {
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (value.exchangeIdentifier !== OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER) {
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused unsupported exchange identifier at ${prefix}`,
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
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused partial connection anchor at ${prefix}`,
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
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused partial adapter anchor at ${prefix}`,
    );
  }

  if (!hasConnectionAnchor(value) && !hasAdapterAnchor(value)) {
    throw new OkxExchangeConnectivityRestartRecoveryError(
      'CORRUPT_STATE',
      `Okx exchange connectivity recovery refused empty persisted row at ${prefix}`,
    );
  }

  return Object.freeze({
    workspaceId,
    schemaVersion: value.schemaVersion,
    exchangeIdentifier: OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
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
export function sortOkxExchangeConnectivityStatesDeterministically(
  states: readonly DurableOkxExchangeConnectivityState[],
): readonly DurableOkxExchangeConnectivityState[] {
  return Object.freeze([...states].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)));
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareOkxExchangeConnectivityStatesForRecovery(
  states: readonly DurableOkxExchangeConnectivityState[],
): readonly DurableOkxExchangeConnectivityState[] {
  const seen = new Set<string>();
  const recovered: DurableOkxExchangeConnectivityState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableOkxExchangeConnectivityState(states[i]!, i);
    if (seen.has(state.workspaceId)) {
      throw new OkxExchangeConnectivityRestartRecoveryError(
        'CORRUPT_STATE',
        `Okx exchange connectivity recovery refused duplicate workspaceId "${state.workspaceId}"`,
      );
    }
    seen.add(state.workspaceId);
    recovered.push(state);
  }
  return sortOkxExchangeConnectivityStatesDeterministically(recovered);
}

export function buildOkxExchangeConnectivityRecoveryDiagnostics(
  states: readonly DurableOkxExchangeConnectivityState[],
): OkxExchangeConnectivityRecoveryDiagnostics {
  const ordered = sortOkxExchangeConnectivityStatesDeterministically(states);
  let connectionAnchorCount = 0;
  let adapterAnchorCount = 0;
  for (const state of ordered) {
    if (hasConnectionAnchor(state)) connectionAnchorCount += 1;
    if (hasAdapterAnchor(state)) adapterAnchorCount += 1;
  }
  return Object.freeze({
    owner: W4_E03_C_OKX_EXCHANGE_CONNECTIVITY_RECOVERY_OWNER,
    restoredCount: ordered.length,
    connectionAnchorCount,
    adapterAnchorCount,
    workspaceIds: Object.freeze(ordered.map((state) => state.workspaceId)),
    recoveryOrder: Object.freeze(ordered.map((state) => state.workspaceId)),
  });
}
