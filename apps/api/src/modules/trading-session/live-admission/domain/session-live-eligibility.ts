/**
 * PROPOSED-V3-L01-S04 — Minimum Session eligibility for live admission (PO-S04-05).
 * No Session redesign.
 */

import {
  ExecutionMode,
  SessionState,
  type TradingSession as TradingSessionAggregate,
} from '../../domain/trading-session-aggregate';
import type { TradingSession as DurableTradingSession } from '../../domain/trading-session';
import {
  TERMINAL_SESSION_STATUSES,
  type TradingSessionStatus,
} from '../../domain/trading-session-status';
import type { LiveAdmissionSessionInput } from './decide-live-admission';

export type LiveAdmissionSessionFacts = Readonly<{
  sessionId: string;
  workspaceId: string;
  actorId: string | null;
  lifecycleEligible: boolean;
  executionModeCompatible: boolean;
}>;

/** Evaluate eligibility facts against the admission request. */
export function evaluateSessionLiveEligibility(input: {
  session: LiveAdmissionSessionFacts | null;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  expectedActorId: string | null;
}): LiveAdmissionSessionInput {
  if (input.session === null) {
    return Object.freeze({
      available: true,
      exists: false,
      workspaceMatches: false,
      lifecycleEligible: false,
      executionModeCompatible: false,
      actorContextMatches: false,
    });
  }

  const workspaceMatches = input.session.workspaceId === input.expectedWorkspaceId.trim();
  const idMatches = input.session.sessionId === input.expectedSessionId.trim();
  const actorContextMatches =
    input.expectedActorId === null ||
    input.session.actorId === null ||
    input.session.actorId === input.expectedActorId;

  return Object.freeze({
    available: true,
    exists: idMatches,
    workspaceMatches,
    lifecycleEligible: input.session.lifecycleEligible && idMatches,
    executionModeCompatible: input.session.executionModeCompatible && idMatches,
    actorContextMatches: actorContextMatches && idMatches,
  });
}

/** Map durable TradingSession (no ExecutionMode) — live mode must be supplied explicitly. */
export function durableSessionToLiveAdmissionFacts(
  session: DurableTradingSession,
  executionModeCompatible: boolean,
): LiveAdmissionSessionFacts {
  return Object.freeze({
    sessionId: session.id,
    workspaceId: session.workspaceId,
    actorId: session.actorId,
    lifecycleEligible: !TERMINAL_SESSION_STATUSES.has(session.status as TradingSessionStatus),
    executionModeCompatible,
  });
}

/** Map aggregate TradingSession — LIVE execution mode required for live admission. */
export function aggregateSessionToLiveAdmissionFacts(
  session: TradingSessionAggregate,
): LiveAdmissionSessionFacts {
  const state = session.currentState();
  return Object.freeze({
    sessionId: session.sessionId,
    workspaceId: session.workspaceId,
    actorId: null,
    lifecycleEligible: state !== SessionState.STOPPED && state !== SessionState.FAILED,
    executionModeCompatible: session.executionMode === ExecutionMode.LIVE,
  });
}
