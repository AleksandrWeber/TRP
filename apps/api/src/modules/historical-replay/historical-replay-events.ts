/**
 * Application events for the US193 Historical Replay.
 *
 * Collected in-memory by HistoricalReplayService. No transport layer and no
 * message bus.
 */

type HistoricalReplayEventBase<Type extends string> = Readonly<{
  eventType: Type;
  sessionId: string | null;
  occurredAt: string;
}>;

export type HistoricalReplayStarted = HistoricalReplayEventBase<'HistoricalReplayStarted'> &
  Readonly<{
    datasetId: string;
    candlesToProcess: number;
  }>;

export type HistoricalReplayCompleted = HistoricalReplayEventBase<'HistoricalReplayCompleted'> &
  Readonly<{
    sessionId: string;
    datasetId: string;
    candlesProcessed: number;
    cyclesExecuted: number;
    completedAt: string;
  }>;

export type HistoricalReplayFailed = HistoricalReplayEventBase<'HistoricalReplayFailed'> &
  Readonly<{
    datasetId: string;
    reason: string;
    failedAt: string;
  }>;

export type HistoricalReplayFinished = HistoricalReplayEventBase<'HistoricalReplayFinished'> &
  Readonly<{
    datasetId: string;
    replayCompleted: boolean;
    finishedAt: string;
  }>;

export type HistoricalReplayEvent =
  | HistoricalReplayStarted
  | HistoricalReplayCompleted
  | HistoricalReplayFailed
  | HistoricalReplayFinished;
