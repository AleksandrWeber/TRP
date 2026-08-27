export const KILL_SWITCH_STATE_SCHEMA_VERSION = 1;

export type DurableKillSwitchState = Readonly<{
  workspaceId: string;
  armed: boolean;
  reason: string | null;
  armedAt: string | null;
  armedByActorId: string | null;
  clearedAt: string | null;
  clearedByActorId: string | null;
  correlationId: string | null;
  schemaVersion: number;
  updatedAt: string;
}>;

export type KillSwitchPersistenceOutcome =
  Readonly<{ ok: true; state: DurableKillSwitchState }> | Readonly<{ ok: false; reason: string }>;

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

/**
 * Build durable armed Kill Switch state for persistence (W3-O04-b).
 * Does not execute halt, stop sessions, or wire admission — storage only.
 */
export function buildArmedKillSwitchState(input: {
  workspaceId: string;
  actorId: string;
  reason: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableKillSwitchState | null;
}): KillSwitchPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.actorId, 'actorId');
  assertNonEmpty(input.reason, 'reason');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior !== null && input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      workspaceId: input.workspaceId,
      armed: true,
      reason: input.reason.trim(),
      armedAt: input.recordedAt,
      armedByActorId: input.actorId,
      clearedAt: null,
      clearedByActorId: null,
      correlationId: input.correlationId ?? input.prior?.correlationId ?? null,
      schemaVersion: KILL_SWITCH_STATE_SCHEMA_VERSION,
      updatedAt: input.recordedAt,
    }),
  });
}

/**
 * Build durable cleared Kill Switch state for persistence (W3-O04-b).
 * Requires prior armed state — no synthetic clear while disarmed.
 */
export function buildClearedKillSwitchState(input: {
  workspaceId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  prior: DurableKillSwitchState | null;
}): KillSwitchPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.actorId, 'actorId');
  assertIso(input.recordedAt, 'recordedAt');

  if (input.prior === null) {
    return Object.freeze({ ok: false, reason: 'no_prior_state' });
  }
  if (input.prior.workspaceId !== input.workspaceId) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }
  if (!input.prior.armed) {
    return Object.freeze({ ok: false, reason: 'not_armed' });
  }

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      workspaceId: input.workspaceId,
      armed: false,
      reason: input.prior.reason,
      armedAt: input.prior.armedAt,
      armedByActorId: input.prior.armedByActorId,
      clearedAt: input.recordedAt,
      clearedByActorId: input.actorId,
      correlationId: input.correlationId ?? input.prior.correlationId,
      schemaVersion: KILL_SWITCH_STATE_SCHEMA_VERSION,
      updatedAt: input.recordedAt,
    }),
  });
}

export function isKillSwitchArmed(state: DurableKillSwitchState | null): boolean {
  return state?.armed === true;
}
