import {
  EvaluationOutcomeKind,
  RuntimeWorkerState,
  type EvaluationCandle,
  type EvaluationDecision,
  type RuntimeContext,
  type RuntimeDiagnostics,
  type RuntimeLifecycleSnapshot,
  type SignalIntentDirection,
} from '../../strategy-runtime';
import type { ArmedRuntimeState, RecoveryRuntimeArmingResult } from './recovery-runtime-arming';
import type {
  RecoveryStrategyEvaluationResult,
  RestoredEvaluationContext,
} from './recovery-strategy-evaluation';

export type RecoverySignalIntentGenerationOutcome =
  'SIGNAL_INTENT_GENERATED' | 'SIGNAL_GENERATION_BLOCKED';

export type RecoverySignalIntentGenerationBlockedReason =
  | 'evaluation_not_completed'
  | 'decision_not_actionable'
  | 'runtime_not_armed'
  | 'invalid_lifecycle'
  | 'accepts_ticks_false'
  | 'session_mismatch'
  | 'runtime_identity_mismatch'
  | 'event_mismatch'
  | 'duplicate_event'
  | 'decision_already_converted'
  | 'already_generated'
  | 'missing_candle'
  | 'missing_context';

export type SignalIntentGenerationPlan = Readonly<{
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: string;
  direction: SignalIntentDirection;
  confidence: number | null;
  marketCheckpoint: Readonly<{
    streamId: string;
    sequence: number;
    eventId: string;
  }>;
  generatedAt: string;
  evaluationReason: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  fencingToken: number;
  checkpointEventId: string;
  checkpointSequence: number;
  checkpointVersion: number;
  runtimeVersion: string;
}>;

export type RecoverySignalIntentGenerationResult = Readonly<{
  outcome: RecoverySignalIntentGenerationOutcome;
  reason: 'signal_intent_generated' | RecoverySignalIntentGenerationBlockedReason | string;
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  eventId: string | null;
  decision: EvaluationDecision | null;
  plan: SignalIntentGenerationPlan | null;
  restoredContext: RestoredEvaluationContext | null;
  /** True only after a successful generation decision (persist happens in service). */
  signalIntentGenerated: boolean;
  /** US248 forbids Order creation — always false. */
  orderCreated: false;
}>;

/**
 * Pure US248 gate + deterministic SignalIntent mapping.
 *
 * Requires a successful US247 evaluation decision (`SIGNAL_INTENT`) on an
 * ARMED Runtime. Produces exactly one generation plan — never Orders,
 * checkpoints, or Execution Engine activity.
 */
