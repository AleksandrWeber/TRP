/**
 * FIV-CONN-04-B-01 — Migration Gate Contract (pure types + helpers).
 *
 * Contract surface only. Does not persist a durable lease, enforce
 * ConnectionsService deny hooks, mutate Connection.environment, Vault, or
 * credentials, or perform external I/O.
 *
 * Durable SoT + same-transaction fencing CAS → B-02 / 04-D.
 * Lifecycle deny hooks → B-03.
 *
 * CHECK-THEN-SAVE ALONE IS FORBIDDEN for protected mutation.
 * Future protected writes require: valid gate + current fencing + same-txn CAS.
 */

/** Global gate identity — not workspace / provider / environment / Connection scoped. */
export const MIGRATION_GATE_KEY_FIV_CONN_04 = 'FIV-CONN-04' as const;
export type MigrationGateKey = typeof MIGRATION_GATE_KEY_FIV_CONN_04;

/** Sole approved purpose — not a generic maintenance / trading / emergency lock. */
export const MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL =
  'FIV_CONN_04_MIGRATION_BACKFILL' as const;
export type MigrationGatePurpose = typeof MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL;

/** Maximum authorized migration window (TTL may be shorter; heartbeat must not exceed). */
export const MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 * Soft re-acquire is forbidden. When the durable gate is already held by
 * another (or same) owner under active authority, acquire MUST return
 * CONTENTION — no wait, queue, blind retry, or silent takeover.
 * Stale reclaim belongs to B-02 lease semantics only.
 */
export const MIGRATION_GATE_NO_SOFT_REACQUIRE = true as const;

export const MIGRATION_GATE_OBSERVATIONS = Object.freeze([
  'INACTIVE',
  'ACTIVE',
  'EXPIRED',
  'OWNERSHIP_LOST',
  'CONTENTION_DENIED',
  'UNKNOWN',
] as const);

export type MigrationGateObservation = (typeof MIGRATION_GATE_OBSERVATIONS)[number];

export const MIGRATION_GATE_REASON_CODES = Object.freeze([
  'GATE_OK',
  'GATE_UNKNOWN',
  'GATE_INACTIVE',
  'GATE_EXPIRED',
  'GATE_OWNERSHIP_LOST',
  'GATE_FENCE_MISMATCH',
  'GATE_PURPOSE_MISMATCH',
  'GATE_KEY_MISMATCH',
  'GATE_MALFORMED_GRANT',
  'GATE_CONTENTION',
  'GATE_UNAUTHORIZED',
  'GATE_MAX_WINDOW_EXCEEDED',
  'GATE_ALREADY_INACTIVE',
  'GATE_HEARTBEAT_REJECTED',
] as const);

export type MigrationGateReasonCode = (typeof MIGRATION_GATE_REASON_CODES)[number];

/**
 * Authority grant representation (in-memory contract claim).
 * Client-supplied fields are claims only — never authoritative without B-02 SoT.
 * Use `fenceGeneration` (never `fencingToken`) for auditable fencing reference.
 */
export type MigrationGateGrant = Readonly<{
  gateKey: MigrationGateKey;
  purpose: MigrationGatePurpose;
  /** Owner / holder identity for release, heartbeat, and 04-D. */
  holderId: string;
  /** Monotonic fencing generation — durable bump owned by B-02. */
  fenceGeneration: number;
  /** ISO-8601 — hard ceiling anchor. */
  acquiredAt: string;
  /** ISO-8601 — TTL liveness tip. */
  expiresAt: string;
  /** Declared ceiling duration in ms; must be > 0 and ≤ 4h. */
  authorizedWindowMs: number;
  correlationId?: string;
}>;

export type PrivilegedActorKind = 'SYSTEM_JOB' | 'OPERATOR';

/** Privileged acquire/release context — not a replacement for VaultConnections. */
export type PrivilegedActorContext = Readonly<{
  actorId: string;
  actorKind: PrivilegedActorKind;
  correlationId?: string;
}>;

