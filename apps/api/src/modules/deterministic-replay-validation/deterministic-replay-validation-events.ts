/**
 * Application events for US197 Deterministic Replay Validation.
 *
 * Collected in-memory by DeterministicReplayValidationService. No transport
 * layer and no message bus.
 */

type DeterministicReplayValidationEventBase<Type extends string> = Readonly<{
  eventType: Type;
  validationId: string;
  occurredAt: string;
}>;

export type DeterministicValidationStarted =
  DeterministicReplayValidationEventBase<'DeterministicValidationStarted'> &
    Readonly<{
      datasetId: string;
      iterations: number;
    }>;

export type ReplayCompared = DeterministicReplayValidationEventBase<'ReplayCompared'> &
  Readonly<{
    iteration: number;
    matched: boolean;
    mismatchCount: number;
  }>;

export type DeterministicValidationCompleted =
  DeterministicReplayValidationEventBase<'DeterministicValidationCompleted'> &
    Readonly<{
      datasetId: string;
      iterations: number;
      successfulIterations: number;
      failedIterations: number;
      deterministic: boolean;
      completedAt: string;
    }>;

export type DeterministicValidationFailed =
  DeterministicReplayValidationEventBase<'DeterministicValidationFailed'> &
    Readonly<{
      datasetId: string;
      reason: string;
      failedAt: string;
      iteration: number | null;
    }>;

export type DeterministicReplayValidationEvent =
  | DeterministicValidationStarted
  | ReplayCompared
  | DeterministicValidationCompleted
  | DeterministicValidationFailed;

export const DETERMINISTIC_REPLAY_VALIDATION_EVENT_TYPES = [
  'DeterministicValidationStarted',
  'ReplayCompared',
  'DeterministicValidationCompleted',
  'DeterministicValidationFailed',
] as const;

export type DeterministicReplayValidationEventType =
  (typeof DETERMINISTIC_REPLAY_VALIDATION_EVENT_TYPES)[number];
