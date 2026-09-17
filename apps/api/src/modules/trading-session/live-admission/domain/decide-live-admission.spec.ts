/**
 * PROPOSED-V3-L01-S04 — Fail-closed live admission evaluator tests.
 */

import { describe, expect, it } from 'vitest';
import {
  decideLiveAdmission,
  type DecideLiveAdmissionInput,
  type LiveAdmissionSessionInput,
} from './decide-live-admission';

const eligibleSession: LiveAdmissionSessionInput = Object.freeze({
  available: true,
  exists: true,
  workspaceMatches: true,
  lifecycleEligible: true,
  executionModeCompatible: true,
  actorContextMatches: true,
});

function base(overrides: Partial<DecideLiveAdmissionInput> = {}): DecideLiveAdmissionInput {
  return {
    workspaceId: 'ws-1',
    sessionId: 'sess-1',
    actorId: 'actor-1',
    evaluatedAt: '2026-09-17T12:00:00.000Z',
    liveCapitalAuthorized: true,
    paperFreezeBlocksLive: false,
    policy: 'LIVE_POLICY_OPTED_IN',
    killSwitch: 'inactive',
    authorization: 'allowed',
    session: eligibleSession,
    humanStart: 'valid',
    gate: 'pass',
    ...overrides,
  };
}

