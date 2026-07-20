import { randomUUID } from 'node:crypto';
import {
  createApplicationEventNotificationState,
  type ApplicationEventNotifier,
  type EventEmissionDiagnostic,
} from '../research-api';
import {
  createReplayConfiguration,
  HistoricalMarketDataProvider,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  HistoricalReplayValidationError,
  type HistoricalDataset,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import type { PaperStrategy } from '../paper-trading-runner';
import {
  ExecutionStatus,
  InMemorySmokeSessionRepository,
  type ExecutionResult,
} from '../smoke-backtest';
import { generateReplayWindows } from './generate-replay-windows';
import type { ReplayWindow } from './replay-window';
import {
  createWalkForwardConfiguration,
  type WalkForwardConfiguration,
} from './walk-forward-configuration';
import type { WalkForwardEvent } from './walk-forward-events';
import {
  WalkForwardAlreadyCompletedError,
  WalkForwardDuplicateExecutionError,
  WalkForwardError,
  WalkForwardExecutionFailedError,
  WalkForwardReplayFailedError,
  WalkForwardValidationError,
} from './walk-forward-errors';
import { createWalkForwardMetrics, type WalkForwardMetrics } from './walk-forward-metrics';
import { createWalkForwardResult, type WalkForwardResult } from './walk-forward-result';

export type CreateWalkForwardStrategy = (
  marketDataProvider: HistoricalMarketDataProvider,
) => PaperStrategy;

export type CreateWalkForwardReplayService = (
  window: ReplayWindow,
  dependencies: HistoricalReplayServiceDependencies,
) => HistoricalReplayService;

export type CreateWalkForwardResultFn = (properties: WalkForwardResult) => WalkForwardResult;

export type WalkForwardValidationServiceDependencies = Readonly<{
  dataset: HistoricalDataset | null;
  configuration: WalkForwardConfiguration | null;
  createStrategy?: CreateWalkForwardStrategy | null;
  createReplayService?: CreateWalkForwardReplayService;
  createResult?: CreateWalkForwardResultFn;
  clock?: () => string;
  createExecutionId?: () => string;
  createSessionId?: (window: ReplayWindow, executionId: string) => string;
  createRuntimeId?: (window: ReplayWindow, executionId: string) => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  workspaceId?: string;
  strategyId?: string;
  applicationEventNotifier?: ApplicationEventNotifier<WalkForwardEvent>;
  /**
   * When true, a repeated execute() after completion rejects with
   * WalkForwardAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

const DEFAULT_WORKSPACE_ID = 'walk-forward-workspace';
const DEFAULT_STRATEGY_ID = 'walk-forward-strategy';

/**
 * US194 Walk Forward Validation application service.
 *
 * Orchestrates multiple independent HistoricalReplayService executions over
 * sequential ReplayWindows. Contains no trading logic.
 */
export class WalkForwardValidationService {
  private readonly dataset: HistoricalDataset;
  private readonly configuration: WalkForwardConfiguration;
  private readonly createStrategy: CreateWalkForwardStrategy;
  private readonly createReplayService: CreateWalkForwardReplayService;
  private readonly createResult: CreateWalkForwardResultFn;
  private readonly clock: () => string;
  private readonly createExecutionId: () => string;
  private readonly createSessionId: (window: ReplayWindow, executionId: string) => string;
  private readonly createRuntimeId: (window: ReplayWindow, executionId: string) => string;
  private readonly leaseDurationMs: number | undefined;
  private readonly heartbeatTimeoutMs: number | undefined;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: WalkForwardEvent[] = [];
  private readonly notifyCompletion: (event: WalkForwardEvent) => void;
  private readonly completionEmissionDiagnostics: () => readonly EventEmissionDiagnostic[];
  private completedResult: WalkForwardResult | null = null;
  private inFlight = false;
  private lastMetrics: WalkForwardMetrics | null = null;
  private generatedWindows: readonly ReplayWindow[] | null = null;

  private constructor(dependencies: WalkForwardValidationServiceDependencies) {
    this.dataset = dependencies.dataset as HistoricalDataset;
    this.configuration = dependencies.configuration as WalkForwardConfiguration;
    this.createStrategy =
      dependencies.createStrategy ??
      ((provider) => HistoricalReplayStrategy.create({ marketDataProvider: provider }));
    this.createReplayService =
      dependencies.createReplayService ??
      ((_, replayDependencies) => HistoricalReplayService.create(replayDependencies));
    this.createResult = dependencies.createResult ?? createWalkForwardResult;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createExecutionId = dependencies.createExecutionId ?? (() => randomUUID());
    this.createSessionId =
      dependencies.createSessionId ??
      ((window, executionId) => `${executionId}-${window.windowId}`);
    this.createRuntimeId =
      dependencies.createRuntimeId ??
      ((window, executionId) => `${executionId}-${window.windowId}-runtime`);
    this.leaseDurationMs = dependencies.leaseDurationMs;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs;
    this.workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    this.strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    this.rejectOnRepeat = dependencies.rejectOnRepeat === true;
    const notificationState = createApplicationEventNotificationState(
      this.applicationEvents,
      this.clock,
      dependencies.applicationEventNotifier,
    );
    this.notifyCompletion = notificationState.notify;
    this.completionEmissionDiagnostics = notificationState.diagnostics;
  }

  static create(
    dependencies: WalkForwardValidationServiceDependencies,
  ): WalkForwardValidationService {
    if (dependencies.dataset === null || dependencies.dataset === undefined) {
      throw new WalkForwardValidationError('dataset is required');
    }
    if (dependencies.dataset.candles.length === 0) {
      throw new WalkForwardValidationError('dataset must not be empty');
    }
    if (dependencies.configuration === null || dependencies.configuration === undefined) {
      throw new WalkForwardValidationError('configuration is required');
    }

    let configuration: WalkForwardConfiguration;
    try {
      configuration = createWalkForwardConfiguration(dependencies.configuration);
    } catch (error) {
      throw new WalkForwardValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    if (configuration.datasetId !== dependencies.dataset.datasetId) {
      throw new WalkForwardValidationError(
        `configuration datasetId mismatch: ${configuration.datasetId}`,
      );
    }

    if (dependencies.createStrategy === null) {
      throw new WalkForwardValidationError('strategy is required');
    }
    if (
      dependencies.createStrategy !== undefined &&
      typeof dependencies.createStrategy !== 'function'
    ) {
      throw new WalkForwardValidationError('invalid strategy');
    }

    const workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    if (workspaceId === '') {
      throw new WalkForwardValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    if (strategyId === '') {
      throw new WalkForwardValidationError('strategyId is required');
    }

    try {
      generateReplayWindows(dependencies.dataset, configuration);
    } catch (error) {
      throw new WalkForwardValidationError(
        error instanceof Error ? error.message : String(error),
        error,
      );
    }

    return new WalkForwardValidationService({
      ...dependencies,
      configuration,
      workspaceId,
      strategyId,
    });
  }

  /**
   * Runs one Historical Replay per ReplayWindow in deterministic order.
   *
   * Windows execute independently — no shared TradingSession, lease, or
   * runner runtime. Idempotent for a completed execution.
   */
  async execute(): Promise<WalkForwardResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new WalkForwardAlreadyCompletedError(this.completedResult.executionId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new WalkForwardDuplicateExecutionError();
    }

    this.inFlight = true;
    const startedAt = this.clock();
    const executionId = this.createExecutionId();
    const datasetId = this.dataset.datasetId;
    const windows = generateReplayWindows(this.dataset, this.configuration);
    this.generatedWindows = windows;

    this.emit({
      eventType: 'WalkForwardStarted',
      executionId,
      occurredAt: startedAt,
      datasetId,
      totalWindows: windows.length,
    });

    const replayResults: ExecutionResult[] = [];
    let completedWindows = 0;
    let failedWindows = 0;
    let candlesProcessed = 0;
    let cyclesExecuted = 0;
    let failedWindowId: string | null = null;

    try {
      for (const window of windows) {
        let strategy: PaperStrategy;
        try {
          const marketDataProvider = HistoricalMarketDataProvider.create({
            dataset: this.dataset,
            configuration: createReplayConfiguration({
              datasetId,
              startIndex: window.startIndex,
              endIndex: window.endIndex,
            }),
          });
          strategy = this.createStrategy(marketDataProvider);
          if (strategy === null || strategy === undefined) {
            throw new WalkForwardValidationError('invalid strategy');
          }

          const replay = this.createReplayService(window, {
            dataset: this.dataset,
            strategy,
            marketDataProvider,
            configuration: createReplayConfiguration({
              datasetId,
              startIndex: window.startIndex,
              endIndex: window.endIndex,
            }),
            workspaceId: this.workspaceId,
            strategyId: this.strategyId,
            clock: this.clock,
            createSessionId: () => this.createSessionId(window, executionId),
            createRuntimeId: () => this.createRuntimeId(window, executionId),
            leaseDurationMs: this.leaseDurationMs,
            heartbeatTimeoutMs: this.heartbeatTimeoutMs,
            repository: new InMemorySmokeSessionRepository(),
          });

          const result = await replay.execute();
          if (result.executionStatus !== ExecutionStatus.COMPLETED) {
            throw new WalkForwardReplayFailedError(
              window.windowId,
              new Error(result.errors.join('; ') || 'replay execution failed'),
            );
          }

          replayResults.push(result);
          completedWindows += 1;
          candlesProcessed += result.candlesProcessed;
          cyclesExecuted += result.cyclesExecuted;

          this.notifyCompletion({
            eventType: 'WalkForwardWindowCompleted',
            executionId,
            occurredAt: this.clock(),
            datasetId,
            windowId: window.windowId,
            sessionId: result.sessionId,
            candlesProcessed: result.candlesProcessed,
            cyclesExecuted: result.cyclesExecuted,
          });
        } catch (error) {
          failedWindows += 1;
          failedWindowId = window.windowId;
          throw this.mapWindowError(window.windowId, error);
        }
      }

      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

      const result = this.createResult({
        executionId,
        datasetId,
        totalWindows: windows.length,
        completedWindows,
        failedWindows,
        replayResults,
        startedAt,
        completedAt,
        duration,
      });

      this.completedResult = result;
      this.lastMetrics = createWalkForwardMetrics({
        windowsExecuted: completedWindows,
        windowsFailed: failedWindows,
        candlesProcessed,
        cyclesExecuted,
        executionDuration: duration,
      });

      this.notifyCompletion({
        eventType: 'WalkForwardCompleted',
        executionId,
        occurredAt: completedAt,
        datasetId,
        totalWindows: windows.length,
        completedWindows,
        failedWindows,
        completedAt,
      });

      return result;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const reason = mapped.message;

      this.emit({
        eventType: 'WalkForwardFailed',
        executionId,
        occurredAt: failedAt,
        datasetId,
        reason,
        failedAt,
        windowId: failedWindowId,
      });

      const duration = Math.max(0, Date.parse(failedAt) - Date.parse(startedAt));
      const failedResult = this.createResult({
        executionId,
        datasetId,
        totalWindows: windows.length,
        completedWindows,
        failedWindows,
        replayResults,
        startedAt,
        completedAt: failedAt,
        duration,
      });
      this.completedResult = failedResult;
      this.lastMetrics = createWalkForwardMetrics({
        windowsExecuted: completedWindows,
        windowsFailed: failedWindows,
        candlesProcessed,
        cyclesExecuted,
        executionDuration: duration,
      });

      throw mapped;
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly WalkForwardEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): WalkForwardMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): WalkForwardResult | null {
    return this.completedResult;
  }

  eventEmissionDiagnostics(): readonly EventEmissionDiagnostic[] {
    return this.completionEmissionDiagnostics();
  }

  windows(): readonly ReplayWindow[] {
    if (this.generatedWindows !== null) {
      return this.generatedWindows;
    }
    return generateReplayWindows(this.dataset, this.configuration);
  }

  walkForwardConfiguration(): WalkForwardConfiguration {
    return this.configuration;
  }

  historicalDataset(): HistoricalDataset {
    return this.dataset;
  }

  private mapWindowError(windowId: string, error: unknown): Error {
    if (error instanceof WalkForwardError) {
      return error;
    }
    if (error instanceof HistoricalReplayValidationError) {
      return new WalkForwardValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new WalkForwardReplayFailedError(windowId, error);
    }
    return new WalkForwardReplayFailedError(windowId, error);
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof WalkForwardError) {
      return error;
    }
    if (error instanceof Error) {
      return new WalkForwardExecutionFailedError(error.message, error);
    }
    return new WalkForwardExecutionFailedError(String(error), error);
  }

  private emit(event: WalkForwardEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}
