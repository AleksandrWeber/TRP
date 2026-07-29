import type { SignalIntent } from './signal-intent';
import type { StrategyCheckpoint } from './strategy-checkpoint';
import type { EvaluationDecision, EvaluationOutcomeKind } from './runtime-evaluation';
import type { TickAdmissionStatus } from './tick-admission';

export const EvaluationStatus = {
  COMPLETED: 'COMPLETED',
  ALREADY_PROCESSED: 'ALREADY_PROCESSED',
  REJECTED_NOT_ADMITTED: 'REJECTED_NOT_ADMITTED',
  REJECTED_LIFECYCLE: 'REJECTED_LIFECYCLE',
} as const;

export type EvaluationStatus = (typeof EvaluationStatus)[keyof typeof EvaluationStatus];

export type EvaluationResult = Readonly<{
  status: EvaluationStatus;
  outcomeKind: EvaluationOutcomeKind | null;
  decision: EvaluationDecision | null;
  intent: SignalIntent | null;
  intentCreated: boolean;
  checkpoint: StrategyCheckpoint | null;
  checkpointAdvanced: boolean;
  admissionStatus: TickAdmissionStatus | null;
  reason: string;
  eventId: string | null;
}>;

export function evaluationCompleted(input: {
  decision: EvaluationDecision;
  intent: SignalIntent | null;
  intentCreated: boolean;
  checkpoint: StrategyCheckpoint;
  checkpointAdvanced: boolean;
  reason: string;
  eventId: string;
}): EvaluationResult {
  return Object.freeze({
    status: EvaluationStatus.COMPLETED,
    outcomeKind: input.decision.kind,
    decision: input.decision,
    intent: input.intent,
    intentCreated: input.intentCreated,
    checkpoint: input.checkpoint,
    checkpointAdvanced: input.checkpointAdvanced,
    admissionStatus: null,
    reason: input.reason,
    eventId: input.eventId,
  });
}

export function evaluationAlreadyProcessed(input: {
  checkpoint: StrategyCheckpoint;
  eventId: string;
  reason?: string;
}): EvaluationResult {
  return Object.freeze({
    status: EvaluationStatus.ALREADY_PROCESSED,
    outcomeKind: null,
    decision: null,
    intent: null,
    intentCreated: false,
    checkpoint: input.checkpoint,
    checkpointAdvanced: false,
    admissionStatus: null,
    reason: input.reason ?? 'tick already evaluated at checkpoint',
    eventId: input.eventId,
  });
}

export function evaluationNotAdmitted(input: {
  admissionStatus: TickAdmissionStatus;
  reason: string;
  eventId: string | null;
  checkpoint: StrategyCheckpoint | null;
}): EvaluationResult {
  return Object.freeze({
    status: EvaluationStatus.REJECTED_NOT_ADMITTED,
    outcomeKind: null,
    decision: null,
    intent: null,
    intentCreated: false,
    checkpoint: input.checkpoint,
    checkpointAdvanced: false,
    admissionStatus: input.admissionStatus,
    reason: input.reason,
    eventId: input.eventId,
  });
}

export function evaluationRejectedLifecycle(input: {
  reason: string;
  eventId: string | null;
  checkpoint: StrategyCheckpoint | null;
}): EvaluationResult {
  return Object.freeze({
    status: EvaluationStatus.REJECTED_LIFECYCLE,
    outcomeKind: null,
    decision: null,
    intent: null,
    intentCreated: false,
    checkpoint: input.checkpoint,
    checkpointAdvanced: false,
    admissionStatus: null,
    reason: input.reason,
    eventId: input.eventId,
  });
}
