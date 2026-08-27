/**
 * W3-O04-c — Kill Switch restart recovery foundation.
 *
 * Restores W3-O04-b durable workspace Kill Switch state after a normal process restart.
 * Reuses trading-session owner persistence — not a second recovery engine.
 *
 * Not operational continuity. Not Kill Switch execution. Not Command Center.
 * Not Business Continuity, HA, DR, or Production Restart Safe.
 */

import {
  KILL_SWITCH_STATE_SCHEMA_VERSION,
  type DurableKillSwitchState,
} from './durable-kill-switch-state';

export const W3_O04_C_KILL_SWITCH_RECOVERY_OWNER = 'trading-session' as const;

export class KillSwitchRestartRecoveryError extends Error {
  readonly owner = W3_O04_C_KILL_SWITCH_RECOVERY_OWNER;
  readonly code: 'CORRUPT_STATE' | 'FABRICATION_FORBIDDEN';

  constructor(code: KillSwitchRestartRecoveryError['code'], message: string) {
    super(message);
    this.name = 'KillSwitchRestartRecoveryError';
    this.code = code;
  }
}

export type KillSwitchRecoveryDiagnostics = Readonly<{
  owner: typeof W3_O04_C_KILL_SWITCH_RECOVERY_OWNER;
  restoredCount: number;
  armedCount: number;
  workspaceIds: readonly string[];
  /** Deterministic recovery order (workspaceId ascending). */
  recoveryOrder: readonly string[];
}>;

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new KillSwitchRestartRecoveryError(
      'CORRUPT_STATE',
      `Kill Switch recovery refused corrupt field "${field}"`,
    );
  }
}

function requireNonEmptyString(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new KillSwitchRestartRecoveryError(
      'CORRUPT_STATE',
      `Kill Switch recovery refused corrupt field "${field}"`,
    );
  }
  return value.trim();
}

/**
 * Integrity gate for a single persisted Kill Switch state row.
 * Never fabricates defaults for missing required fields.
 */
export function assertRecoverableKillSwitchState(
  value: DurableKillSwitchState,
  index = 0,
): DurableKillSwitchState {
  const prefix = `workspace[${index}]`;
  const workspaceId = requireNonEmptyString(value.workspaceId, `${prefix}.workspaceId`);

  if (value.schemaVersion !== KILL_SWITCH_STATE_SCHEMA_VERSION) {
    throw new KillSwitchRestartRecoveryError(
      'CORRUPT_STATE',
      `Kill Switch recovery refused unsupported schema at ${prefix}`,
    );
  }

  if (typeof value.armed !== 'boolean') {
    throw new KillSwitchRestartRecoveryError(
      'CORRUPT_STATE',
      `Kill Switch recovery refused corrupt armed flag at ${prefix}`,
    );
  }

  assertIso(value.updatedAt, `${prefix}.updatedAt`);

  if (value.armed) {
    requireNonEmptyString(value.reason, `${prefix}.reason`);
    requireNonEmptyString(value.armedAt, `${prefix}.armedAt`);
    requireNonEmptyString(value.armedByActorId, `${prefix}.armedByActorId`);
    if (value.armedAt) assertIso(value.armedAt, `${prefix}.armedAt`);
  }

  if (!value.armed) {
    if (value.clearedAt !== null) {
      assertIso(value.clearedAt, `${prefix}.clearedAt`);
      requireNonEmptyString(value.clearedByActorId, `${prefix}.clearedByActorId`);
    } else if (value.armedAt === null && value.reason === null) {
      throw new KillSwitchRestartRecoveryError(
        'CORRUPT_STATE',
        `Kill Switch recovery refused empty persisted row at ${prefix}`,
      );
    }
  }

  return Object.freeze({
    workspaceId,
    armed: value.armed,
    reason: value.reason,
    armedAt: value.armedAt,
    armedByActorId: value.armedByActorId,
    clearedAt: value.clearedAt,
    clearedByActorId: value.clearedByActorId,
    correlationId: value.correlationId,
    schemaVersion: value.schemaVersion,
    updatedAt: value.updatedAt,
  });
}

/** Deterministic recovery order: workspaceId ascending. */
export function sortKillSwitchStatesDeterministically(
  states: readonly DurableKillSwitchState[],
): readonly DurableKillSwitchState[] {
  return Object.freeze([...states].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)));
}

/**
 * Integrity gate for persisted rows loaded from storage.
 * Missing array / empty → empty (no fabrication). Corrupt rows → fail honestly.
 */
export function prepareKillSwitchStatesForRecovery(
  states: readonly DurableKillSwitchState[],
): readonly DurableKillSwitchState[] {
  const seen = new Set<string>();
  const recovered: DurableKillSwitchState[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const state = assertRecoverableKillSwitchState(states[i]!, i);
    if (seen.has(state.workspaceId)) {
      throw new KillSwitchRestartRecoveryError(
        'CORRUPT_STATE',
        `Kill Switch recovery refused duplicate workspaceId "${state.workspaceId}"`,
      );
    }
    seen.add(state.workspaceId);
    recovered.push(state);
  }
  return sortKillSwitchStatesDeterministically(recovered);
}

export function buildKillSwitchRecoveryDiagnostics(
  states: readonly DurableKillSwitchState[],
): KillSwitchRecoveryDiagnostics {
  const ordered = sortKillSwitchStatesDeterministically(states);
  let armedCount = 0;
  for (const state of ordered) {
    if (state.armed) armedCount += 1;
  }
  return Object.freeze({
    owner: W3_O04_C_KILL_SWITCH_RECOVERY_OWNER,
    restoredCount: ordered.length,
    armedCount,
    workspaceIds: Object.freeze(ordered.map((state) => state.workspaceId)),
    recoveryOrder: Object.freeze(ordered.map((state) => state.workspaceId)),
  });
}
