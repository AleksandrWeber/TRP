import {
  ResearchApplicationService,
  ResearchValidationError,
  createApplicationEventNotificationState,
  type ApplicationEventNotifier,
  type CreateResearchSessionRequest,
  type EventEmissionDiagnostic,
  type ResearchSessionRecord,
  type ResearchSessionRepository,
  type ResearchSessionResponse,
} from '../research-api';
import {
  ActiveRecoveryError,
  ExpiredRuntimeHeartbeatError,
  InactiveRuntimeLeaseError,
  InvalidExecutionModeError,
  type MarketDataProvider,
  type PaperStrategy,
  RunnerStatus,
} from '../paper-trading-runner';
import { ExecutionMode, isExecutionMode } from '../trading-session/domain';
import {
  createExecutionResult,
  ExecutionStatus,
  metricsFromResult,
  type ExecutionMetrics,
  type ExecutionResult,
} from './execution-result';
import type { SmokeBacktestEvent } from './smoke-backtest-events';
import {
  SmokeBacktestActiveRecoveryError,
  SmokeBacktestAlreadyCompletedError,
  SmokeBacktestDuplicateExecutionError,
  SmokeBacktestError,
  SmokeBacktestExecutionFailedError,
  SmokeBacktestExpiredHeartbeatError,
  SmokeBacktestExpiredLeaseError,
  SmokeBacktestRunnerStartupError,
  SmokeBacktestValidationError,
} from './smoke-backtest-errors';
import type { SmokeCandle } from './stub-market-data-provider';

/**
 * Narrow research orchestration surface used by the smoke backtest.
 * ResearchApplicationService satisfies this contract structurally.
 */
export type SmokeResearchOrchestrator = Readonly<{
  createSession(request: CreateResearchSessionRequest): Promise<ResearchSessionResponse>;
  startSession(sessionId: string): Promise<ResearchSessionResponse>;
  runCycle(sessionId: string): Promise<ResearchSessionResponse>;
  stopSession(sessionId: string): Promise<ResearchSessionResponse>;
  domainEvents(): readonly unknown[];
}>;

export type SmokeBacktestServiceDependencies = Readonly<{
  strategy: PaperStrategy | null;
  marketDataProvider: MarketDataProvider<SmokeCandle> | null;
  cycles?: number;
  workspaceId?: string;
  strategyId?: string;
  executionMode?: ExecutionMode;
  clock?: () => string;
  createSessionId?: () => string;
  createRuntimeId?: () => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
  repository?: ResearchSessionRepository;
  researchService?: SmokeResearchOrchestrator;
  applicationEventNotifier?: ApplicationEventNotifier<SmokeBacktestEvent>;
  /**
   * When true, a repeated execute() after completion rejects with
   * SmokeBacktestAlreadyCompletedError instead of returning the cached result.
   */
  rejectOnRepeat?: boolean;
}>;

const DEFAULT_CYCLES = 3;
const DEFAULT_WORKSPACE_ID = 'smoke-workspace';
const DEFAULT_STRATEGY_ID = 'stub-paper-strategy';

/**
 * US191 Smoke Backtest application service.
 *
 * Coordinates ResearchApplicationService → PaperTradingRunner →
 * TradingSession with stub market data and strategy. Contains no trading
 * logic and no persistence of results.
 */
export class SmokeBacktestService {
  private readonly strategy: PaperStrategy;
  private readonly marketDataProvider: MarketDataProvider<SmokeCandle>;
  private readonly cycles: number;
  private readonly workspaceId: string;
  private readonly strategyId: string;
  private readonly executionMode: ExecutionMode;
  private readonly clock: () => string;
  private readonly research: SmokeResearchOrchestrator;
  private readonly rejectOnRepeat: boolean;
  private readonly applicationEvents: SmokeBacktestEvent[] = [];
  private readonly notifyCompletion: (event: SmokeBacktestEvent) => void;
  private readonly completionEmissionDiagnostics: () => readonly EventEmissionDiagnostic[];
  private completedResult: ExecutionResult | null = null;
  private inFlight = false;
  private lastMetrics: ExecutionMetrics | null = null;