export const MIGRATION_GATE_DENIED_OPERATIONS = Object.freeze([
  'CREDENTIAL_STORE',
  'CREDENTIAL_REPLACE',
  'CREDENTIAL_REVOKE',
  'EXCHANGE_CREATE',
] as const);

export type MigrationGateDeniedOperation = (typeof MIGRATION_GATE_DENIED_OPERATIONS)[number];

export const MIGRATION_GATE_ALLOWED_OPERATIONS = Object.freeze([
  'RENAME',
  'DISCONNECT',
  'DISABLE',
  'NON_EXCHANGE_CREATE',
  'READ',
  'VALIDATE',
] as const);

export type MigrationGateAllowedOperation = (typeof MIGRATION_GATE_ALLOWED_OPERATIONS)[number];

export const MIGRATION_GATE_PRIVILEGED_OPERATIONS = Object.freeze([
  'PRIVILEGED_ENVIRONMENT_UPDATE',
] as const);

export type MigrationGatePrivilegedOperation =
  (typeof MIGRATION_GATE_PRIVILEGED_OPERATIONS)[number];

export type MigrationGateOperationClassification =
  | { kind: 'deny'; operation: MigrationGateDeniedOperation }
  | { kind: 'allow'; operation: MigrationGateAllowedOperation }
  | { kind: 'privileged'; operation: MigrationGatePrivilegedOperation }
  | { kind: 'deny_public_environment_update' }
  | { kind: 'unknown_method' };

export type MigrationGateOk<T> = Readonly<{ ok: true; value: T }>;
export type MigrationGateErr = Readonly<{
  ok: false;
  reason: MigrationGateReasonCode;
  observation?: MigrationGateObservation;
}>;
export type MigrationGateResult<T> = MigrationGateOk<T> | MigrationGateErr;

export const MIGRATION_GATE_AUDIT_EVENT_TYPE = 'connection.migration-gate' as const;

export const MIGRATION_GATE_AUDIT_OUTCOMES = Object.freeze([
  'gate_acquired',
  'gate_acquire_denied',
  'lifecycle_mutation_blocked',
  'gate_released',
  'gate_expired',
  'gate_heartbeat_failed',
  'gate_fencing_rejected',
  'gate_stale_reclaim',
  'lease_expired_reclaim',
  'stale_holder_rejected',
  'acquire_timeout',
  'heartbeat_rejected',
] as const);

export type MigrationGateAuditOutcome = (typeof MIGRATION_GATE_AUDIT_OUTCOMES)[number];

/** Safe audit payload fields — never secrets, credentials, or fencingToken. */
export const MIGRATION_GATE_AUDIT_SAFE_PAYLOAD_KEYS = Object.freeze([
  'gateKey',
  'purpose',
  'holderId',
  'fenceGeneration',
  'acquiredAt',
  'expiresAt',
  'authorizedWindowMs',
  'operation',
  'result',
  'reasonCode',
  'correlationId',
  'workspaceId',
  'connectionId',
  'outcome',
  'observation',
] as const);

const FORBIDDEN_AUDIT_KEY =
  /password|passwd|token|hash|secret|cookie|authorization|credential|wrapping|fencingToken/i;

export type ConnectionMutationMethod =
  | 'storeCredentials'
  | 'replaceCredentials'
  | 'revoke'
  | 'create'
  | 'rename'
  | 'disconnect'
  | 'disable'
  | 'validate'
  | 'list'
  | 'get'
  | 'catalog'
  | 'updateEnvironment'
  | 'privilegedEnvironmentUpdate';

function ok<T>(value: T): MigrationGateOk<T> {
  return Object.freeze({ ok: true, value });
}

function err(
  reason: MigrationGateReasonCode,
  observation?: MigrationGateObservation,
): MigrationGateErr {
  return Object.freeze(
    observation === undefined ? { ok: false, reason } : { ok: false, reason, observation },
  );
}

