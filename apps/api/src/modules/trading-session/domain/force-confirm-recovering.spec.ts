import { describe, expect, it } from 'vitest';
import {
  decideForceConfirmRecovering,
  resolveDiscoveryResumeIntent,
} from './force-confirm-recovering';
import { discoverStartupRecoveryCandidate } from './startup-recovery-discovery';
import { createTradingSession, transitionSession, type TradingSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const at = '2026-07-30T08:00:00.000Z';
const recordedAt = '2026-07-30T08:00:01.000Z';

function sessionAt(status: TradingSessionStatus, id = 'session-1'): TradingSession {
  let current = createTradingSession({
    id,
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: `deployment-${id}`,
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${id}`,
    createdAt: at,
    recordedAt: at,
  });

  const path: TradingSessionStatus[] = [];
  switch (status) {
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
    case TradingSessionStatus.RECOVERING:
      path.push(
        TradingSessionStatus.STARTING,
        TradingSessionStatus.RUNNING,
        TradingSessionStatus.RECOVERING,
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
      at,
      next === TradingSessionStatus.FAILED ? { failureReason: 'test failure' } : {},
    );
  }
  return current;
}

describe('US290 — resolveDiscoveryResumeIntent', () => {
  it('maps STOPPING to STOPPED (E17 P0-2)', () => {
    expect(resolveDiscoveryResumeIntent(TradingSessionStatus.STOPPING)).toBe(
      TradingSessionStatus.STOPPED,
    );
  });

  it('maps PAUSED to PAUSED and RUNNING/STARTING to RUNNING', () => {
    expect(resolveDiscoveryResumeIntent(TradingSessionStatus.PAUSED)).toBe(
      TradingSessionStatus.PAUSED,
    );
    expect(resolveDiscoveryResumeIntent(TradingSessionStatus.RUNNING)).toBe(
      TradingSessionStatus.RUNNING,
    );
    expect(resolveDiscoveryResumeIntent(TradingSessionStatus.STARTING)).toBe(
      TradingSessionStatus.RUNNING,
    );
  });

  it('rejects inventing intent from already-RECOVERING', () => {
    expect(() => resolveDiscoveryResumeIntent(TradingSessionStatus.RECOVERING)).toThrow(
      /cannot resolve discovery resumeIntent/,
    );
  });
});

describe('US290 — decideForceConfirmRecovering', () => {
  it('does not force RECOVERING when discovery yields no_recovery_required (AC-3)', () => {
    const discovery = discoverStartupRecoveryCandidate([]);
    const result = decideForceConfirmRecovering({
      discovery,
      session: null,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('not_required');
    expect(result.transitioned).toBe(false);
    expect(result.nextSession).toBeNull();
    expect(result.evaluationAdmitted).toBe(false);
    expect(result.signalIntentEmitted).toBe(false);
  });

  it('forces RUNNING → RECOVERING with resumeIntent RUNNING (AC-1, AC-5)', () => {
    const session = sessionAt(TradingSessionStatus.RUNNING);
    const discovery = discoverStartupRecoveryCandidate([session]);
    const result = decideForceConfirmRecovering({
      discovery,
      session,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('forced');
    expect(result.transitioned).toBe(true);
    expect(result.preRecoveryStatus).toBe(TradingSessionStatus.RUNNING);
    expect(result.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(result.nextSession?.status).toBe(TradingSessionStatus.RECOVERING);
    expect(result.nextSession?.lease).toBeNull();
    expect(result.evaluationAdmitted).toBe(false);
    expect(result.signalIntentEmitted).toBe(false);
  });

  it('forces PAUSED → RECOVERING with resumeIntent PAUSED (AC-5)', () => {
    const session = sessionAt(TradingSessionStatus.PAUSED);
    const discovery = discoverStartupRecoveryCandidate([session]);
    const result = decideForceConfirmRecovering({
      discovery,
      session,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('forced');
    expect(result.preRecoveryStatus).toBe(TradingSessionStatus.PAUSED);
    expect(result.resumeIntent).toBe(TradingSessionStatus.PAUSED);
    expect(result.nextSession?.status).toBe(TradingSessionStatus.RECOVERING);
  });

  it('forces STARTING → RECOVERING with resumeIntent RUNNING (AC-1)', () => {
    const session = sessionAt(TradingSessionStatus.STARTING);
    const discovery = discoverStartupRecoveryCandidate([session]);
    const result = decideForceConfirmRecovering({
      discovery,
      session,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('forced');
    expect(result.preRecoveryStatus).toBe(TradingSessionStatus.STARTING);
    expect(result.resumeIntent).toBe(TradingSessionStatus.RUNNING);
  });

  it('forces STOPPING → RECOVERING with resumeIntent STOPPED (AC-4)', () => {
    const session = sessionAt(TradingSessionStatus.STOPPING);
    const discovery = discoverStartupRecoveryCandidate([session]);
    const result = decideForceConfirmRecovering({
      discovery,
      session,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('forced');
    expect(result.preRecoveryStatus).toBe(TradingSessionStatus.STOPPING);
    expect(result.resumeIntent).toBe(TradingSessionStatus.STOPPED);
    expect(result.nextSession?.status).toBe(TradingSessionStatus.RECOVERING);
  });

  it('confirms already-RECOVERING without inventing resumeIntent (AC-2, FR-4)', () => {
    const session = sessionAt(TradingSessionStatus.RECOVERING);
    const discovery = discoverStartupRecoveryCandidate([session]);
    const result = decideForceConfirmRecovering({
      discovery,
      session,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('confirmed');
    expect(result.transitioned).toBe(false);
    expect(result.nextSession).toBeNull();
    expect(result.resumeIntent).toBeNull();
    expect(result.toStatus).toBe(TradingSessionStatus.RECOVERING);
    expect(result.evaluationAdmitted).toBe(false);
  });

  it('preserves prior resumeIntent on idempotent confirm re-open', () => {
    const running = sessionAt(TradingSessionStatus.RUNNING);
    const discovery = discoverStartupRecoveryCandidate([running]);
    const forced = decideForceConfirmRecovering({
      discovery,
      session: running,
      recordedAt,
      priorOpen: null,
    });
    const recovering = forced.nextSession!;
    const rediscovery = discoverStartupRecoveryCandidate([recovering]);
    const confirmed = decideForceConfirmRecovering({
      discovery: rediscovery,
      session: recovering,
      recordedAt,
      priorOpen: forced,
    });
    expect(confirmed.action).toBe('confirmed');
    expect(confirmed.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(confirmed.preRecoveryStatus).toBe(TradingSessionStatus.RUNNING);
    expect(confirmed.transitioned).toBe(false);
  });

  it('blocks when loaded Session identity does not match candidate', () => {
    const eligible = sessionAt(TradingSessionStatus.RUNNING, 'session-1');
    const other = sessionAt(TradingSessionStatus.RUNNING, 'session-other');
    const discovery = discoverStartupRecoveryCandidate([eligible]);
    const result = decideForceConfirmRecovering({
      discovery,
      session: other,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('blocked');
    expect(result.reason).toBe('candidate_mismatch');
    expect(result.transitioned).toBe(false);
  });

  it('blocks terminal Sessions (AC-3)', () => {
    const stopped = sessionAt(TradingSessionStatus.STOPPED);
    const discovery = {
      outcome: 'recovery_candidate' as const,
      eligibleCount: 1,
      candidate: {
        sessionId: stopped.id,
        workspaceId: stopped.workspaceId,
        deploymentId: stopped.deploymentId,
        status: TradingSessionStatus.RUNNING,
        createdAt: stopped.createdAt,
      },
      eligibleSessionIds: [stopped.id],
      recoveringOpen: null,
    };
    const result = decideForceConfirmRecovering({
      discovery,
      session: stopped,
      recordedAt,
      priorOpen: null,
    });
    expect(result.action).toBe('blocked');
    expect(result.reason).toBe('ineligible_status');
    expect(result.transitioned).toBe(false);
  });
});
