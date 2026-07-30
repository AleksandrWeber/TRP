import {
  decideRuntimeEvaluation,
  RuntimeWorkerState,
  type EvaluationCandle,
  type EvaluationDecision,
  type RuntimeContext,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
  type TickAdmissionResult,
  TickAdmissionStatus,
} from '../../strategy-runtime';
import type { ArmedRuntimeState, RecoveryRuntimeArmingResult } from './recovery-runtime-arming';

export type RecoveryStrategyEvaluationOutcome =
  'EVALUATED' | 'EVALUATION_BLOCKED' | 'DUPLICATE_EVENT';

export type RecoveryStrategyEvaluationBlockedReason =
  | 'runtime_not_armed'
  | 'invalid_lifecycle'
  | 'accepts_ticks_false'
  | 'runtime_context_mismatch'
  | 'event_not_admitted'
  | 'already_evaluated';

export type RestoredEvaluationContext = Readonly<{
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  fencingToken: number;
  checkpointEventId: string;
  checkpointSequence: number;
  checkpointVersion: number;
  runtimeVersion: string;
}>;

export type RecoveryStrategyEvaluationResult = Readonly<{
  outcome: RecoveryStrategyEvaluationOutcome;
  reason:
    'strategy_evaluated' | 'duplicate_event' | RecoveryStrategyEvaluationBlockedReason | string;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  decision: EvaluationDecision | null;
  restoredContext: RestoredEvaluationContext | null;
  eventId: string | null;
  /** US247 forbids SignalIntent emission — always false. */
  signalIntentEmitted: false;
  /** US247 forbids Order creation — always false. */
  orderCreated: false;
}>;

/**
 * Pure US247 gate + deterministic strategy evaluation.
 *
 * Requires an ARMED Runtime and an admitted market event. Produces an
 * evaluation decision only — never emits SignalIntent or creates Orders.
 */
export function decideRecoveryStrategyEvaluation(input: {
  arming: RecoveryRuntimeArmingResult | null;
  lifecycle: RuntimeLifecycleSnapshot | null;
  diagnostics: RuntimeDiagnostics | null;
  context: RuntimeContext | null;
  admission: TickAdmissionResult | null;
  candle: EvaluationCandle | null;
  alreadyEvaluated: boolean;
}): RecoveryStrategyEvaluationResult {
  const { arming } = input;
  const armedState = arming?.armedState;
  const base = resultBase(arming, armedState, input.context);
  const eventId = input.candle?.eventId ?? input.admission?.eventId ?? null;

  if (arming === null || arming.outcome !== 'ARMED' || !isArmedState(armedState)) {
    return blocked(base, 'runtime_not_armed', eventId);
  }
  const confirmedArmed = armedState;

  if (input.alreadyEvaluated) {
    return duplicate(base, confirmedArmed, eventId, 'already_evaluated');
  }

  if (
    input.lifecycle === null ||
    input.diagnostics === null ||
    input.lifecycle.state !== RuntimeWorkerState.ARMED ||
    input.diagnostics.workerState !== RuntimeWorkerState.ARMED
  ) {
    return blocked(base, 'invalid_lifecycle', eventId, confirmedArmed);
  }
  if (!input.lifecycle.acceptsTicks || !input.diagnostics.acceptsTicks) {
    return blocked(base, 'accepts_ticks_false', eventId, confirmedArmed);
  }

  if (!contextMatchesRestoredCheckpoint(input.context, confirmedArmed, input.diagnostics)) {
    return blocked(base, 'runtime_context_mismatch', eventId, confirmedArmed);
  }
  const context = input.context!;

  if (input.admission === null || input.candle === null) {
    return blocked(base, 'event_not_admitted', eventId, confirmedArmed);
  }

  if (input.admission.status === TickAdmissionStatus.REJECTED_DUPLICATE) {
    return duplicate(base, confirmedArmed, input.admission.eventId, 'duplicate_event');
  }

  if (!input.admission.admitted || input.admission.status !== TickAdmissionStatus.ADMITTED) {
    return blocked(
      base,
      input.admission.reason || 'event_not_admitted',
      input.admission.eventId,
      confirmedArmed,
    );
  }

  const decision = decideRuntimeEvaluation({
    deployment: context.deployment,
    candle: input.candle,
  });

  return Object.freeze({
    outcome: 'EVALUATED',
    reason: 'strategy_evaluated',
    ...base,
    deploymentId: confirmedArmed.deploymentId,
    decision,
    restoredContext: toRestoredContext(confirmedArmed),
    eventId: input.candle.eventId,
    signalIntentEmitted: false,
    orderCreated: false,
  });
}