/** Hard ceiling instant derived from grant (authorizedUntil conceptual field). */
export function computeAuthorizedUntilMs(
  grant: Pick<MigrationGateGrant, 'acquiredAt' | 'authorizedWindowMs'>,
): number | null {
  const acquiredMs = Date.parse(grant.acquiredAt);
  if (!Number.isFinite(acquiredMs)) return null;
  if (!Number.isFinite(grant.authorizedWindowMs)) return null;
  return acquiredMs + grant.authorizedWindowMs;
}

export function computeAuthorizedUntilIso(
  grant: Pick<MigrationGateGrant, 'acquiredAt' | 'authorizedWindowMs'>,
): string | null {
  const until = computeAuthorizedUntilMs(grant);
  if (until === null) return null;
  return new Date(until).toISOString();
}

/**
 * Deny-set lifecycle mutations are blocked when observation is ACTIVE or UNKNOWN.
 * UNKNOWN must never map to ALLOW.
 */
export function isDenySetBlocked(observation: MigrationGateObservation): boolean {
  switch (observation) {
    case 'ACTIVE':
    case 'UNKNOWN':
      return true;
    case 'INACTIVE':
    case 'EXPIRED':
    case 'OWNERSHIP_LOST':
    case 'CONTENTION_DENIED':
      return false;
    default: {
      const _exhaustive: never = observation;
      return _exhaustive;
    }
  }
}

/**
 * Observation alone is never permission. Missing/unreadable SoT → UNKNOWN → DENY.
 */
