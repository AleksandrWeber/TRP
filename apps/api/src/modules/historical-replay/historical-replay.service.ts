import {
  ResearchApplicationService,
  ResearchValidationError,
  createApplicationEventNotificationState,
  type ApplicationEventNotifier,
  type EventEmissionDiagnostic,
  type ResearchSessionRepository,
  type ResearchSessionResponse,
} from '../research-api';
import {
  ActiveRecoveryError,
  ExpiredRuntimeHeartbeatError,
  InactiveRuntimeLeaseError,
  InvalidExecutionModeError,
  type PaperStrategy,
  RunnerStatus,
} from '../paper-trading-runner';
import {
  createExecutionResult,
  ExecutionStatus,
  InMemorySmokeSessionRepository,
  type ExecutionResult,
  type SmokeResearchOrchestrator,
} from '../smoke-backtest';
import { ExecutionMode, isExecutionMode } from '../trading-session/domain';
import type { HistoricalDataset } from './historical-dataset';
import { HistoricalMarketDataProvider } from './historical-market-data-provider';
import type { HistoricalReplayEvent } from './historical-replay-events';
import {
  HistoricalReplayActiveRecoveryError,
  HistoricalReplayAlreadyCompletedError,
  HistoricalReplayDuplicateExecutionError,
  HistoricalReplayError,
  HistoricalReplayExecutionFailedError,
  HistoricalReplayExpiredHeartbeatError,
  HistoricalReplayExpiredLeaseError,
  HistoricalReplayRunnerStartupError,
  HistoricalReplayValidationError,
} from './historical-replay-errors';
import { type ReplayConfiguration } from './replay-configuration';
import { createReplayMetrics, type ReplayMetrics } from './replay-metrics';

/**
 * Narrow research orchestration surface used by historical replay.
 * ResearchApplicationService satisfies this contract structurally.
 * SmokeBacktestService uses the same orchestrator shape.
 */
export type HistoricalResearchOrchestrator = SmokeResearchOrchestrator;

