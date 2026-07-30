import { describe, expect, it } from 'vitest';
import {
  attachRecoveryLease,
  decideRecoveryLeaseAcquisition,
  toAcquisitionResult,
} from './recovery-lease-acquisition';
import { createSessionLease } from './session-lease';
import type { RecoveryCandidate } from './startup-recovery-discovery';
import {
  attachLease,
  createTradingSession,
  transitionSession,
  type TradingSession,
} from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const now = '2026-07-30T12:00:00.000Z';
const earlier = '2026-07-30T11:59:00.000Z';
const laterExpiry = '2026-07-30T12:00:30.000Z';
const pastExpiry = '2026-07-30T11:59:30.000Z';

function candidateFor(session: TradingSession): RecoveryCandidate {
  return Object.freeze({
    sessionId: session.id,
    workspaceId: session.workspaceId,
    deploymentId: session.deploymentId,
    status: session.status,
    createdAt: session.createdAt,
  });
}

function runningSession(id = 'session-1'): TradingSession {
  const created = createTradingSession({
    id,
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${id}`,
    createdAt: earlier,
    recordedAt: earlier,
  });
  return transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, earlier),
    TradingSessionStatus.RUNNING,
    earlier,
  );
}

function withLease(
  session: TradingSession,
  ownerId: string,
  expiresAt: string,
  previousToken = 0,
): TradingSession {
  const lease = createSessionLease({
    ownerId,
    acquiredAt: earlier,
    expiresAt,
    previousToken,
  });
  return attachLease(session, lease);
}

describe('US241 — recovery lease acquisition (pure)', () => {
  it('acquires when lease is missing', () => {
    const session = runningSession();
    const decision = decideRecoveryLeaseAcquisition(session, {
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision.outcome).toBe('LEASE_ACQUIRED');
    if (decision.outcome !== 'LEASE_ACQUIRED') return;
    expect(decision.reason).toBe('missing_lease');
    expect(decision.lease.ownerId).toBe('runtime-a');
    expect(decision.lease.fencingToken).toBe(1);
    expect(decision.next.status).toBe(TradingSessionStatus.RUNNING);
    expect(decision.next.version).toBe(session.version + 1);
    expect(decision.expectedVersion).toBe(session.version);
  });

  it('acquires when existing lease is expired', () => {
    const session = withLease(runningSession(), 'runtime-old', pastExpiry, 3);
    const decision = decideRecoveryLeaseAcquisition(session, {
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision.outcome).toBe('LEASE_ACQUIRED');
    if (decision.outcome !== 'LEASE_ACQUIRED') return;
    expect(decision.reason).toBe('expired_lease');
    expect(decision.lease.fencingToken).toBe(session.lastFencingToken + 1);
    expect(decision.lease.ownerId).toBe('runtime-a');
  });

  it('denies when another owner holds a non-expired lease', () => {
    const session = withLease(runningSession(), 'runtime-b', laterExpiry, 1);
    const decision = decideRecoveryLeaseAcquisition(session, {
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision).toEqual(
      expect.objectContaining({
        outcome: 'LEASE_DENIED',
        reason: 'active_foreign_lease',
        currentOwnerId: 'runtime-b',
        currentFencingToken: 2,
      }),
    );
  });

  it('re-acquires with a new fence when the same owner already holds the lease', () => {
    const session = withLease(runningSession(), 'runtime-a', laterExpiry, 4);
    const decision = decideRecoveryLeaseAcquisition(session, {
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision.outcome).toBe('LEASE_ACQUIRED');
    if (decision.outcome !== 'LEASE_ACQUIRED') return;
    expect(decision.reason).toBe('same_owner_reacquire');
    expect(decision.lease.fencingToken).toBe(session.lastFencingToken + 1);
  });

  it('denies when session is missing or candidate mismatches', () => {
    expect(
      decideRecoveryLeaseAcquisition(null, {
        candidate: {
          sessionId: 'missing',
          workspaceId: 'ws-1',
          deploymentId: 'd-1',
          status: TradingSessionStatus.RUNNING,
          createdAt: earlier,
        },
        ownerId: 'runtime-a',
        nowIso: now,
        recordedAt: now,
      }).reason,
    ).toBe('session_not_found');

    const session = runningSession();
    const decision = decideRecoveryLeaseAcquisition(session, {
      candidate: { ...candidateFor(session), sessionId: 'other' },
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision.reason).toBe('candidate_mismatch');
  });

  it('denies ineligible / terminal status without mutating lease plan', () => {
    let stopped = runningSession();
    stopped = transitionSession(stopped, TradingSessionStatus.STOPPING, now);
    stopped = transitionSession(stopped, TradingSessionStatus.STOPPED, now);
    const decision = decideRecoveryLeaseAcquisition(stopped, {
      candidate: {
        sessionId: stopped.id,
        workspaceId: stopped.workspaceId,
        deploymentId: stopped.deploymentId,
        status: TradingSessionStatus.RUNNING,
        createdAt: stopped.createdAt,
      },
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(decision.outcome).toBe('LEASE_DENIED');
    expect(decision.reason).toBe('ineligible_status');
  });

  it('maps CAS conflict to LEASE_DENIED deterministically', () => {
    const session = runningSession();
    const command = {
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    };
    const decision = decideRecoveryLeaseAcquisition(session, command);
    const result = toAcquisitionResult(decision, command, true);
    expect(result).toEqual({
      outcome: 'LEASE_DENIED',
      reason: 'version_conflict',
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      ownerId: 'runtime-a',
      fencingToken: null,
      expiresAt: null,
      expectedVersion: session.version,
    });
  });

  it('concurrent pure decisions both plan acquire from the same snapshot; CAS selects one writer', () => {
    const session = runningSession();
    const candidate = candidateFor(session);
    const a = decideRecoveryLeaseAcquisition(session, {
      candidate,
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    const b = decideRecoveryLeaseAcquisition(session, {
      candidate,
      ownerId: 'runtime-b',
      nowIso: now,
      recordedAt: now,
    });
    expect(a.outcome).toBe('LEASE_ACQUIRED');
    expect(b.outcome).toBe('LEASE_ACQUIRED');
    if (a.outcome !== 'LEASE_ACQUIRED' || b.outcome !== 'LEASE_ACQUIRED') return;
    expect(a.expectedVersion).toBe(b.expectedVersion);
    expect(a.lease.fencingToken).toBe(b.lease.fencingToken);
    expect(a.lease.ownerId).not.toBe(b.lease.ownerId);
  });

  it('attachRecoveryLease does not change status', () => {
    const session = runningSession();
    const lease = createSessionLease({
      ownerId: 'runtime-a',
      acquiredAt: now,
      expiresAt: laterExpiry,
      previousToken: 0,
    });
    const next = attachRecoveryLease(session, lease, now);
    expect(next.status).toBe(session.status);
    expect(next.lease?.fencingToken).toBe(1);
    expect(next.version).toBe(session.version + 1);
  });
});
