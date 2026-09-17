/**
 * PROPOSED-V3-L01-S04 — Pure fail-closed live admission evaluator.
 *
 * Precedence (PO-S04-03): V2 hard stops → KS → policy → authz → Session → human-start → Gate.
 * Unknown / unavailable / malformed MUST NOT produce ALLOW.
 */

import {
  LIVE_ADMISSION_DECISION_SCHEMA_VERSION,
  toPublicAdmissionReason,
  type LiveAdmissionDecision,
  type LiveAdmissionOutcome,
  type LiveAdmissionReasonCode,
} from './live-admission-decision';

export type LiveAdmissionPolicyInput =
  'PAPER' | 'LIVE_POLICY_OPTED_IN' | 'MISSING' | 'INVALID' | 'UNKNOWN';

export type LiveAdmissionKillSwitchInput = 'inactive' | 'active' | 'unknown' | 'unavailable';

export type LiveAdmissionAuthorizationInput = 'allowed' | 'denied' | 'unknown';

export type LiveAdmissionGateInput = 'pass' | 'fail' | 'unknown' | 'unavailable';

export type LiveAdmissionHumanStartInput =
  | 'valid'
  | 'missing'
  | 'invalid'
  | 'expired'
  | 'replayed'
  | 'unknown'
  | 'actor_mismatch'
  | 'workspace_mismatch'
  | 'session_mismatch';

export type LiveAdmissionSessionInput = Readonly<{
  available: boolean;
  exists: boolean;
  workspaceMatches: boolean;
  lifecycleEligible: boolean;
  executionModeCompatible: boolean;
  actorContextMatches: boolean;
}>;

export type DecideLiveAdmissionInput = Readonly<{
  workspaceId: string;
  sessionId: string | null;
  actorId: string | null;
  evaluatedAt: string;
  /** Injected V2 snapshot — never mutate production anchors. */
  liveCapitalAuthorized: boolean;
  paperFreezeBlocksLive: boolean;
  policy: LiveAdmissionPolicyInput;
  killSwitch: LiveAdmissionKillSwitchInput;
  authorization: LiveAdmissionAuthorizationInput;
  session: LiveAdmissionSessionInput | 'unavailable' | 'unknown';
  humanStart: LiveAdmissionHumanStartInput;
  gate: LiveAdmissionGateInput;
}>;

/**
 * Fail-closed live admission decision.
 * ALLOW only when every prerequisite is known-valid.
 */
export function decideLiveAdmission(input: DecideLiveAdmissionInput): LiveAdmissionDecision {
  const base = {
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    actorId: input.actorId,
    evaluatedAt: input.evaluatedAt,
    schemaVersion: LIVE_ADMISSION_DECISION_SCHEMA_VERSION,
    evaluatedPolicy: mapPolicyLabel(input.policy),
    killSwitch: input.killSwitch,
    authorization: input.authorization,
    gateOutcome: input.gate,
    humanStart: mapHumanStartLabel(input.humanStart),
    sessionEligible: null as boolean | null,
  };

  // PO-S04-03: V2 hard safety stops first
  if (input.paperFreezeBlocksLive) {
    return deny(base, 'PAPER_FREEZE');
  }
  if (input.liveCapitalAuthorized !== true) {
    return deny(base, 'LIVE_CAPITAL_NOT_AUTHORIZED');
  }

  // Kill Switch
  if (input.killSwitch === 'active') {
    return deny(base, 'KILL_SWITCH_ACTIVE');
  }
  if (input.killSwitch === 'unknown') {
    return deny(base, 'KILL_SWITCH_UNKNOWN');
  }
  if (input.killSwitch === 'unavailable') {
    return error(base, 'KILL_SWITCH_UNAVAILABLE');
  }

  // Workspace live policy
  if (input.policy === 'PAPER') {
    return deny(base, 'PAPER_POLICY');
  }
  if (input.policy === 'MISSING') {
    return deny(base, 'POLICY_MISSING');
  }
  if (input.policy === 'INVALID') {
    return deny(base, 'POLICY_INVALID');
  }
  if (input.policy === 'UNKNOWN') {
    return deny(base, 'POLICY_UNKNOWN');
  }
  if (input.policy !== 'LIVE_POLICY_OPTED_IN') {
    return deny(base, 'DEPENDENCY_UNKNOWN');
  }

  // Authorization
  if (input.authorization === 'denied') {
    return deny(base, 'AUTHORIZATION_DENIED');
  }
  if (input.authorization === 'unknown') {
    return deny(base, 'AUTHORIZATION_UNKNOWN');
  }
  if (input.authorization !== 'allowed') {
    return deny(base, 'DEPENDENCY_UNKNOWN');
  }

  // Session eligibility
  if (input.session === 'unavailable') {
    return error(base, 'SESSION_UNAVAILABLE');
  }
  if (input.session === 'unknown') {
    return deny(base, 'DEPENDENCY_UNKNOWN');
  }
  const sessionEligible =
    input.session.available &&
    input.session.exists &&
    input.session.workspaceMatches &&
    input.session.lifecycleEligible &&
    input.session.executionModeCompatible &&
    input.session.actorContextMatches;
  base.sessionEligible = sessionEligible;
  if (!input.session.available || !input.session.exists) {
    return deny({ ...base, sessionEligible: false }, 'SESSION_INVALID');
  }
  if (!input.session.workspaceMatches) {
    return deny({ ...base, sessionEligible: false }, 'SESSION_WORKSPACE_MISMATCH');
  }
  if (!input.session.actorContextMatches) {
    return deny({ ...base, sessionEligible: false }, 'SESSION_ACTOR_MISMATCH');
  }
  if (!input.session.executionModeCompatible) {
    return deny({ ...base, sessionEligible: false }, 'SESSION_INCOMPATIBLE_MODE');
  }
  if (!input.session.lifecycleEligible) {
    return deny({ ...base, sessionEligible: false }, 'SESSION_INVALID');
  }

  // Human start (PO-S04-06)
  if (input.humanStart === 'missing') {
    return deny(base, 'HUMAN_START_MISSING');
  }
  if (input.humanStart === 'invalid' || input.humanStart === 'unknown') {
    return deny(base, 'HUMAN_START_INVALID');
  }
  if (input.humanStart === 'expired') {
    return deny(base, 'HUMAN_START_EXPIRED');
  }
  if (input.humanStart === 'replayed') {
    return deny(base, 'HUMAN_START_REPLAYED');
  }
  if (input.humanStart === 'actor_mismatch') {
    return deny(base, 'HUMAN_START_ACTOR_MISMATCH');
  }
  if (input.humanStart === 'workspace_mismatch') {
    return deny(base, 'HUMAN_START_WORKSPACE_MISMATCH');
  }
  if (input.humanStart === 'session_mismatch') {
    return deny(base, 'HUMAN_START_SESSION_MISMATCH');
  }
  if (input.humanStart !== 'valid') {
    return deny(base, 'HUMAN_START_INVALID');
  }

  // Gate
  if (input.gate === 'fail') {
    return deny(base, 'GATE_DENIED');
  }
  if (input.gate === 'unknown') {
    return deny(base, 'GATE_UNKNOWN');
  }
  if (input.gate === 'unavailable') {
    return error(base, 'GATE_UNAVAILABLE');
  }
  if (input.gate !== 'pass') {
    return deny(base, 'DEPENDENCY_UNKNOWN');
  }

  return allow(base);
}