export type HistoricalReplayServiceDependencies = Readonly<{
  dataset: HistoricalDataset | null;
  strategy: PaperStrategy | null;
  marketDataProvider?: HistoricalMarketDataProvider | null;
  configuration?: ReplayConfiguration;
  workspaceId?: string;
  strategyId?: string;
  executionMode?: ExecutionMode;
  clock?: () => string;
  createSessionId?: () => string;
  createRuntimeId?: () => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  repository?: ResearchSessionRepository;
  researchService?: HistoricalResearchOrchestrator;
  applicationEventNotifier?: ApplicationEventNotifier<HistoricalReplayEvent>;
  /**
   * When true, a repeated execute() after completion rejects with
   * HistoricalReplayAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

const DEFAULT_WORKSPACE_ID = 'historical-replay-workspace';
const DEFAULT_STRATEGY_ID = 'historical-replay-strategy';

/**
 * US193 Historical Replay application service.
 *
 * Coordinates ResearchApplicationService → PaperTradingRunner →
 * TradingSession with HistoricalMarketDataProvider. Contains no trading
 * logic. Datasets remain in memory.
 */
export class HistoricalReplayService {
  private readonly dataset: HistoricalDataset;
  private readonly strategy: PaperStrategy;
  private readonly marketDataProvider: HistoricalMarketDataProvider;
  private readonly configuration: ReplayConfiguration;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly executionMode: ExecutionMode;
  private readonly clock: () => string;
  private readonly research: HistoricalResearchOrchestrator;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: HistoricalReplayEvent[] = [];
  private readonly notifyCompletion: (event: HistoricalReplayEvent) => void;
  private readonly completionEmissionDiagnostics: () => readonly EventEmissionDiagnostic[];
  private completedResult: ExecutionResult | null = null;
  private inFlight = false;
  private lastMetrics: ReplayMetrics | null = null;

  private constructor(
    dependencies: HistoricalReplayServiceDependencies,
    research: HistoricalResearchOrchestrator,
    marketDataProvider: HistoricalMarketDataProvider,
    configuration: ReplayConfiguration,
  ) {
    this.dataset = dependencies.dataset as HistoricalDataset;
    this.strategy = dependencies.strategy as PaperStrategy;
    this.marketDataProvider = marketDataProvider;
    this.configuration = configuration;
    this.workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    this.strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    this.executionMode = dependencies.executionMode ?? ExecutionMode.PAPER;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.research = research;
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
    const notificationState = createApplicationEventNotificationState(
      this.applicationEvents,
      this.clock,
      dependencies.applicationEventNotifier,
    );
    this.notifyCompletion = notificationState.notify;
    this.completionEmissionDiagnostics = notificationState.diagnostics;
  }

  static create(dependencies: HistoricalReplayServiceDependencies): HistoricalReplayService {
    if (dependencies.dataset === null || dependencies.dataset === undefined) {
      throw new HistoricalReplayValidationError('dataset is required');
    }
    if (dependencies.strategy === null || dependencies.strategy === undefined) {
      throw new HistoricalReplayValidationError('strategy is required');
    }
    if (dependencies.marketDataProvider === null) {
      throw new HistoricalReplayValidationError('marketDataProvider is required');
    }

    const executionMode = dependencies.executionMode ?? ExecutionMode.PAPER;
    if (!isExecutionMode(executionMode) || executionMode !== ExecutionMode.PAPER) {
      throw new HistoricalReplayValidationError(`invalid execution mode: ${String(executionMode)}`);
    }

    const workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    if (workspaceId === '') {
      throw new HistoricalReplayValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    if (strategyId === '') {
      throw new HistoricalReplayValidationError('strategyId is required');
    }

    let configuration: ReplayConfiguration;
    let marketDataProvider: HistoricalMarketDataProvider;
    try {
      marketDataProvider =
        dependencies.marketDataProvider ??
        HistoricalMarketDataProvider.create({
          dataset: dependencies.dataset,
          configuration: dependencies.configuration,
        });
      configuration = dependencies.configuration ?? marketDataProvider.replayConfiguration();
    } catch (error) {
      throw new HistoricalReplayValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    if (configuration.datasetId !== dependencies.dataset.datasetId) {
      throw new HistoricalReplayValidationError(
        `replay configuration datasetId mismatch: ${configuration.datasetId}`,
      );
    }

    const research =
      dependencies.researchService ??
      ResearchApplicationService.create({
        repository: dependencies.repository ?? new InMemorySmokeSessionRepository(),
        resolveStrategy: () => dependencies.strategy as PaperStrategy,
        clock: dependencies.clock,
        createSessionId: dependencies.createSessionId,
        createRuntimeId: dependencies.createRuntimeId,
        leaseDurationMs: dependencies.leaseDurationMs,
        heartbeatTimeoutMs: dependencies.heartbeatTimeoutMs,
      });

    return new HistoricalReplayService(dependencies, research, marketDataProvider, configuration);
  }

  /**
   * Runs historical playback once:
   * create → start → cycle until end of stream → stop → ExecutionResult.
   *
   * Idempotent for a completed execution: returns the same final result, or
   * rejects with HistoricalReplayAlreadyCompletedError when rejectOnRepeat is set.
   * Concurrent re-entry is rejected so duplicate runners are never created.
   */
  async execute(): Promise<ExecutionResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new HistoricalReplayAlreadyCompletedError(this.completedResult.sessionId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new HistoricalReplayDuplicateExecutionError();
    }

    this.inFlight = true;
    let sessionId: string | null = null;
    let candlesProcessed = 0;
    const startedAt = this.clock();
    const datasetId = this.dataset.datasetId;

    this.marketDataProvider.initialize();
    this.marketDataProvider.reset();

    this.emit({
      eventType: 'HistoricalReplayStarted',
      sessionId: null,
      occurredAt: startedAt,
      datasetId,
      candlesToProcess: this.marketDataProvider.size(),
    });

    try {
      const created = await this.research.createSession({
        executionMode: this.executionMode,
        strategyId: this.strategyId,
        workspaceId: this.workspaceId,
        metadata: {
          source: 'historical-replay',
          datasetId,
          replaySpeed: this.configuration.replaySpeed,
        },
      });
      sessionId = created.sessionId;

      let started: ResearchSessionResponse;
      try {
        started = await this.research.startSession(sessionId);
      } catch (error) {
        throw this.mapStartupError(error);
      }

      let lastResponse = started;
      while (this.marketDataProvider.hasNext()) {
        lastResponse = await this.research.runCycle(sessionId);
        candlesProcessed += 1;
      }

      const stopped = await this.research.stopSession(sessionId);
      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
      const replayCompleted = this.marketDataProvider.isEndOfStream();

      const result = createExecutionResult({
        sessionId,
        runnerStatus: stopped.runnerStatus,
        executionStatus: ExecutionStatus.COMPLETED,
        cyclesExecuted: stopped.cycleNumber,
        startedAt: started.startedAt ?? startedAt,
        completedAt,
        duration,
        eventsPublished: this.applicationEvents.length,
        errors: Object.freeze([]),
        datasetId,
        candlesProcessed,
        replayCompleted,
      });

      this.completedResult = result;
      this.lastMetrics = createReplayMetrics({
        candlesProcessed,
        replayDuration: duration,
        cyclesExecuted: stopped.cycleNumber,
        eventsPublished: this.applicationEvents.length,
        errorCount: 0,
      });

      this.notifyCompletion({
        eventType: 'HistoricalReplayCompleted',
        sessionId,
        occurredAt: completedAt,
        datasetId,
        candlesProcessed,
        cyclesExecuted: lastResponse.cycleNumber,
        completedAt,
      });
      this.notifyCompletion({
        eventType: 'HistoricalReplayFinished',
        sessionId,
        occurredAt: completedAt,
        datasetId,
        replayCompleted,
        finishedAt: completedAt,
      });

      return result;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const reason = mapped.message;

      this.emit({
        eventType: 'HistoricalReplayFailed',
        sessionId,
        occurredAt: failedAt,
        datasetId,
        reason,
        failedAt,
      });
      this.emit({
        eventType: 'HistoricalReplayFinished',
        sessionId,
        occurredAt: failedAt,
        datasetId,
        replayCompleted: false,
        finishedAt: failedAt,
      });

      if (sessionId !== null) {
        const failedResult = createExecutionResult({
          sessionId,
          runnerStatus: RunnerStatus.FAILED,
          executionStatus: ExecutionStatus.FAILED,
          cyclesExecuted: candlesProcessed,
          startedAt,
          completedAt: failedAt,
          duration: Math.max(0, Date.parse(failedAt) - Date.parse(startedAt)),
          eventsPublished: this.applicationEvents.length,
          errors: Object.freeze([reason]),
          datasetId,
          candlesProcessed,
          replayCompleted: false,
        });
        this.completedResult = failedResult;
        this.lastMetrics = createReplayMetrics({
          candlesProcessed,
          replayDuration: failedResult.duration,
          cyclesExecuted: candlesProcessed,
          eventsPublished: this.applicationEvents.length,
          errorCount: 1,
        });
      }

      throw mapped;
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly HistoricalReplayEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): ReplayMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): ExecutionResult | null {
    return this.completedResult;
  }

  eventEmissionDiagnostics(): readonly EventEmissionDiagnostic[] {
    return this.completionEmissionDiagnostics();
  }

  marketData(): HistoricalMarketDataProvider {
    return this.marketDataProvider;
  }

  paperStrategy(): PaperStrategy {
    return this.strategy;
  }

  historicalDataset(): HistoricalDataset {
    return this.dataset;
  }

  replayConfiguration(): ReplayConfiguration {
    return this.configuration;
  }

  private mapStartupError(error: unknown): Error {
    const mapped = this.mapExecutionError(error);
    if (
      mapped instanceof HistoricalReplayActiveRecoveryError ||
      mapped instanceof HistoricalReplayExpiredLeaseError ||
      mapped instanceof HistoricalReplayExpiredHeartbeatError
    ) {
      return mapped;
    }
    if (
      mapped instanceof HistoricalReplayValidationError &&
      (/invalid execution mode/i.test(mapped.message) ||
        mapped.cause instanceof InvalidExecutionModeError ||
        (mapped.cause instanceof ResearchValidationError &&
          mapped.cause.cause instanceof InvalidExecutionModeError))
    ) {
      return mapped;
    }
    return new HistoricalReplayRunnerStartupError(mapped.message || 'runner startup failed', error);
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof HistoricalReplayError) {
      return error;
    }

    const cause = error instanceof ResearchValidationError ? (error.cause ?? error) : error;

    if (
      cause instanceof ActiveRecoveryError ||
      (error instanceof Error && /active recovery/i.test(error.message))
    ) {
      return new HistoricalReplayActiveRecoveryError(error);
    }
    if (
      cause instanceof ExpiredRuntimeHeartbeatError ||
      (error instanceof Error && /heartbeat has expired/i.test(error.message))
    ) {
      return new HistoricalReplayExpiredHeartbeatError(error);
    }
    if (
      cause instanceof InactiveRuntimeLeaseError ||
      (error instanceof Error &&
        /lease is missing, expired|inactive.*lease|expired.*lease/i.test(error.message))
    ) {
      return new HistoricalReplayExpiredLeaseError(error);
    }
    if (
      cause instanceof InvalidExecutionModeError ||
      (error instanceof Error && /invalid execution mode/i.test(error.message))
    ) {
      return new HistoricalReplayValidationError(
        error instanceof Error ? error.message : 'invalid execution mode',
        error,
      );
    }
    if (error instanceof ResearchValidationError) {
      return new HistoricalReplayValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new HistoricalReplayExecutionFailedError(error.message, error);
    }
    return new HistoricalReplayExecutionFailedError(String(error), error);
  }

  private emit(event: HistoricalReplayEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}