export function observationToDenySetDecision(
  observation: MigrationGateObservation | null | undefined,
): MigrationGateResult<'allow' | 'deny'> {
  if (observation === null || observation === undefined) {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  if (observation === 'UNKNOWN') {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  if (isDenySetBlocked(observation)) {
    return ok('deny');
  }
  return ok('allow');
}

export function isValidAuthorizedWindowMs(authorizedWindowMs: number): boolean {
  return (
    Number.isFinite(authorizedWindowMs) &&
    authorizedWindowMs > 0 &&
    authorizedWindowMs <= MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS
  );
}

/**
 * Pure time/window coherence check.
 * TTL (expiresAt) must not exceed acquiredAt + authorizedWindowMs.
 */
export function assertMaxWindow(input: {
  acquiredAt: string;
  expiresAt: string;
  authorizedWindowMs: number;
  nowMs?: number;
}): MigrationGateResult<{ authorizedUntilMs: number }> {
  if (!isValidAuthorizedWindowMs(input.authorizedWindowMs)) {
    return err('GATE_MAX_WINDOW_EXCEEDED');
  }
  const acquiredMs = Date.parse(input.acquiredAt);
  const expiresMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(acquiredMs) || !Number.isFinite(expiresMs)) {
    return err('GATE_MALFORMED_GRANT');
  }
  if (expiresMs < acquiredMs) {
    return err('GATE_MALFORMED_GRANT');
  }
  const authorizedUntilMs = acquiredMs + input.authorizedWindowMs;
  if (expiresMs > authorizedUntilMs) {
    return err('GATE_MAX_WINDOW_EXCEEDED');
  }
  if (input.nowMs !== undefined && Number.isFinite(input.nowMs) && expiresMs < input.nowMs) {
    return err('GATE_EXPIRED', 'EXPIRED');
  }
  return ok({ authorizedUntilMs });
}

/**
 * Heartbeat may extend expiresAt only up to the hard ceiling.
 * Must not resurrect an already-expired grant.
 */
export function assertHeartbeatCeiling(input: {
  grant: MigrationGateGrant;
  proposedExpiresAt: string;
  nowMs: number;
}): MigrationGateResult<{ newExpiresAt: string }> {
  const shape = classifyGrantShape(input.grant);
  if (!shape.ok) return shape;

  const acquiredMs = Date.parse(input.grant.acquiredAt);
  const currentExpiresMs = Date.parse(input.grant.expiresAt);
  const proposedMs = Date.parse(input.proposedExpiresAt);
  if (!Number.isFinite(proposedMs)) {
    return err('GATE_MALFORMED_GRANT');
  }
  if (currentExpiresMs < input.nowMs) {
    return err('GATE_EXPIRED', 'EXPIRED');
  }
  const ceiling = acquiredMs + input.grant.authorizedWindowMs;
  if (proposedMs > ceiling) {
    return err('GATE_MAX_WINDOW_EXCEEDED');
  }
  if (proposedMs < input.nowMs) {
    return err('GATE_EXPIRED', 'EXPIRED');
  }
  return ok({ newExpiresAt: new Date(proposedMs).toISOString() });
}

export function classifyGrantShape(grant: unknown): MigrationGateResult<MigrationGateGrant> {
  if (grant === null || typeof grant !== 'object') {
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }
  const g = grant as Record<string, unknown>;
  if (g.gateKey !== MIGRATION_GATE_KEY_FIV_CONN_04) {
    return err(
      g.gateKey === undefined || g.gateKey === null ? 'GATE_MALFORMED_GRANT' : 'GATE_KEY_MISMATCH',
      'UNKNOWN',
    );
  }
  if (g.purpose !== MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL) {
    return err(
      g.purpose === undefined || g.purpose === null
        ? 'GATE_MALFORMED_GRANT'
        : 'GATE_PURPOSE_MISMATCH',
      'UNKNOWN',
    );
  }
  if (typeof g.holderId !== 'string' || g.holderId.trim() === '') {
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }
  if (
    typeof g.fenceGeneration !== 'number' ||
    !Number.isInteger(g.fenceGeneration) ||
    g.fenceGeneration < 0
  ) {
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }
  if (typeof g.acquiredAt !== 'string' || !Number.isFinite(Date.parse(g.acquiredAt))) {
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }
  if (typeof g.expiresAt !== 'string' || !Number.isFinite(Date.parse(g.expiresAt))) {
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }
  if (
    typeof g.authorizedWindowMs !== 'number' ||
    !isValidAuthorizedWindowMs(g.authorizedWindowMs)
  ) {
    return err(
      typeof g.authorizedWindowMs === 'number' &&
        g.authorizedWindowMs > MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS
        ? 'GATE_MAX_WINDOW_EXCEEDED'
        : 'GATE_MALFORMED_GRANT',
      'UNKNOWN',
    );
  }
  const windowCheck = assertMaxWindow({
    acquiredAt: g.acquiredAt,
    expiresAt: g.expiresAt,
    authorizedWindowMs: g.authorizedWindowMs,
  });
  if (!windowCheck.ok) {
    return err(windowCheck.reason, 'UNKNOWN');
  }
  if ('fencingToken' in g || Object.keys(g).some((k) => /fencingToken/i.test(k))) {
    // fencingToken is forbidden as authority / audit field.
    return err('GATE_MALFORMED_GRANT', 'UNKNOWN');
  }

  const normalized: MigrationGateGrant = Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: g.holderId.trim(),
    fenceGeneration: g.fenceGeneration,
    acquiredAt: g.acquiredAt,
    expiresAt: g.expiresAt,
    authorizedWindowMs: g.authorizedWindowMs,
    ...(typeof g.correlationId === 'string' ? { correlationId: g.correlationId } : {}),
  });
  return ok(normalized);
}

/**
 * Pure grant vs expected durable claims validation (contract-level).
 * Does not query DB. B-02 must still perform same-txn CAS for writes.
 */
