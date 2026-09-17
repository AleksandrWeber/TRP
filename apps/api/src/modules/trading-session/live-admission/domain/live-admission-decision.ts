/**
 * PROPOSED-V3-L01-S04 — Live admission decision contract.
 *
 * Runtime decision only. Not Security Audit. Not execution capability.
 * ALLOW ≠ live trading active ≠ credentials ≠ venue I/O.
 */

export const LIVE_ADMISSION_DECISION_SCHEMA_VERSION = 1 as const;

export type LiveAdmissionOutcome = 'ALLOW' | 'DENY' | 'ERROR';

/** Machine-readable internal reason codes (diagnostics). */
export type LiveAdmissionReasonCode =
  | 'ADMISSION_ALLOWED'
  | 'PAPER_POLICY'
  | 'POLICY_MISSING'
  | 'POLICY_INVALID'
  | 'POLICY_UNKNOWN'
  | 'PAPER_FREEZE'
  | 'LIVE_CAPITAL_NOT_AUTHORIZED'
  | 'KILL_SWITCH_ACTIVE'
  | 'KILL_SWITCH_UNKNOWN'
  | 'KILL_SWITCH_UNAVAILABLE'
  | 'AUTHORIZATION_DENIED'
  | 'AUTHORIZATION_UNKNOWN'
  | 'SESSION_INVALID'
  | 'SESSION_WORKSPACE_MISMATCH'
  | 'SESSION_INCOMPATIBLE_MODE'
  | 'SESSION_UNAVAILABLE'
  | 'SESSION_ACTOR_MISMATCH'
  | 'HUMAN_START_MISSING'
  | 'HUMAN_START_INVALID'
  | 'HUMAN_START_EXPIRED'
  | 'HUMAN_START_REPLAYED'
  | 'HUMAN_START_ACTOR_MISMATCH'
  | 'HUMAN_START_WORKSPACE_MISMATCH'
  | 'HUMAN_START_SESSION_MISMATCH'
  | 'GATE_DENIED'
  | 'GATE_UNKNOWN'
  | 'GATE_UNAVAILABLE'
  | 'DEPENDENCY_UNKNOWN'
  | 'EVALUATION_ERROR';

/** Safe external reason subset — never expose internal security configuration. */
export type LiveAdmissionPublicReason = 'denied' | 'error' | 'allowed';

export type LiveAdmissionDecision = Readonly<{
  outcome: LiveAdmissionOutcome;
  allowed: boolean;
  reason: LiveAdmissionReasonCode;
  publicReason: LiveAdmissionPublicReason;
  workspaceId: string;
  sessionId: string | null;
  actorId: string | null;
  evaluatedAt: string;
  schemaVersion: typeof LIVE_ADMISSION_DECISION_SCHEMA_VERSION;
  evaluatedPolicy: 'PAPER' | 'LIVE_POLICY_OPTED_IN' | 'UNKNOWN' | 'INVALID' | 'MISSING';
  killSwitch: 'inactive' | 'active' | 'unknown' | 'unavailable';
  authorization: 'allowed' | 'denied' | 'unknown';
  gateOutcome: 'pass' | 'fail' | 'unknown' | 'unavailable';
  humanStart: 'valid' | 'missing' | 'invalid' | 'expired' | 'replayed' | 'unknown';
  sessionEligible: boolean | null;
}>;

export function toPublicAdmissionReason(outcome: LiveAdmissionOutcome): LiveAdmissionPublicReason {
  if (outcome === 'ALLOW') return 'allowed';
  if (outcome === 'ERROR') return 'error';
  return 'denied';
}
