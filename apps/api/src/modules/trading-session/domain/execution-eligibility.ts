import type { TradingSession } from './trading-session';
import { assertLeaseCurrent } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

/**
 * Manual execution eligibility gate (US157).
 * Operational lease clocks gate work only — they never enter financial math.
 */
export type ExecutionEligibility = Readonly<{
  eligible: true;
  sessionId: string;
  workspaceId: string;
  paperAccountId: string;
  fencingToken: number;
  status: TradingSessionStatus;
}>;

export type ExecutionEligibilityDenied = Readonly<{
  eligible: false;
  sessionId: string;
  reason: string;
  status: TradingSessionStatus;
}>;

export function evaluateExecutionEligibility(
  session: TradingSession,
  fencingToken: number,
  nowIso: string,
): ExecutionEligibility | ExecutionEligibilityDenied {
  if (session.status !== TradingSessionStatus.RUNNING) {
    return Object.freeze({
      eligible: false,
      sessionId: session.id,
      reason: `session status ${session.status} is not execution-eligible`,
      status: session.status,
    });
  }
  try {
    const lease = assertLeaseCurrent(session, fencingToken, nowIso);
    return Object.freeze({
      eligible: true,
      sessionId: session.id,
      workspaceId: session.workspaceId,
      paperAccountId: session.paperAccountId,
      fencingToken: lease.fencingToken,
      status: session.status,
    });
  } catch (error) {
    return Object.freeze({
      eligible: false,
      sessionId: session.id,
      reason: error instanceof Error ? error.message : String(error),
      status: session.status,
    });
  }
}

export function assertExecutionEligible(
  session: TradingSession,
  fencingToken: number,
  nowIso: string,
): ExecutionEligibility {
  const result = evaluateExecutionEligibility(session, fencingToken, nowIso);
  if (!result.eligible) {
    throw new Error(result.reason);
  }
  return result;
}
