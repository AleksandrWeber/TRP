/**
 * Application events for US194 Walk Forward Validation.
 *
 * Collected in-memory by WalkForwardValidationService. No transport layer
 * and no message bus.
 */

type WalkForwardEventBase<Type extends string> = Readonly<{
  eventType: Type;
  executionId: string;
  occurredAt: string;
}>;

export type WalkForwardStarted = WalkForwardEventBase<'WalkForwardStarted'> &
  Readonly<{
    datasetId: string;
    totalWindows: number;
  }>;

export type WalkForwardWindowCompleted = WalkForwardEventBase<'WalkForwardWindowCompleted'> &
  Readonly<{
    datasetId: string;
    windowId: string;
    sessionId: string;
    candlesProcessed: number;
    cyclesExecuted: number;
  }>;

export type WalkForwardCompleted = WalkForwardEventBase<'WalkForwardCompleted'> &
  Readonly<{
    datasetId: string;
    totalWindows: number;
    completedWindows: number;
    failedWindows: number;
    completedAt: string;
  }>;

export type WalkForwardFailed = WalkForwardEventBase<'WalkForwardFailed'> &
  Readonly<{
    datasetId: string;
    reason: string;
    failedAt: string;
    windowId: string | null;
  }>;

export type WalkForwardEvent =
  WalkForwardStarted | WalkForwardWindowCompleted | WalkForwardCompleted | WalkForwardFailed;