export function validateGrantAgainstClaims(input: {
  grant: unknown;
  expectedHolderId?: string;
  expectedFenceGeneration?: number;
  observation: MigrationGateObservation | null | undefined;
  nowMs: number;
}): MigrationGateResult<MigrationGateGrant> {
  if (input.observation === null || input.observation === undefined) {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  if (input.observation === 'UNKNOWN') {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  if (input.observation === 'CONTENTION_DENIED') {
    return err('GATE_CONTENTION', 'CONTENTION_DENIED');
  }

  const shaped = classifyGrantShape(input.grant);
  if (!shaped.ok) return shaped;
  const grant = shaped.value;

  if (input.observation === 'INACTIVE') {
    return err('GATE_INACTIVE', 'INACTIVE');
  }
  if (input.observation === 'EXPIRED') {
    return err('GATE_EXPIRED', 'EXPIRED');
  }
  if (input.observation === 'OWNERSHIP_LOST') {
    return err('GATE_OWNERSHIP_LOST', 'OWNERSHIP_LOST');
  }

  // ACTIVE path
  if (input.observation !== 'ACTIVE') {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }

  const expiresMs = Date.parse(grant.expiresAt);
  if (expiresMs < input.nowMs) {
    return err('GATE_EXPIRED', 'EXPIRED');
  }

  if (input.expectedHolderId !== undefined && grant.holderId !== input.expectedHolderId) {
    return err('GATE_OWNERSHIP_LOST', 'OWNERSHIP_LOST');
  }
  if (
    input.expectedFenceGeneration !== undefined &&
    grant.fenceGeneration !== input.expectedFenceGeneration
  ) {
    return err('GATE_FENCE_MISMATCH', 'OWNERSHIP_LOST');
  }

  return ok(grant);
}

/**
 * Classify ConnectionsService-facing mutations for future B-03 hooks.
 * Pure — does not enforce.
 */
export function classifyConnectionMutation(input: {
  method: ConnectionMutationMethod;
  connectionType?: string;
}): MigrationGateOperationClassification {
  switch (input.method) {
    case 'storeCredentials':
      return { kind: 'deny', operation: 'CREDENTIAL_STORE' };
    case 'replaceCredentials':
      return { kind: 'deny', operation: 'CREDENTIAL_REPLACE' };
    case 'revoke':
      return { kind: 'deny', operation: 'CREDENTIAL_REVOKE' };
    case 'create':
      if (input.connectionType === 'EXCHANGE') {
        return { kind: 'deny', operation: 'EXCHANGE_CREATE' };
      }
      return { kind: 'allow', operation: 'NON_EXCHANGE_CREATE' };
    case 'rename':
      return { kind: 'allow', operation: 'RENAME' };
    case 'disconnect':
      return { kind: 'allow', operation: 'DISCONNECT' };
    case 'disable':
      return { kind: 'allow', operation: 'DISABLE' };
    case 'validate':
      return { kind: 'allow', operation: 'VALIDATE' };
    case 'list':
    case 'get':
    case 'catalog':
      return { kind: 'allow', operation: 'READ' };
    case 'updateEnvironment':
      return { kind: 'deny_public_environment_update' };
    case 'privilegedEnvironmentUpdate':
      return { kind: 'privileged', operation: 'PRIVILEGED_ENVIRONMENT_UPDATE' };
    default: {
      const _exhaustive: never = input.method;
      return _exhaustive;
    }
  }
}

/**
 * Whether a deny-classified mutation must be blocked given observation.
 * UNKNOWN ⇒ DENY. Never UNKNOWN ⇒ ALLOW.
 */
export function shouldBlockDenySetMutation(
  observation: MigrationGateObservation | null | undefined,
  classification: MigrationGateOperationClassification,
): MigrationGateResult<'block' | 'pass'> {
  if (classification.kind === 'allow') {
    return ok('pass');
  }
  if (classification.kind === 'deny_public_environment_update') {
    return ok('block');
  }
  if (classification.kind === 'privileged') {
    // Privileged path uses assertPrivilegedEnvironmentUpdateAllowed, not deny-set.
    return ok('pass');
  }
  if (classification.kind === 'unknown_method') {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  // deny-set
  const decision = observationToDenySetDecision(observation);
  if (!decision.ok) {
    return err(decision.reason, decision.observation ?? 'UNKNOWN');
  }
  return ok(decision.value === 'deny' ? 'block' : 'pass');
}

/**
 * 04-D privileged environment UPDATE assertion — pure contract only.
 * Does NOT query/update DB, Vault, or perform fencing CAS.
 * CHECK-THEN-SAVE ALONE IS FORBIDDEN; caller must still CAS in same txn (B-02/04-D).
 */
export function assertPrivilegedEnvironmentUpdateAllowed(input: {
  observation: MigrationGateObservation | null | undefined;
  grant: unknown;
  expectedHolderId: string;
  expectedFenceGeneration: number;
  nowMs: number;
}): MigrationGateResult<MigrationGateGrant> {
  if (input.observation === null || input.observation === undefined) {
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }
  if (input.observation !== 'ACTIVE') {
    if (input.observation === 'UNKNOWN') {
      return err('GATE_UNKNOWN', 'UNKNOWN');
    }
    if (input.observation === 'EXPIRED') {
      return err('GATE_EXPIRED', 'EXPIRED');
    }
    if (input.observation === 'OWNERSHIP_LOST') {
      return err('GATE_OWNERSHIP_LOST', 'OWNERSHIP_LOST');
    }
    if (input.observation === 'INACTIVE') {
      return err('GATE_INACTIVE', 'INACTIVE');
    }
    if (input.observation === 'CONTENTION_DENIED') {
      return err('GATE_CONTENTION', 'CONTENTION_DENIED');
    }
    return err('GATE_UNKNOWN', 'UNKNOWN');
  }

  return validateGrantAgainstClaims({
    grant: input.grant,
    expectedHolderId: input.expectedHolderId,
    expectedFenceGeneration: input.expectedFenceGeneration,
    observation: 'ACTIVE',
    nowMs: input.nowMs,
  });
}

export function isPrivilegedActorContext(actor: unknown): actor is PrivilegedActorContext {
  if (actor === null || typeof actor !== 'object') return false;
  const a = actor as Record<string, unknown>;
  if (typeof a.actorId !== 'string' || a.actorId.trim() === '') return false;
  if (a.actorKind !== 'SYSTEM_JOB' && a.actorKind !== 'OPERATOR') return false;
  if (a.correlationId !== undefined && typeof a.correlationId !== 'string') return false;
  return true;
}

/**
 * Acquire input contract checks (pure). Durable contention is B-02.
 * No soft re-acquire: callers must treat CONTENTION as terminal for this attempt.
 */
export function assertAcquireInput(input: {
  purpose: unknown;
  actor: unknown;
  requestedTtlMs?: number;
}): MigrationGateResult<{
  purpose: MigrationGatePurpose;
  actor: PrivilegedActorContext;
  requestedTtlMs?: number;
}> {
  if (!isPrivilegedActorContext(input.actor)) {
    return err('GATE_UNAUTHORIZED');
  }
  if (input.purpose !== MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL) {
    return err('GATE_PURPOSE_MISMATCH');
  }
  if (input.requestedTtlMs !== undefined) {
    if (!Number.isFinite(input.requestedTtlMs) || input.requestedTtlMs <= 0) {
      return err('GATE_MALFORMED_GRANT');
    }
    if (input.requestedTtlMs > MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS) {
      return err('GATE_MAX_WINDOW_EXCEEDED');
    }
  }
  return ok({
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    actor: Object.freeze({
      actorId: input.actor.actorId.trim(),
      actorKind: input.actor.actorKind,
      ...(input.actor.correlationId !== undefined
        ? { correlationId: input.actor.correlationId }
        : {}),
    }),
    ...(input.requestedTtlMs !== undefined ? { requestedTtlMs: input.requestedTtlMs } : {}),
  });
}

/** Contention result shape — immediate deterministic rejection (no wait/queue/retry). */
export function contentionDeniedResult(): MigrationGateErr {
  return err('GATE_CONTENTION', 'CONTENTION_DENIED');
}

export function sanitizeMigrationGateAuditPayload(
  payload: Readonly<Record<string, unknown>>,
): MigrationGateResult<Readonly<Record<string, unknown>>> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_AUDIT_KEY.test(key)) {
      return err('GATE_MALFORMED_GRANT');
    }
    if (!(MIGRATION_GATE_AUDIT_SAFE_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    safe[key] = value;
  }
  return ok(Object.freeze(safe));
}

export function isMigrationGateAuditOutcome(value: string): value is MigrationGateAuditOutcome {
  return (MIGRATION_GATE_AUDIT_OUTCOMES as readonly string[]).includes(value);
}
