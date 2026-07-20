import type { PaperExecutionContext } from './paper-execution-context';
import type { RunnerStatus } from './runner-status';

/**
 * Domain event contracts emitted by the PaperTradingRunner.
 *
 * `sessionId` is null only on PaperRunnerFailed emitted before a
 * TradingSession was attached to the runner.
 */
type PaperRunnerEvent<Type extends string> = Readonly<{
  eventType: Type;
  sessionId: string | null;
  runtimeId: string;
  occurredAt: string;
}>;

export type PaperRunnerStarted = PaperRunnerEvent<'PaperRunnerStarted'> &
  Readonly<{
    startedAt: string;
    runnerStatus: RunnerStatus.RUNNING;
  }>;

export type PaperRunnerStopped = PaperRunnerEvent<'PaperRunnerStopped'> &
  Readonly<{
    stoppedAt: string;
    runnerStatus: RunnerStatus.STOPPED;
  }>;

export type PaperRunnerFailed = PaperRunnerEvent<'PaperRunnerFailed'> &
  Readonly<{
    failedAt: string;
    reason: string;
    runnerStatus: RunnerStatus.FAILED;
  }>;

export type PaperRunnerCycleExecuted = PaperRunnerEvent<'PaperRunnerCycleExecuted'> &
  Readonly<{
    cycleNumber: number;
    context: PaperExecutionContext;
  }>;

export type PaperRunnerDomainEvent =
  PaperRunnerStarted | PaperRunnerStopped | PaperRunnerFailed | PaperRunnerCycleExecuted;
