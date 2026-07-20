/**
 * Application events for the US191 Smoke Backtest.
 *
 * Collected in-memory by SmokeBacktestService. No transport layer and no
 * message bus.
 */

type SmokeBacktestEventBase<Type extends string> = Readonly<{
  eventType: Type;
  sessionId: string | null;
  occurredAt: string;
}>;

export type SmokeBacktestStarted = SmokeBacktestEventBase<'SmokeBacktestStarted'> &
  Readonly<{
    cycles: number;
  }>;

export type SmokeBacktestCompleted = SmokeBacktestEventBase<'SmokeBacktestCompleted'> &
  Readonly<{
    sessionId: string;
    cyclesExecuted: number;
    completedAt: string;
  }>;

export type SmokeBacktestFailed = SmokeBacktestEventBase<'SmokeBacktestFailed'> &
  Readonly<{
    reason: string;
    failedAt: string;
  }>;

export type SmokeBacktestEvent =
  SmokeBacktestStarted | SmokeBacktestCompleted | SmokeBacktestFailed;