function contextMatchesRestoredCheckpoint(
  context: RuntimeContext | null,
  armed: ArmedRuntimeState,
  diagnostics: RuntimeDiagnostics,
): boolean {
  if (context === null) return false;
  if (context.workspaceId !== armed.workspaceId) return false;
  if (context.sessionId !== armed.sessionId) return false;
  if (context.deploymentId !== armed.deploymentId) return false;
  if (context.runtimeVersion !== armed.runtimeVersion) return false;

  const checkpoint = context.checkpoint;
  if (checkpoint === null) return false;
  if (checkpoint.deploymentId !== armed.deploymentId) return false;
  if (checkpoint.lastProcessedEventId !== armed.checkpointEventId) return false;
  if (checkpoint.lastProcessedCandle.sequence !== armed.checkpointSequence) return false;
  if (checkpoint.version !== armed.checkpointVersion) return false;
  if (checkpoint.runtimeVersion !== armed.runtimeVersion) return false;

  if (diagnostics.workspaceId !== armed.workspaceId) return false;
  if (diagnostics.sessionId !== armed.sessionId) return false;
  if (diagnostics.deploymentId !== armed.deploymentId) return false;
  if (diagnostics.lastProcessedEventId !== armed.checkpointEventId) return false;
  if (diagnostics.lastProcessedCandleSequence !== armed.checkpointSequence) return false;
  if (diagnostics.checkpointVersion !== armed.checkpointVersion) return false;
  if (diagnostics.runtimeVersion !== armed.runtimeVersion) return false;

  return true;
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoveryStrategyEvaluationBlockedReason | string,
  eventId: string | null,
  armedState: ArmedRuntimeState | null = null,
): RecoveryStrategyEvaluationResult {
  return Object.freeze({
    outcome: 'EVALUATION_BLOCKED',
    reason,
    ...base,
    decision: null,
    restoredContext: armedState === null ? null : toRestoredContext(armedState),
    eventId,
    signalIntentEmitted: false as const,
    orderCreated: false as const,
  });
}

function duplicate(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  armedState: ArmedRuntimeState,
  eventId: string | null,
  reason: 'duplicate_event' | 'already_evaluated',
): RecoveryStrategyEvaluationResult {
  return Object.freeze({
    outcome: 'DUPLICATE_EVENT',
    reason,
    ...base,
    deploymentId: armedState.deploymentId,
    decision: null,
    restoredContext: toRestoredContext(armedState),
    eventId,
    signalIntentEmitted: false as const,
    orderCreated: false as const,
  });
}

function isArmedState(
  armedState: ArmedRuntimeState | null | undefined,
): armedState is ArmedRuntimeState {
  return (
    armedState !== null &&
    armedState !== undefined &&
    armedState.operationalState === 'ARMED' &&
    armedState.workerState === RuntimeWorkerState.ARMED
  );
}

function toRestoredContext(armed: ArmedRuntimeState): RestoredEvaluationContext {
  return Object.freeze({
    sessionId: armed.sessionId,
    workspaceId: armed.workspaceId,
    deploymentId: armed.deploymentId,
    fencingToken: armed.fencingToken,
    checkpointEventId: armed.checkpointEventId,
    checkpointSequence: armed.checkpointSequence,
    checkpointVersion: armed.checkpointVersion,
    runtimeVersion: armed.runtimeVersion,
  });
}

function resultBase(
  arming: RecoveryRuntimeArmingResult | null,
  armedState: ArmedRuntimeState | null | undefined,
  context: RuntimeContext | null,
): { sessionId: string; workspaceId: string; deploymentId: string } {
  return {
    sessionId: arming?.sessionId ?? context?.sessionId ?? 'unknown-session',
    workspaceId: arming?.workspaceId ?? context?.workspaceId ?? 'unknown-workspace',
    deploymentId:
      arming?.deploymentId ??
      armedState?.deploymentId ??
      context?.deploymentId ??
      'unknown-deployment',
  };
}
