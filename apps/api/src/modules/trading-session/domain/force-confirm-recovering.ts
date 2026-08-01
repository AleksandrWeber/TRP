import { canTransition } from './session-transitions';
import { clearLease, transitionSession, type TradingSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';
import type {
  RecoveryCandidate,
  StartupRecoveryDiscoveryResult,
} from './startup-recovery-discovery';

/**
 * Post-recovery Session status established at discovery/`RECOVERING` open (US290).
 * Persisted on durable RecoveryState by US292.
 */
export type DiscoveryResumeIntent =
  TradingSessionStatus.RUNNING | TradingSessionStatus.PAUSED | TradingSessionStatus.STOPPED;

export type ForceConfirmRecoveringAction = 'forced' | 'confirmed' | 'not_required' | 'blocked';

/**
 * Lifecycle facts established when opening recovery on a discovered candidate.
 * US292 persists these on durable RecoveryState; Outbox carries durable audit.
 */
export type RecoveringOpenResult = Readonly<{
  action: ForceConfirmRecoveringAction;
  reason: string;
  sessionId: string | null;
  workspaceId: string | null;
  deploymentId: string | null;
  preRecoveryStatus: TradingSessionStatus | null;
  resumeIntent: DiscoveryResumeIntent | null;
  fromStatus: TradingSessionStatus | null;
  toStatus: TradingSessionStatus | null;
  transitioned: boolean;
  /** Next Session to persist when action is `forced`; null for confirm / no-op. */
  nextSession: TradingSession | null;
  expectedVersion: number | null;
  /** US290 must not admit evaluation or SignalIntent as a consequence of open. */
  evaluationAdmitted: false;
  signalIntentEmitted: false;
}>;

/**
 * Resolve ADR-014 / E17 P0-2 resume intent from the pre-recovery Session status.
 *
 * - `STOPPING` → always `STOPPED`
 * - `PAUSED` → `PAUSED`
 * - `RUNNING` / `STARTING` → `RUNNING`
 * - Already `RECOVERING` is not resolved here (confirm must not invent intent)
 */
export function resolveDiscoveryResumeIntent(
  preRecoveryStatus: TradingSessionStatus,
): DiscoveryResumeIntent {
  switch (preRecoveryStatus) {
    case TradingSessionStatus.STOPPING:
      return TradingSessionStatus.STOPPED;
    case TradingSessionStatus.PAUSED:
      return TradingSessionStatus.PAUSED;
    case TradingSessionStatus.RUNNING:
    case TradingSessionStatus.STARTING:
      return TradingSessionStatus.RUNNING;
    default:
      throw new Error(`cannot resolve discovery resumeIntent from status ${preRecoveryStatus}`);
  }
}

/**
 * Pure US290 decision: force or confirm Session `RECOVERING` after US240 selection.
 *
 * Does not acquire leases, load checkpoints, reconcile, arm Runtime, evaluate,
 * or emit SignalIntent.
 */
export function decideForceConfirmRecovering(input: {
  discovery: StartupRecoveryDiscoveryResult;
  session: TradingSession | null;
  recordedAt: string;
  /** Prior open facts from an earlier discovery in this process (optional). */
  priorOpen: RecoveringOpenResult | null;
}): RecoveringOpenResult {
  const { discovery, session, recordedAt, priorOpen } = input;

  if (discovery.outcome === 'no_recovery_required' || discovery.candidate === null) {
    return notRequired();
  }

  const candidate = discovery.candidate;

  if (session === null) {
    return blocked(candidate, 'session_not_found');
  }

  if (session.id !== candidate.sessionId || session.workspaceId !== candidate.workspaceId) {
    return blocked(candidate, 'candidate_mismatch');
  }

  if (session.status === TradingSessionStatus.RECOVERING) {
    return confirmAlreadyRecovering(session, priorOpen);
  }

  if (
    session.status === TradingSessionStatus.STOPPED ||
    session.status === TradingSessionStatus.FAILED ||
    session.status === TradingSessionStatus.CREATED
  ) {
    return blocked(candidate, 'ineligible_status', session);
  }

  if (!canTransition(session.status, TradingSessionStatus.RECOVERING)) {
    return blocked(candidate, 'illegal_session_transition', session);
  }

  const preRecoveryStatus = session.status;
  const resumeIntent = resolveDiscoveryResumeIntent(preRecoveryStatus);
  const nextSession = clearLease(
    transitionSession(session, TradingSessionStatus.RECOVERING, recordedAt),
  );

  return Object.freeze({
    action: 'forced',
    reason: 'forced_recovering',
    sessionId: session.id,
    workspaceId: session.workspaceId,
    deploymentId: session.deploymentId,
    preRecoveryStatus,
    resumeIntent,
    fromStatus: preRecoveryStatus,
    toStatus: TradingSessionStatus.RECOVERING,
    transitioned: true,
    nextSession,
    expectedVersion: session.version,
    evaluationAdmitted: false,
    signalIntentEmitted: false,
  });
}

function confirmAlreadyRecovering(
  session: TradingSession,
  priorOpen: RecoveringOpenResult | null,
): RecoveringOpenResult {
  const sameSessionPrior =
    priorOpen !== null &&
    priorOpen.sessionId === session.id &&
    priorOpen.workspaceId === session.workspaceId &&
    (priorOpen.action === 'forced' || priorOpen.action === 'confirmed');

  // Preserve previously established intent; never invent one for bare RECOVERING.
  const resumeIntent = sameSessionPrior ? priorOpen.resumeIntent : null;
  const preRecoveryStatus = sameSessionPrior
    ? (priorOpen.preRecoveryStatus ?? TradingSessionStatus.RECOVERING)
    : TradingSessionStatus.RECOVERING;

  return Object.freeze({
    action: 'confirmed',
    reason: 'already_recovering',
    sessionId: session.id,
    workspaceId: session.workspaceId,
    deploymentId: session.deploymentId,
    preRecoveryStatus,
    resumeIntent,
    fromStatus: TradingSessionStatus.RECOVERING,
    toStatus: TradingSessionStatus.RECOVERING,
    transitioned: false,
    nextSession: null,
    expectedVersion: session.version,
    evaluationAdmitted: false,
    signalIntentEmitted: false,
  });
}

function notRequired(): RecoveringOpenResult {
  return Object.freeze({
    action: 'not_required',
    reason: 'no_recovery_required',
    sessionId: null,
    workspaceId: null,
    deploymentId: null,
    preRecoveryStatus: null,
    resumeIntent: null,
    fromStatus: null,
    toStatus: null,
    transitioned: false,
    nextSession: null,
    expectedVersion: null,
    evaluationAdmitted: false,
    signalIntentEmitted: false,
  });
}

function blocked(
  candidate: RecoveryCandidate,
  reason: string,
  session: TradingSession | null = null,
): RecoveringOpenResult {
  return Object.freeze({
    action: 'blocked',
    reason,
    sessionId: candidate.sessionId,
    workspaceId: candidate.workspaceId,
    deploymentId: candidate.deploymentId,
    preRecoveryStatus: session?.status ?? candidate.status,
    resumeIntent: null,
    fromStatus: session?.status ?? null,
    toStatus: null,
    transitioned: false,
    nextSession: null,
    expectedVersion: session?.version ?? null,
    evaluationAdmitted: false,
    signalIntentEmitted: false,
  });
}
