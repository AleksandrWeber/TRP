import { isRecoveryEligibleStatus } from './recovery-eligibility';
import type { TradingSession } from './trading-session';
import type { TradingSessionStatus } from './trading-session-status';

/**
 * Durable Session identity snapshot selected for recovery (US240).
 * Discovery-only — does not mutate Session state or load checkpoints.
 */
export type RecoveryCandidate = Readonly<{
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  status: TradingSessionStatus;
  createdAt: string;
}>;

export type StartupRecoveryDiscoveryOutcome = 'no_recovery_required' | 'recovery_candidate';

/**
 * Deterministic startup discovery result (US240).
 *
 * Exactly one candidate is selected, or none. When multiple Sessions are
 * eligible, selection is stable: oldest `createdAt`, then `id`, then
 * `workspaceId` (lexicographic ascending).
 */
export type StartupRecoveryDiscoveryResult = Readonly<{
  outcome: StartupRecoveryDiscoveryOutcome;
  eligibleCount: number;
  candidate: RecoveryCandidate | null;
  /** Eligible Session IDs in selection order (deterministic; for logging/tests). */
  eligibleSessionIds: readonly string[];
}>;

export function toRecoveryCandidate(session: TradingSession): RecoveryCandidate {
  return Object.freeze({
    sessionId: session.id,
    workspaceId: session.workspaceId,
    deploymentId: session.deploymentId,
    status: session.status,
    createdAt: session.createdAt,
  });
}

/**
 * Compare Sessions for deterministic recovery candidate selection.
 * Pure; does not use wall-clock or process-local order.
 */
export function compareRecoveryCandidates(a: TradingSession, b: TradingSession): number {
  const byCreated = a.createdAt.localeCompare(b.createdAt);
  if (byCreated !== 0) return byCreated;
  const byId = a.id.localeCompare(b.id);
  if (byId !== 0) return byId;
  return a.workspaceId.localeCompare(b.workspaceId);
}

/**
 * Pure startup discovery: filter eligible Sessions and select at most one candidate.
 *
 * Does not transition status, acquire leases, load checkpoints, or resume Runtime.
 */
export function discoverStartupRecoveryCandidate(
  sessions: readonly TradingSession[],
): StartupRecoveryDiscoveryResult {
  const eligible = sessions
    .filter((session) => isRecoveryEligibleStatus(session.status))
    .slice()
    .sort(compareRecoveryCandidates);

  const eligibleSessionIds = Object.freeze(eligible.map((session) => session.id));

  if (eligible.length === 0) {
    return Object.freeze({
      outcome: 'no_recovery_required',
      eligibleCount: 0,
      candidate: null,
      eligibleSessionIds,
    });
  }

  const selected = eligible[0]!;
  return Object.freeze({
    outcome: 'recovery_candidate',
    eligibleCount: eligible.length,
    candidate: toRecoveryCandidate(selected),
    eligibleSessionIds,
  });
}
