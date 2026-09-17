/**
 * PROPOSED-V3-L01-S02 — Durable workspace live-policy domain state.
 *
 * Persistence foundation only.
 * LIVE_POLICY_OPTED_IN is policy posture only — not authorization, admission, or execution.
 */

export const WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION = 1;

/** Canonical semantic policy states (PO-S02-02). */
export enum WorkspaceLivePolicy {
  PAPER = 'PAPER',
  LIVE_POLICY_OPTED_IN = 'LIVE_POLICY_OPTED_IN',
}

export type DurableWorkspaceLivePolicyState = Readonly<{
  workspaceId: string;
  policy: WorkspaceLivePolicy;
  schemaVersion: number;
  updatedAt: string;
}>;

export type WorkspaceLivePolicyPersistenceOutcome =
  | Readonly<{ ok: true; state: DurableWorkspaceLivePolicyState }>
  | Readonly<{ ok: false; reason: string }>;

/**
 * Parse a persisted policy token. Invalid / unsupported values throw (PO-S02-05).
 * Never coerces unknown → LIVE_POLICY_OPTED_IN.
 */
export function parseWorkspaceLivePolicy(value: unknown): WorkspaceLivePolicy {
  if (value === WorkspaceLivePolicy.PAPER) {
    return WorkspaceLivePolicy.PAPER;
  }
  if (value === WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN) {
    return WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN;
  }
  throw new Error(`unsupported Workspace live policy: ${String(value)}`);
}

export function isWorkspaceLivePolicy(value: unknown): value is WorkspaceLivePolicy {
  return value === WorkspaceLivePolicy.PAPER || value === WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN;
}

/**
 * Resolve effective policy for application reads.
 * Missing / null state resolves to PAPER (never live). Invalid states must be rejected earlier.
 */
export function resolveEffectiveWorkspaceLivePolicy(
  state: DurableWorkspaceLivePolicyState | null,
): WorkspaceLivePolicy {
  if (state === null) {
    return WorkspaceLivePolicy.PAPER;
  }
  return state.policy;
}

/** True only when durable state is explicitly LIVE_POLICY_OPTED_IN. */
export function isLivePolicyOptedIn(state: DurableWorkspaceLivePolicyState | null): boolean {
  return state?.policy === WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN;
}

/**
 * Honesty helpers — persisted policy never grants live capability (S02).
 * Always false regardless of stored policy value.
 */
export function livePolicyAuthorizesLiveTrading(
  _state: DurableWorkspaceLivePolicyState | null,
): boolean {
  return false;
}

export function livePolicyAuthorizesAdmission(
  _state: DurableWorkspaceLivePolicyState | null,
): boolean {
  return false;
}

export function livePolicyAuthorizesExecution(
  _state: DurableWorkspaceLivePolicyState | null,
): boolean {
  return false;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ISO timestamp for ${label}: ${value}`);
  }
}

/** Build durable Paper-default state for a workspace (create / backfill / ensure). */
export function buildPaperLivePolicyState(input: {
  workspaceId: string;
  recordedAt: string;
}): WorkspaceLivePolicyPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertIso(input.recordedAt, 'recordedAt');

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      workspaceId: input.workspaceId.trim(),
      policy: WorkspaceLivePolicy.PAPER,
      schemaVersion: WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION,
      updatedAt: input.recordedAt,
    }),
  });
}

/**
 * Build durable policy state for persistence ports (S03 may later call with
 * LIVE_POLICY_OPTED_IN under authorization). S02 provides the builder only —
 * no Admin API / enablement path.
 */
export function buildWorkspaceLivePolicyState(input: {
  workspaceId: string;
  policy: WorkspaceLivePolicy;
  recordedAt: string;
  prior?: DurableWorkspaceLivePolicyState | null;
}): WorkspaceLivePolicyPersistenceOutcome {
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertIso(input.recordedAt, 'recordedAt');
  parseWorkspaceLivePolicy(input.policy);

  if (input.prior != null && input.prior.workspaceId !== input.workspaceId.trim()) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  return Object.freeze({
    ok: true,
    state: Object.freeze({
      workspaceId: input.workspaceId.trim(),
      policy: input.policy,
      schemaVersion: WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION,
      updatedAt: input.recordedAt,
    }),
  });
}