  private constructor(
    dependencies: SmokeBacktestServiceDependencies,
    research: SmokeResearchOrchestrator,
  ) {
    this.strategy = dependencies.strategy as PaperStrategy;
    this.marketDataProvider = dependencies.marketDataProvider as MarketDataProvider<SmokeCandle>;
    this.cycles = dependencies.cycles ?? DEFAULT_CYCLES;
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

  static create(dependencies: SmokeBacktestServiceDependencies): SmokeBacktestService {
    if (dependencies.strategy === null || dependencies.strategy === undefined) {
      throw new SmokeBacktestValidationError('strategy is required');
    }
    if (dependencies.marketDataProvider === null || dependencies.marketDataProvider === undefined) {
      throw new SmokeBacktestValidationError('marketDataProvider is required');
    }

    const cycles = dependencies.cycles ?? DEFAULT_CYCLES;
    if (!Number.isInteger(cycles) || cycles < 1) {
      throw new SmokeBacktestValidationError('cycles must be a positive integer');
    }

    const executionMode = dependencies.executionMode ?? ExecutionMode.PAPER;
    if (!isExecutionMode(executionMode) || executionMode !== ExecutionMode.PAPER) {
      throw new SmokeBacktestValidationError(`invalid execution mode: ${String(executionMode)}`);
    }

    const workspaceId = (dependencies.workspaceId ?? DEFAULT_WORKSPACE_ID).trim();
    if (workspaceId === '') {
      throw new SmokeBacktestValidationError('workspaceId is required');
    }

    const strategyId = (dependencies.strategyId ?? DEFAULT_STRATEGY_ID).trim();
    if (strategyId === '') {
      throw new SmokeBacktestValidationError('strategyId is required');
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

    return new SmokeBacktestService(dependencies, research);
  }

  /**
   * Runs the full smoke pipeline once:
   * create → start → N cycles → stop → ExecutionResult.
   *
   * Idempotent for a completed execution: returns the same final result, or
   * rejects with SmokeBacktestAlreadyCompletedError when rejectOnRepeat is set.
   * Concurrent re-entry is rejected so duplicate runners are never created.
   */
  async execute(): Promise<ExecutionResult> {
    if (this.completedResult !== null) {
      if (this.rejectOnRepeat) {
        throw new SmokeBacktestAlreadyCompletedError(this.completedResult.sessionId);
      }
      return this.completedResult;
    }
    if (this.inFlight) {
      throw new SmokeBacktestDuplicateExecutionError();
    }

    this.inFlight = true;
    let sessionId: string | null = null;
    const startedAt = this.clock();
    this.emit({
      eventType: 'SmokeBacktestStarted',
      sessionId: null,
      occurredAt: startedAt,
      cycles: this.cycles,
    });

    try {
      const created = await this.research.createSession({
        executionMode: this.executionMode,
        strategyId: this.strategyId,
        workspaceId: this.workspaceId,
        metadata: { source: 'smoke-backtest' },
      });
      sessionId = created.sessionId;

      let started: ResearchSessionResponse;
      try {
        started = await this.research.startSession(sessionId);
      } catch (error) {
        throw this.mapStartupError(error);
      }

      let lastResponse = started;
      for (let index = 0; index < this.cycles; index += 1) {
        lastResponse = await this.research.runCycle(sessionId);
      }

      const stopped = await this.research.stopSession(sessionId);
      const completedAt = this.clock();
      const duration = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));

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
        datasetId: 'smoke-stub',
        candlesProcessed: stopped.cycleNumber,
        replayCompleted: true,
      });

      this.completedResult = result;
      this.lastMetrics = metricsFromResult(result);

      this.notifyCompletion({
        eventType: 'SmokeBacktestCompleted',
        sessionId,
        occurredAt: completedAt,
        cyclesExecuted: lastResponse.cycleNumber,
        completedAt,
      });

