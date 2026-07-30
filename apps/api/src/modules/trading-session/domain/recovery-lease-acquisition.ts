import { createSessionLease, isLeaseExpired, type SessionLease } from './session-lease';
import { isRecoveryEligibleStatus } from './recovery-eligibility';
import type { RecoveryCandidate } from './startup-recovery-discovery';
import type { TradingSession } from './trading-session';

/** Default recovery lease TTL (operational wall-clock only; ADR-014 / ADR-018 #53). */
export const DEFAULT_RECOVERY_LEASE_TTL_MS = 30_000;

export type RecoveryLeaseAcquireOutcome = 'LEASE_ACQUIRED' | 'LEASE_DENIED';

export type RecoveryLeaseDenyReason =
  | 'session_not_found'
  | 'candidate_mismatch'
  | 'ineligible_status'
  | 'active_foreign_lease'
  | 'version_conflict';

export type RecoveryLeaseAcquireReason = 'missing_lease' | 'expired_lease' | 'same_owner_reacquire';

export type RecoveryLeaseAcquireCommand = Readonly<{
  candidate: RecoveryCandidate;
  ownerId: string;
  nowIso: string;
  recordedAt: string;
  leaseTtlMs?: number;
}>;

/**
 * Pure decision before persistence (US241).
 * Does not load checkpoints, change Session status, or resume Runtime.
 */
export type RecoveryLeaseAcquireDecision =
  | Readonly<{
      outcome: 'LEASE_ACQUIRED';
      reason: RecoveryLeaseAcquireReason;
      expectedVersion: number;
      next: TradingSession;
      lease: SessionLease;
    }>
  | Readonly<{
      outcome: 'LEASE_DENIED';
      reason: RecoveryLeaseDenyReason;
      expectedVersion?: number;
      currentOwnerId?: string | null;
      currentFencingToken?: number | null;
    }>;

export type RecoveryLeaseAcquisitionResult = Readonly<{
  outcome: RecoveryLeaseAcquireOutcome;
  reason: RecoveryLeaseAcquireReason | RecoveryLeaseDenyReason;
  sessionId: string;
  workspaceId: string;
  ownerId: string;
  fencingToken: number | null;
  expiresAt: string | null;
  expectedVersion?: number;
}>;

/**
 * Attach a recovery lease without changing Session status.
 * Advances version for optimistic CAS (US241).
 */
export function attachRecoveryLease(
  session: TradingSession,
  lease: SessionLease,
  recordedAt: string,
): TradingSession {
  assertIso(recordedAt, 'recordedAt');
  return Object.freeze({
    ...session,
    lease,
    lastFencingToken: lease.fencingToken,
    recordedAt,
    version: session.version + 1,
  });
}

function leaseExpiry(nowIso: string, leaseTtlMs: number): string {
  if (!Number.isInteger(leaseTtlMs) || leaseTtlMs <= 0) {
    throw new Error('leaseTtlMs must be a positive integer');
  }
  return new Date(Date.parse(nowIso) + leaseTtlMs).toISOString();
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}

function requiredOwner(ownerId: string): string {
  const result = ownerId.trim();
  if (result === '') throw new Error('lease owner id is required');
  return result;
}

/**
 * Decide whether this runtime may acquire exclusive recovery ownership.
 *
 * Acquire when lease is missing, expired, or already owned by the same owner
 * (new fencing generation). Deny when another owner holds a non-expired lease.
 */
export function decideRecoveryLeaseAcquisition(
  session: TradingSession | null,
  command: RecoveryLeaseAcquireCommand,
): RecoveryLeaseAcquireDecision {
  const ownerId = requiredOwner(command.ownerId);
  const { candidate } = command;
  assertIso(command.nowIso, 'nowIso');
  assertIso(command.recordedAt, 'recordedAt');

  if (session === null) {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: 'session_not_found',
    });
  }

  if (session.id !== candidate.sessionId || session.workspaceId !== candidate.workspaceId) {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: 'candidate_mismatch',
      expectedVersion: session.version,
    });
  }

  if (!isRecoveryEligibleStatus(session.status)) {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: 'ineligible_status',
      expectedVersion: session.version,
    });
  }

  const ttl = command.leaseTtlMs ?? DEFAULT_RECOVERY_LEASE_TTL_MS;
  const activeForeign =
    session.lease !== null &&
    !isLeaseExpired(session.lease, command.nowIso) &&
    session.lease.ownerId !== ownerId;

  if (activeForeign) {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: 'active_foreign_lease',
      expectedVersion: session.version,
      currentOwnerId: session.lease!.ownerId,
      currentFencingToken: session.lease!.fencingToken,
    });
  }

  let reason: RecoveryLeaseAcquireReason;
  if (session.lease === null) {
    reason = 'missing_lease';
  } else if (isLeaseExpired(session.lease, command.nowIso)) {
    reason = 'expired_lease';
  } else {
    reason = 'same_owner_reacquire';
  }

  const lease = createSessionLease({
    ownerId,
    acquiredAt: command.nowIso,
    expiresAt: leaseExpiry(command.nowIso, ttl),
    previousToken: session.lastFencingToken,
  });
  const next = attachRecoveryLease(session, lease, command.recordedAt);

  return Object.freeze({
    outcome: 'LEASE_ACQUIRED',
    reason,
    expectedVersion: session.version,
    next,
    lease,
  });
}

export function toAcquisitionResult(
  decision: RecoveryLeaseAcquireDecision,
  command: RecoveryLeaseAcquireCommand,
  casConflict = false,
): RecoveryLeaseAcquisitionResult {
  if (casConflict) {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: 'version_conflict',
      sessionId: command.candidate.sessionId,
      workspaceId: command.candidate.workspaceId,
      ownerId: command.ownerId,
      fencingToken: null,
      expiresAt: null,
      expectedVersion: decision.outcome === 'LEASE_ACQUIRED' ? decision.expectedVersion : undefined,
    });
  }

  if (decision.outcome === 'LEASE_DENIED') {
    return Object.freeze({
      outcome: 'LEASE_DENIED',
      reason: decision.reason,
      sessionId: command.candidate.sessionId,
      workspaceId: command.candidate.workspaceId,
      ownerId: command.ownerId,
      fencingToken: decision.currentFencingToken ?? null,
      expiresAt: null,
      expectedVersion: decision.expectedVersion,
    });
  }

  return Object.freeze({
    outcome: 'LEASE_ACQUIRED',
    reason: decision.reason,
    sessionId: command.candidate.sessionId,
    workspaceId: command.candidate.workspaceId,
    ownerId: decision.lease.ownerId,
    fencingToken: decision.lease.fencingToken,
    expiresAt: decision.lease.expiresAt,
    expectedVersion: decision.expectedVersion,
  });
}