describe('decideLiveAdmission (PROPOSED-V3-L01-S04)', () => {
  it('T-01 PAPER denies', () => {
    const d = decideLiveAdmission(base({ policy: 'PAPER' }));
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('PAPER_POLICY');
  });

  it('T-02 LIVE_POLICY_OPTED_IN is necessary but insufficient alone', () => {
    const d = decideLiveAdmission(base({ humanStart: 'missing', policy: 'LIVE_POLICY_OPTED_IN' }));
    expect(d.allowed).toBe(false);
    expect(d.evaluatedPolicy).toBe('LIVE_POLICY_OPTED_IN');
  });

  it('T-03 missing policy cannot allow', () => {
    expect(decideLiveAdmission(base({ policy: 'MISSING' })).reason).toBe('POLICY_MISSING');
  });

  it('T-04 invalid policy cannot allow', () => {
    expect(decideLiveAdmission(base({ policy: 'INVALID' })).reason).toBe('POLICY_INVALID');
  });

  it('T-05 paperFreeze=true denies', () => {
    expect(decideLiveAdmission(base({ paperFreezeBlocksLive: true })).reason).toBe('PAPER_FREEZE');
  });

  it('T-06 liveCapitalAuthorized=false denies', () => {
    expect(decideLiveAdmission(base({ liveCapitalAuthorized: false })).reason).toBe(
      'LIVE_CAPITAL_NOT_AUTHORIZED',
    );
  });

  it('T-07 authorized admission context passes authorization prerequisite', () => {
    const d = decideLiveAdmission(base({ authorization: 'allowed' }));
    expect(d.allowed).toBe(true);
    expect(d.authorization).toBe('allowed');
  });

  it('T-08 unauthorized actor denies', () => {
    expect(decideLiveAdmission(base({ authorization: 'denied' })).reason).toBe(
      'AUTHORIZATION_DENIED',
    );
  });

  it('T-09 workspace mismatch denies', () => {
    expect(
      decideLiveAdmission(
        base({
          session: { ...eligibleSession, workspaceMatches: false },
        }),
      ).reason,
    ).toBe('SESSION_WORKSPACE_MISMATCH');
  });

  it('T-10 inactive Kill Switch allows evaluation to continue', () => {
    const d = decideLiveAdmission(base({ killSwitch: 'inactive' }));
    expect(d.allowed).toBe(true);
    expect(d.killSwitch).toBe('inactive');
  });

  it('T-11 active Kill Switch denies', () => {
    expect(decideLiveAdmission(base({ killSwitch: 'active' })).reason).toBe('KILL_SWITCH_ACTIVE');
  });

  it('T-12 unknown Kill Switch denies', () => {
    expect(decideLiveAdmission(base({ killSwitch: 'unknown' })).reason).toBe('KILL_SWITCH_UNKNOWN');
  });

  it('T-13 unavailable Kill Switch errors (not allow)', () => {
    const d = decideLiveAdmission(base({ killSwitch: 'unavailable' }));
    expect(d.allowed).toBe(false);
    expect(d.outcome).toBe('ERROR');
    expect(d.reason).toBe('KILL_SWITCH_UNAVAILABLE');
  });

  it('T-14 valid eligible Session passes', () => {
    expect(decideLiveAdmission(base()).allowed).toBe(true);
  });

  it('T-15 invalid Session denies', () => {
    expect(
      decideLiveAdmission(
        base({ session: { ...eligibleSession, exists: false, lifecycleEligible: false } }),
      ).reason,
    ).toBe('SESSION_INVALID');
  });

  it('T-16 Session workspace mismatch denies', () => {
    expect(
      decideLiveAdmission(base({ session: { ...eligibleSession, workspaceMatches: false } }))
        .reason,
    ).toBe('SESSION_WORKSPACE_MISMATCH');
  });

  it('T-17 incompatible execution mode denies', () => {
    expect(
      decideLiveAdmission(base({ session: { ...eligibleSession, executionModeCompatible: false } }))
        .reason,
    ).toBe('SESSION_INCOMPATIBLE_MODE');
  });

  it('T-18 unavailable Session errors (not allow)', () => {
    const d = decideLiveAdmission(base({ session: 'unavailable' }));
    expect(d.allowed).toBe(false);
    expect(d.outcome).toBe('ERROR');
  });

  it('T-19 valid human-start passes', () => {
    expect(decideLiveAdmission(base({ humanStart: 'valid' })).allowed).toBe(true);
  });

  it('T-20 missing human-start denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'missing' })).reason).toBe('HUMAN_START_MISSING');
  });

  it('T-21 invalid human-start denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'invalid' })).reason).toBe('HUMAN_START_INVALID');
  });

  it('T-22 wrong actor (human-start) denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'actor_mismatch' })).reason).toBe(
      'HUMAN_START_ACTOR_MISMATCH',
    );
  });

  it('T-23 wrong workspace (human-start) denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'workspace_mismatch' })).reason).toBe(
      'HUMAN_START_WORKSPACE_MISMATCH',
    );
  });

  it('T-24 wrong Session (human-start) denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'session_mismatch' })).reason).toBe(
      'HUMAN_START_SESSION_MISMATCH',
    );
  });

  it('HS1 wrong ACTION/COMMAND (human-start) denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'action_mismatch' })).reason).toBe(
      'HUMAN_START_ACTION_MISMATCH',
    );
  });

  it('T-25 expired human-start denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'expired' })).reason).toBe('HUMAN_START_EXPIRED');
  });

  it('T-26 replayed human-start denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'replayed' })).reason).toBe(
      'HUMAN_START_REPLAYED',
    );
  });

  it('T-27 JWT alone (missing proof) denies', () => {
    expect(decideLiveAdmission(base({ humanStart: 'missing' })).allowed).toBe(false);
  });

  it('T-28 Admin policy enable alone insufficient (still needs human-start)', () => {
    const d = decideLiveAdmission(base({ policy: 'LIVE_POLICY_OPTED_IN', humanStart: 'missing' }));
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('HUMAN_START_MISSING');
  });

  it('T-29 Gate allow passes', () => {
    expect(decideLiveAdmission(base({ gate: 'pass' })).allowed).toBe(true);
  });

  it('T-30 Gate deny denies', () => {
    expect(decideLiveAdmission(base({ gate: 'fail' })).reason).toBe('GATE_DENIED');
  });

  it('T-31 Gate unknown cannot allow', () => {
    expect(decideLiveAdmission(base({ gate: 'unknown' })).allowed).toBe(false);
  });

  it('T-32 Gate unavailable cannot allow', () => {
    const d = decideLiveAdmission(base({ gate: 'unavailable' }));
    expect(d.allowed).toBe(false);
    expect(d.outcome).toBe('ERROR');
  });

  it('T-33 all required prerequisites valid produces ALLOW', () => {
    const d = decideLiveAdmission(base());
    expect(d.outcome).toBe('ALLOW');
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe('ADMISSION_ALLOWED');
    expect(d.publicReason).toBe('allowed');
  });

  it('T-34 each critical hard-stop denies', () => {
    expect(decideLiveAdmission(base({ paperFreezeBlocksLive: true })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ liveCapitalAuthorized: false })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ killSwitch: 'active' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ policy: 'PAPER' })).allowed).toBe(false);
  });

  it('T-35 any unknown dependency cannot produce ALLOW', () => {
    expect(decideLiveAdmission(base({ policy: 'UNKNOWN' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ killSwitch: 'unknown' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ authorization: 'unknown' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ gate: 'unknown' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ humanStart: 'unknown' })).allowed).toBe(false);
    expect(decideLiveAdmission(base({ session: 'unknown' })).allowed).toBe(false);
  });

  it('public reason never exposes internal diagnostic codes', () => {
    const d = decideLiveAdmission(base({ killSwitch: 'active' }));
    expect(d.publicReason).toBe('denied');
    expect(d.reason).toBe('KILL_SWITCH_ACTIVE');
  });
});