function mapPolicyLabel(
  policy: LiveAdmissionPolicyInput,
): LiveAdmissionDecision['evaluatedPolicy'] {
  if (policy === 'PAPER') return 'PAPER';
  if (policy === 'LIVE_POLICY_OPTED_IN') return 'LIVE_POLICY_OPTED_IN';
  if (policy === 'MISSING') return 'MISSING';
  if (policy === 'INVALID') return 'INVALID';
  return 'UNKNOWN';
}

function mapHumanStartLabel(
  humanStart: LiveAdmissionHumanStartInput,
): LiveAdmissionDecision['humanStart'] {
  if (humanStart === 'valid') return 'valid';
  if (humanStart === 'missing') return 'missing';
  if (humanStart === 'expired') return 'expired';
  if (humanStart === 'replayed') return 'replayed';
  if (
    humanStart === 'actor_mismatch' ||
    humanStart === 'workspace_mismatch' ||
    humanStart === 'session_mismatch' ||
    humanStart === 'invalid'
  ) {
    return 'invalid';
  }
  return 'unknown';
}

function allow(
  base: Omit<LiveAdmissionDecision, 'outcome' | 'allowed' | 'reason' | 'publicReason'>,
): LiveAdmissionDecision {
  return freezeDecision({
    ...base,
    outcome: 'ALLOW',
    allowed: true,
    reason: 'ADMISSION_ALLOWED',
    publicReason: toPublicAdmissionReason('ALLOW'),
  });
}

function deny(
  base: Omit<LiveAdmissionDecision, 'outcome' | 'allowed' | 'reason' | 'publicReason'>,
  reason: LiveAdmissionReasonCode,
): LiveAdmissionDecision {
  return freezeDecision({
    ...base,
    outcome: 'DENY',
    allowed: false,
    reason,
    publicReason: toPublicAdmissionReason('DENY'),
  });
}

function error(
  base: Omit<LiveAdmissionDecision, 'outcome' | 'allowed' | 'reason' | 'publicReason'>,
  reason: LiveAdmissionReasonCode,
): LiveAdmissionDecision {
  const outcome: LiveAdmissionOutcome = 'ERROR';
  return freezeDecision({
    ...base,
    outcome,
    allowed: false,
    reason,
    publicReason: toPublicAdmissionReason(outcome),
  });
}

function freezeDecision(decision: LiveAdmissionDecision): LiveAdmissionDecision {
  return Object.freeze(decision);
}