      return result;
    } catch (error) {
      const failedAt = this.clock();
      const mapped = this.mapExecutionError(error);
      const reason = mapped.message;

      this.emit({
        eventType: 'SmokeBacktestFailed',
        sessionId,
        occurredAt: failedAt,
        reason,
        failedAt,
      });

      if (sessionId !== null) {
        const failedResult = createExecutionResult({
          sessionId,
          runnerStatus: RunnerStatus.FAILED,
          executionStatus: ExecutionStatus.FAILED,
          cyclesExecuted: 0,
          startedAt,
          completedAt: failedAt,
          duration: Math.max(0, Date.parse(failedAt) - Date.parse(startedAt)),
          eventsPublished: this.applicationEvents.length,
          errors: Object.freeze([reason]),
          datasetId: 'smoke-stub',
          candlesProcessed: 0,
          replayCompleted: false,
        });
        this.completedResult = failedResult;
        this.lastMetrics = metricsFromResult(failedResult);
      }

      throw mapped;
    } finally {
      this.inFlight = false;
    }
  }

  domainEvents(): readonly SmokeBacktestEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  metrics(): ExecutionMetrics | null {
    return this.lastMetrics;
  }

  lastResult(): ExecutionResult | null {
    return this.completedResult;
  }

  eventEmissionDiagnostics(): readonly EventEmissionDiagnostic[] {
    return this.completionEmissionDiagnostics();
  }

  marketData(): MarketDataProvider<SmokeCandle> {
    return this.marketDataProvider;
  }

  paperStrategy(): PaperStrategy {
    return this.strategy;
  }

  private mapStartupError(error: unknown): Error {
    const mapped = this.mapExecutionError(error);
    if (
      mapped instanceof SmokeBacktestActiveRecoveryError ||
      mapped instanceof SmokeBacktestExpiredLeaseError ||
      mapped instanceof SmokeBacktestExpiredHeartbeatError
    ) {
      return mapped;
    }
    if (
      mapped instanceof SmokeBacktestValidationError &&
      (/invalid execution mode/i.test(mapped.message) ||
        mapped.cause instanceof InvalidExecutionModeError ||
        (mapped.cause instanceof ResearchValidationError &&
          mapped.cause.cause instanceof InvalidExecutionModeError))
    ) {
      return mapped;
    }
    return new SmokeBacktestRunnerStartupError(mapped.message || 'runner startup failed', error);
  }

  private mapExecutionError(error: unknown): Error {
    if (error instanceof SmokeBacktestError) {
      return error;
    }

    const cause = error instanceof ResearchValidationError ? (error.cause ?? error) : error;

    if (
      cause instanceof ActiveRecoveryError ||
      (error instanceof Error && /active recovery/i.test(error.message))
    ) {
      return new SmokeBacktestActiveRecoveryError(error);
    }
    if (
      cause instanceof ExpiredRuntimeHeartbeatError ||
      (error instanceof Error && /heartbeat has expired/i.test(error.message))
    ) {
      return new SmokeBacktestExpiredHeartbeatError(error);
    }
    if (
      cause instanceof InactiveRuntimeLeaseError ||
      (error instanceof Error &&
        /lease is missing, expired|inactive.*lease|expired.*lease/i.test(error.message))
    ) {
      return new SmokeBacktestExpiredLeaseError(error);
    }
    if (
      cause instanceof InvalidExecutionModeError ||
      (error instanceof Error && /invalid execution mode/i.test(error.message))
    ) {
      return new SmokeBacktestValidationError(
        error instanceof Error ? error.message : 'invalid execution mode',
        error,
      );
    }
    if (error instanceof ResearchValidationError) {
      return new SmokeBacktestValidationError(error.message, error);
    }
    if (error instanceof Error) {
      return new SmokeBacktestExecutionFailedError(error.message, error);
    }
    return new SmokeBacktestExecutionFailedError(String(error), error);
  }

  private emit(event: SmokeBacktestEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}

/**
 * Ephemeral in-memory repository for smoke runs. Not a persistence layer —
 * results are never stored historically.
 */
export class InMemorySmokeSessionRepository implements ResearchSessionRepository {
  private readonly records = new Map<string, ResearchSessionRecord>();

  async save(record: ResearchSessionRecord): Promise<void> {
    this.records.set(record.sessionId, Object.freeze({ ...record }));
  }

  async findById(sessionId: string): Promise<ResearchSessionRecord | null> {
    return this.records.get(sessionId) ?? null;
  }

  async findAll(): Promise<readonly ResearchSessionRecord[]> {
    return Object.freeze([...this.records.values()]);
  }

  async delete(sessionId: string): Promise<void> {
    this.records.delete(sessionId);
  }
}
