import { describe, expect, it } from 'vitest';
import {
  isRecoveryEligibleStatus,
  RECOVERY_ELIGIBLE_SESSION_STATUSES,
  recoveryEligibleStatusValues,
} from './recovery-eligibility';
import {
  compareRecoveryCandidates,
  discoverStartupRecoveryCandidate,
} from './startup-recovery-discovery';
import { createTradingSession, transitionSession, type TradingSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const baseAt = '2026-07-30T08:00:00.000Z';

function session(input: {
  id: string;
  status: TradingSessionStatus;
  createdAt?: string;
  workspaceId?: string;
}): TradingSession {
  let current = createTradingSession({
    id: input.id,
    workspaceId: input.workspaceId ?? 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: `deployment-${input.id}`,
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${input.id}`,
    createdAt: input.createdAt ?? baseAt,
    recordedAt: input.createdAt ?? baseAt,
  });

  const path: TradingSessionStatus[] = [];
  switch (input.status) {
    case TradingSessionStatus.CREATED:
      break;
    case TradingSessionStatus.STARTING:
      path.push(TradingSessionStatus.STARTING);
      break;
    case TradingSessionStatus.RUNNING:
      path.push(TradingSessionStatus.STARTING, TradingSessionStatus.RUNNING);
      break;
    case TradingSessionStatus.PAUSED:
      path.push(
        TradingSessionStatus.STARTING,
        TradingSessionStatus.RUNNING,
        TradingSessionStatus.PAUSED,
      );
      break;
    case TradingSessionStatus.STOPPING:
      path.push(
        TradingSessionStatus.STARTING,
        TradingSessionStatus.RUNNING,
        TradingSessionStatus.STOPPING,
      );
      break;
    case TradingSessionStatus.STOPPED:
      path.push(
        TradingSessionStatus.STARTING,
        TradingSessionStatus.RUNNING,
        TradingSessionStatus.STOPPING,
        TradingSessionStatus.STOPPED,
      );
      break;
    case TradingSessionStatus.RECOVERING:
      path.push(
        TradingSessionStatus.STARTING,
        TradingSessionStatus.RUNNING,
        TradingSessionStatus.RECOVERING,
      );
      break;
    case TradingSessionStatus.FAILED:
      path.push(TradingSessionStatus.STARTING, TradingSessionStatus.FAILED);
      break;
    default:
      break;
  }

  for (const next of path) {
    current = transitionSession(
      current,
      next,
      input.createdAt ?? baseAt,
      next === TradingSessionStatus.FAILED ? { failureReason: 'test failure' } : {},
    );
  }

  // Preserve createdAt from input (transitionSession does not change it).
  return Object.freeze({ ...current, createdAt: input.createdAt ?? baseAt });
}

describe('US240 — recovery eligibility', () => {
  it('marks E17 non-terminal discovery statuses eligible', () => {
    expect(isRecoveryEligibleStatus(TradingSessionStatus.STARTING)).toBe(true);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.RUNNING)).toBe(true);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.PAUSED)).toBe(true);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.RECOVERING)).toBe(true);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.STOPPING)).toBe(true);
  });

  it('rejects terminal and non-discovery statuses', () => {
    expect(isRecoveryEligibleStatus(TradingSessionStatus.STOPPED)).toBe(false);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.FAILED)).toBe(false);
    expect(isRecoveryEligibleStatus(TradingSessionStatus.CREATED)).toBe(false);
  });

  it('exposes a deterministic sorted eligible status list', () => {
    const values = recoveryEligibleStatusValues();
    expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b)));
    expect(new Set(values)).toEqual(RECOVERY_ELIGIBLE_SESSION_STATUSES);
  });
});

describe('US240 — startup recovery discovery (pure)', () => {
  it('returns no_recovery_required when there is no candidate', () => {
    const result = discoverStartupRecoveryCandidate([]);
    expect(result).toEqual({
      outcome: 'no_recovery_required',
      eligibleCount: 0,
      candidate: null,
      eligibleSessionIds: [],
      recoveringOpen: null,
    });
  });

  it('returns no_recovery_required when only terminal Sessions exist', () => {
    const result = discoverStartupRecoveryCandidate([
      session({ id: 's-stopped', status: TradingSessionStatus.STOPPED }),
      session({ id: 's-failed', status: TradingSessionStatus.FAILED }),
      session({ id: 's-created', status: TradingSessionStatus.CREATED }),
    ]);
    expect(result.outcome).toBe('no_recovery_required');
    expect(result.eligibleCount).toBe(0);
    expect(result.candidate).toBeNull();
    expect(result.eligibleSessionIds).toEqual([]);
  });

  it('selects a single eligible candidate', () => {
    const running = session({ id: 's-running', status: TradingSessionStatus.RUNNING });
    const result = discoverStartupRecoveryCandidate([
      session({ id: 's-stopped', status: TradingSessionStatus.STOPPED }),
      running,
    ]);
    expect(result.outcome).toBe('recovery_candidate');
    expect(result.eligibleCount).toBe(1);
    expect(result.candidate).toEqual({
      sessionId: 's-running',
      workspaceId: 'ws-1',
      deploymentId: 'deployment-s-running',
      status: TradingSessionStatus.RUNNING,
      createdAt: baseAt,
    });
    expect(result.eligibleSessionIds).toEqual(['s-running']);
  });

  it('selects exactly one candidate deterministically when multiple are eligible', () => {
    const newer = session({
      id: 's-b',
      status: TradingSessionStatus.PAUSED,
      createdAt: '2026-07-30T10:00:00.000Z',
    });
    const older = session({
      id: 's-a',
      status: TradingSessionStatus.RUNNING,
      createdAt: '2026-07-30T09:00:00.000Z',
    });
    const sameTimeLaterId = session({
      id: 's-c',
      status: TradingSessionStatus.STOPPING,
      createdAt: '2026-07-30T09:00:00.000Z',
    });

    const shuffled = [newer, sameTimeLaterId, older];
    const result = discoverStartupRecoveryCandidate(shuffled);

    expect(result.outcome).toBe('recovery_candidate');
    expect(result.eligibleCount).toBe(3);
    expect(result.candidate?.sessionId).toBe('s-a');
    expect(result.eligibleSessionIds).toEqual(['s-a', 's-c', 's-b']);

    // Same input order independence.
    const again = discoverStartupRecoveryCandidate([sameTimeLaterId, older, newer]);
    expect(again.candidate?.sessionId).toBe('s-a');
    expect(again.eligibleSessionIds).toEqual(result.eligibleSessionIds);
  });

  it('breaks ties by session id then workspace id', () => {
    const left = session({
      id: 'session-z',
      status: TradingSessionStatus.STARTING,
      createdAt: baseAt,
      workspaceId: 'ws-a',
    });
    const right = session({
      id: 'session-a',
      status: TradingSessionStatus.RECOVERING,
      createdAt: baseAt,
      workspaceId: 'ws-b',
    });
    expect(compareRecoveryCandidates(left, right)).toBeGreaterThan(0);
    const result = discoverStartupRecoveryCandidate([left, right]);
    expect(result.candidate?.sessionId).toBe('session-a');
  });
});
