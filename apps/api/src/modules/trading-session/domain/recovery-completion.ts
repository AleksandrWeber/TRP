import {
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  type RuntimeLifecycleSnapshot,
} from '../../strategy-runtime';
import { canTransition } from './session-transitions';
import { clearLease, transitionSession, type TradingSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';
import type { RecoveryCheckpointValidationResult } from './recovery-checkpoint-validation';
import type { RecoveryEventAdmissionResult } from './recovery-event-admission';
import type { RecoveryLeaseAcquisitionResult } from './recovery-lease-acquisition';
import type { RecoveryRuntimeArmingResult } from './recovery-runtime-arming';
import type { RecoveryRuntimeResumeResult } from './recovery-runtime-resume';
import type { RecoverySignalIntentGenerationResult } from './recovery-signal-intent-generation';
import type { RecoveryStateReconciliationResult } from './recovery-state-reconciliation';
import type { RecoveryStrategyEvaluationResult } from './recovery-strategy-evaluation';
import type { StartupRecoveryDiscoveryResult } from './startup-recovery-discovery';

export type RecoveryCompletionTerminalCause =
  'SIGNAL_INTENT_GENERATED' | 'EVALUATED_NON_ACTIONABLE' | 'CONTROLLED_TERMINATION';

export type RecoveryCompletionOutcome = 'RECOVERY_COMPLETED' | 'RECOVERY_COMPLETION_BLOCKED';

export type RecoveryCompletionBlockedReason =
  | 'already_completed'
  | 'session_not_found'
  | 'invalid_lifecycle'
  | 'lease_missing'
  | 'lease_mismatch'
  | 'unfinished_recovery_stage'
  | 'terminal_outcome_missing'
  | 'illegal_session_transition'
  | 'runtime_not_armed';

/** Includes STOPPED for E17 P0-2 / durable RecoveryState resumeIntent (US292). */
export type RecoveryResumeIntent =
  TradingSessionStatus.RUNNING | TradingSessionStatus.PAUSED | TradingSessionStatus.STOPPED;

export type RecoveryPipelineStageSnapshot = Readonly<{
  discovery: StartupRecoveryDiscoveryResult | null;
  lease: RecoveryLeaseAcquisitionResult | null;
  checkpoint: RecoveryCheckpointValidationResult | null;
  reconcile: RecoveryStateReconciliationResult | null;
  resume: RecoveryRuntimeResumeResult | null;
  admission: RecoveryEventAdmissionResult | null;
  arming: RecoveryRuntimeArmingResult | null;
  evaluation: RecoveryStrategyEvaluationResult | null;
  signalIntent: RecoverySignalIntentGenerationResult | null;
}>;

export type RecoveryCompletionResult = Readonly<{
  outcome: RecoveryCompletionOutcome;
  reason: 'recovery_completed' | RecoveryCompletionBlockedReason | string;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  terminalCause: RecoveryCompletionTerminalCause | null;
  unfinishedStage: string | null;
  fromStatus: TradingSessionStatus | null;
  toStatus: TradingSessionStatus | null;
  fencingTokenReleased: number | null;
  ownerIdReleased: string | null;
  /** Next Session state to persist when outcome is RECOVERY_COMPLETED. */
  nextSession: TradingSession | null;
  /** US249 forbids Order creation — always false. */
  orderCreated: false;
  /** Runtime lifecycle must remain operational (unchanged by completion). */
  runtimeRemainsOperational: true;
}>;

/**
 * Pure US249 gate + Session exit plan.
 *
 * Completes the recovery pipeline after a terminal Stage 3 outcome, transitions
 * the Session out of `RECOVERING`, and releases recovery lease ownership.
 * Does not create Orders or mutate Runtime lifecycle.
 */
export function decideRecoveryCompletion(input: {
  session: TradingSession | null;
  stages: RecoveryPipelineStageSnapshot;
  lifecycle: RuntimeLifecycleSnapshot | null;
  controlledTermination: boolean;
  resumeIntent: RecoveryResumeIntent;
  recordedAt: string;
  alreadyCompleted: boolean;
}): RecoveryCompletionResult {
  const { session, stages } = input;
  const base = resultBase(session, stages);

  if (input.alreadyCompleted) {
    return blocked(base, 'already_completed', null, session);
  }

  if (session === null) {
    return blocked(base, 'session_not_found', null, null);
  }

  if (session.status !== TradingSessionStatus.RECOVERING) {
    return blocked(base, 'invalid_lifecycle', null, session);
  }

  const unfinishedStage = findUnfinishedStage(stages);
  if (unfinishedStage !== null) {
    return blocked(base, 'unfinished_recovery_stage', unfinishedStage, session);
  }

  const terminalCause = resolveTerminalCause(stages, input.controlledTermination);
  if (terminalCause === null) {
    return blocked(base, 'terminal_outcome_missing', null, session);
  }

  if (session.lease === null) {
    return blocked(base, 'lease_missing', null, session, terminalCause);
  }

  const lease = stages.lease!;
  if (
    lease.ownerId !== session.lease.ownerId ||
    lease.fencingToken !== session.lease.fencingToken
  ) {
    return blocked(base, 'lease_mismatch', null, session, terminalCause);
  }

  if (
    input.lifecycle === null ||
    input.lifecycle.state !== RuntimeWorkerState.ARMED ||
    !input.lifecycle.acceptsTicks ||
    input.lifecycle.workspaceId !== session.workspaceId ||
    input.lifecycle.sessionId !== session.id
  ) {
    return blocked(base, 'runtime_not_armed', null, session, terminalCause);
  }

  if (!canTransition(session.status, input.resumeIntent)) {
    return blocked(base, 'illegal_session_transition', null, session, terminalCause);
  }

  const fencingTokenReleased = session.lease.fencingToken;
  const ownerIdReleased = session.lease.ownerId;
  const nextSession = clearLease(transitionSession(session, input.resumeIntent, input.recordedAt));

  return Object.freeze({
    outcome: 'RECOVERY_COMPLETED',
    reason: 'recovery_completed',
    ...base,
    deploymentId: session.deploymentId,
    terminalCause,
    unfinishedStage: null,
    fromStatus: session.status,
    toStatus: nextSession.status,
    fencingTokenReleased,
    ownerIdReleased,
    nextSession,
    orderCreated: false,
    runtimeRemainsOperational: true,
  });
}

function resolveTerminalCause(
  stages: RecoveryPipelineStageSnapshot,
  controlledTermination: boolean,
): RecoveryCompletionTerminalCause | null {
  if (controlledTermination) {
    return 'CONTROLLED_TERMINATION';
  }
  if (stages.signalIntent?.outcome === 'SIGNAL_INTENT_GENERATED') {
    return 'SIGNAL_INTENT_GENERATED';
  }
  // Duplicate protection after a successful US248 emit still proves Intent exists.
  if (
    stages.signalIntent?.outcome === 'SIGNAL_GENERATION_BLOCKED' &&
    (stages.signalIntent.reason === 'decision_already_converted' ||
      stages.signalIntent.reason === 'already_generated') &&
    stages.evaluation?.outcome === 'EVALUATED' &&
    stages.evaluation.decision?.kind === EvaluationOutcomeKind.SIGNAL_INTENT
  ) {
    return 'SIGNAL_INTENT_GENERATED';
  }
  if (
    stages.evaluation?.outcome === 'EVALUATED' &&
    stages.evaluation.decision?.kind === EvaluationOutcomeKind.NO_ACTION
  ) {
    return 'EVALUATED_NON_ACTIONABLE';
  }
  return null;
}

/**
 * Core pipeline stages that must succeed before any terminal recovery exit.
 * Evaluation/SignalIntent are validated via terminal-cause resolution.
 */
function findUnfinishedStage(stages: RecoveryPipelineStageSnapshot): string | null {
  if (stages.discovery === null || stages.discovery.outcome !== 'recovery_candidate') {
    return 'discovery';
  }
  if (stages.lease === null || stages.lease.outcome !== 'LEASE_ACQUIRED') {
    return 'lease';
  }
  if (stages.checkpoint === null || stages.checkpoint.outcome !== 'VALID_CHECKPOINT') {
    return 'checkpoint';
  }
  if (stages.reconcile === null || stages.reconcile.outcome !== 'RECONCILED') {
    return 'reconcile';
  }
  if (stages.resume === null || stages.resume.outcome !== 'READY') {
    return 'resume';
  }
  if (stages.admission === null || stages.admission.outcome !== 'EVENT_ADMISSION_ENABLED') {
    return 'admission';
  }
  if (stages.arming === null || stages.arming.outcome !== 'ARMED') {
    return 'arming';
  }
  return null;
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoveryCompletionBlockedReason | string,
  unfinishedStage: string | null,
  session: TradingSession | null,
  terminalCause: RecoveryCompletionTerminalCause | null = null,
): RecoveryCompletionResult {
  return Object.freeze({
    outcome: 'RECOVERY_COMPLETION_BLOCKED',
    reason,
    ...base,
    deploymentId: session?.deploymentId ?? base.deploymentId,
    terminalCause,
    unfinishedStage,
    fromStatus: session?.status ?? null,
    toStatus: null,
    fencingTokenReleased: null,
    ownerIdReleased: null,
    nextSession: null,
    orderCreated: false as const,
    runtimeRemainsOperational: true as const,
  });
}

function resultBase(
  session: TradingSession | null,
  stages: RecoveryPipelineStageSnapshot,
): { sessionId: string; workspaceId: string; deploymentId: string } {
  return {
    sessionId:
      session?.id ??
      stages.arming?.sessionId ??
      stages.lease?.sessionId ??
      stages.discovery?.candidate?.sessionId ??
      'unknown-session',
    workspaceId:
      session?.workspaceId ??
      stages.arming?.workspaceId ??
      stages.lease?.workspaceId ??
      stages.discovery?.candidate?.workspaceId ??
      'unknown-workspace',
    deploymentId:
      session?.deploymentId ??
      stages.arming?.deploymentId ??
      stages.discovery?.candidate?.deploymentId ??
      'unknown-deployment',
  };
}