export function decideRecoverySignalIntentGeneration(input: {
  evaluation: RecoveryStrategyEvaluationResult | null;
  arming: RecoveryRuntimeArmingResult | null;
  lifecycle: RuntimeLifecycleSnapshot | null;
  diagnostics: RuntimeDiagnostics | null;
  context: RuntimeContext | null;
  candle: EvaluationCandle | null;
  alreadyConverted: boolean;
  alreadyGenerated: boolean;
}): RecoverySignalIntentGenerationResult {
  const { evaluation, arming, candle } = input;
  const armedState = arming?.armedState;
  const base = resultBase(evaluation, arming, armedState, input.context);
  const eventId = candle?.eventId ?? evaluation?.eventId ?? null;

  if (
    evaluation === null ||
    evaluation.outcome !== 'EVALUATED' ||
    evaluation.decision === null ||
    evaluation.restoredContext === null
  ) {
    if (evaluation?.outcome === 'DUPLICATE_EVENT') {
      return blocked(
        base,
        'duplicate_event',
        eventId,
        evaluation.decision,
        evaluation.restoredContext,
      );
    }
    return blocked(
      base,
      'evaluation_not_completed',
      eventId,
      evaluation?.decision ?? null,
      evaluation?.restoredContext ?? null,
    );
  }

  if (arming === null || arming.outcome !== 'ARMED' || !isArmedState(armedState)) {
    return blocked(
      base,
      'runtime_not_armed',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
    );
  }
  const confirmedArmed = armedState;

  if (input.alreadyConverted) {
    return blocked(
      base,
      'decision_already_converted',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (input.alreadyGenerated) {
    return blocked(
      base,
      'already_generated',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (
    input.lifecycle === null ||
    input.diagnostics === null ||
    input.lifecycle.state !== RuntimeWorkerState.ARMED ||
    input.diagnostics.workerState !== RuntimeWorkerState.ARMED
  ) {
    return blocked(
      base,
      'invalid_lifecycle',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }
  if (!input.lifecycle.acceptsTicks || !input.diagnostics.acceptsTicks) {
    return blocked(
      base,
      'accepts_ticks_false',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (
    !sessionMatches(evaluation, confirmedArmed, input.lifecycle, input.diagnostics) ||
    evaluation.sessionId !== confirmedArmed.sessionId ||
    evaluation.workspaceId !== confirmedArmed.workspaceId
  ) {
    return blocked(
      base,
      'session_mismatch',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (
    !identityMatches(evaluation.restoredContext, confirmedArmed, input.diagnostics) ||
    !contextMatchesRestored(input.context, confirmedArmed, evaluation.restoredContext)
  ) {
    return blocked(
      base,
      'runtime_identity_mismatch',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (input.context === null) {
    return blocked(
      base,
      'missing_context',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (candle === null) {
    return blocked(
      base,
      'missing_candle',
      eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (candle.eventId !== evaluation.eventId) {
    return blocked(
      base,
      'event_mismatch',
      candle.eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  if (evaluation.decision.kind !== EvaluationOutcomeKind.SIGNAL_INTENT) {
    return blocked(
      base,
      'decision_not_actionable',
      candle.eventId,
      evaluation.decision,
      evaluation.restoredContext,
      confirmedArmed,
    );
  }

  const plan: SignalIntentGenerationPlan = Object.freeze({
    workspaceId: evaluation.workspaceId,
    deploymentId: confirmedArmed.deploymentId,
    sessionId: evaluation.sessionId,
    strategyVersion: input.context.deployment.strategyVersion,
    instrument: candle.instrument,
    timeframe: candle.timeframe,
    direction: evaluation.decision.direction,
    confidence: evaluation.decision.confidence,
    marketCheckpoint: Object.freeze({
      streamId: candle.streamId,
      sequence: candle.sequence,
      eventId: candle.eventId,
    }),
    generatedAt: candle.closeTime,
    evaluationReason: evaluation.decision.reason,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    fencingToken: confirmedArmed.fencingToken,
    checkpointEventId: confirmedArmed.checkpointEventId,
    checkpointSequence: confirmedArmed.checkpointSequence,
    checkpointVersion: confirmedArmed.checkpointVersion,
    runtimeVersion: confirmedArmed.runtimeVersion,
  });

  return Object.freeze({
    outcome: 'SIGNAL_INTENT_GENERATED',
    reason: 'signal_intent_generated',
    ...base,
    deploymentId: confirmedArmed.deploymentId,
    eventId: candle.eventId,
    decision: evaluation.decision,
    plan,
    restoredContext: evaluation.restoredContext,
    signalIntentGenerated: true,
    orderCreated: false,
  });
}

function sessionMatches(
  evaluation: RecoveryStrategyEvaluationResult,
  armed: ArmedRuntimeState,
  lifecycle: RuntimeLifecycleSnapshot,
  diagnostics: RuntimeDiagnostics,
): boolean {
  return (
    lifecycle.workspaceId === armed.workspaceId &&
    lifecycle.sessionId === armed.sessionId &&
    diagnostics.workspaceId === armed.workspaceId &&
    diagnostics.sessionId === armed.sessionId &&
    evaluation.sessionId === armed.sessionId &&
    evaluation.workspaceId === armed.workspaceId
  );
}

function identityMatches(
  restored: RestoredEvaluationContext,
  armed: ArmedRuntimeState,
  diagnostics: RuntimeDiagnostics,
): boolean {
  if (restored.sessionId !== armed.sessionId) return false;
  if (restored.workspaceId !== armed.workspaceId) return false;
  if (restored.deploymentId !== armed.deploymentId) return false;
  if (restored.fencingToken !== armed.fencingToken) return false;
  if (restored.checkpointEventId !== armed.checkpointEventId) return false;
  if (restored.checkpointSequence !== armed.checkpointSequence) return false;
  if (restored.checkpointVersion !== armed.checkpointVersion) return false;
  if (restored.runtimeVersion !== armed.runtimeVersion) return false;

  if (diagnostics.deploymentId !== armed.deploymentId) return false;
  if (diagnostics.lastProcessedEventId !== armed.checkpointEventId) return false;
  if (diagnostics.lastProcessedCandleSequence !== armed.checkpointSequence) return false;
  if (diagnostics.checkpointVersion !== armed.checkpointVersion) return false;
  if (diagnostics.runtimeVersion !== armed.runtimeVersion) return false;

  return true;
}

function contextMatchesRestored(
  context: RuntimeContext | null,
  armed: ArmedRuntimeState,
  restored: RestoredEvaluationContext,
): boolean {
  if (context === null) return false;
  if (context.workspaceId !== armed.workspaceId) return false;
  if (context.sessionId !== armed.sessionId) return false;
  if (context.deploymentId !== armed.deploymentId) return false;
  if (context.runtimeVersion !== armed.runtimeVersion) return false;
  if (context.deployment.id !== armed.deploymentId) return false;

  const checkpoint = context.checkpoint;
  if (checkpoint === null) return false;
  if (checkpoint.deploymentId !== restored.deploymentId) return false;
  if (checkpoint.lastProcessedEventId !== restored.checkpointEventId) return false;
  if (checkpoint.lastProcessedCandle.sequence !== restored.checkpointSequence) return false;
  if (checkpoint.version !== restored.checkpointVersion) return false;
  if (checkpoint.runtimeVersion !== restored.runtimeVersion) return false;

  return true;
}

function blocked(
  base: { sessionId: string; workspaceId: string; deploymentId: string },
  reason: RecoverySignalIntentGenerationBlockedReason | string,
  eventId: string | null,
  decision: EvaluationDecision | null,
  restoredContext: RestoredEvaluationContext | null,
  armedState: ArmedRuntimeState | null = null,
): RecoverySignalIntentGenerationResult {
  return Object.freeze({
    outcome: 'SIGNAL_GENERATION_BLOCKED',
    reason,
    ...base,
    deploymentId: armedState?.deploymentId ?? base.deploymentId,
    eventId,
    decision,
    plan: null,
    restoredContext,
    signalIntentGenerated: false,
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

function resultBase(
  evaluation: RecoveryStrategyEvaluationResult | null,
  arming: RecoveryRuntimeArmingResult | null,
  armedState: ArmedRuntimeState | null | undefined,
  context: RuntimeContext | null,
): { sessionId: string; workspaceId: string; deploymentId: string } {
  return {
    sessionId:
      evaluation?.sessionId ?? arming?.sessionId ?? context?.sessionId ?? 'unknown-session',
    workspaceId:
      evaluation?.workspaceId ?? arming?.workspaceId ?? context?.workspaceId ?? 'unknown-workspace',
    deploymentId:
      evaluation?.deploymentId ??
      arming?.deploymentId ??
      armedState?.deploymentId ??
      context?.deploymentId ??
      'unknown-deployment',
  };
}
