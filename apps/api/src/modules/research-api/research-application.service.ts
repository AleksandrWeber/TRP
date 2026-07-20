import { randomUUID } from 'node:crypto';
import { Timeframe } from '../market-data/timeframe';
import { ExecutionMode, TradingSession, isExecutionMode } from '../trading-session/domain';
import {
  ActiveRecoveryError,
  DuplicateRunnerStopError,
  InvalidExecutionModeError,
  InvalidSessionLifecycleError,
  PaperTradingRunner,
  PaperTradingRunnerError,
  type PaperStrategy,
  RunnerStatus,
} from '../paper-trading-runner';
import {
  ResearchSessionAlreadyExistsError,
  ResearchSessionAlreadyRunningError,
  ResearchSessionNotFoundError,
  ResearchSessionStoppedError,
  ResearchValidationError,
} from './research-application-errors';
import type { ResearchApplicationEvent } from './research-application-events';
import {
  createResearchSessionRequest,
  type CreateResearchSessionRequest,
  type ResearchSessionResponse,
  type SessionSummary,
} from './research-session.dto';
import { ResearchSessionMapper } from './research-session.mapper';
import type {
  ResearchSessionRecord,
  ResearchSessionRepository,
} from './research-session.repository';

export type ResearchApplicationServiceDependencies = Readonly<{
  repository: ResearchSessionRepository;
  resolveStrategy: (strategyId: string) => PaperStrategy;
  clock?: () => string;
  createSessionId?: () => string;
  createRuntimeId?: () => string;
  mapper?: ResearchSessionMapper;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

type RuntimeEntry = {
  runner: PaperTradingRunner;
  metadata: Readonly<Record<string, unknown>> | null;
};

/**
 * US190 Research API application service.
 *
 * Orchestrates TradingSession, PaperTradingRunner, RuntimeLease, and
 * Recovery behind a stable application contract. Contains no trading
 * logic and no infrastructure-specific behavior.
 */
export class ResearchApplicationService {
  private readonly repository: ResearchSessionRepository;
  private readonly resolveStrategy: (strategyId: string) => PaperStrategy;
  private readonly clock: () => string;
  private readonly createSessionId: () => string;
  private readonly createRuntimeId: () => string;
  private readonly mapper: ResearchSessionMapper;
  private readonly leaseDurationMs: number | undefined;
  private readonly heartbeatTimeoutMs: number | undefined;
  private readonly runtimes = new Map<string, RuntimeEntry>();
  private readonly applicationEvents: ResearchApplicationEvent[] = [];

  private constructor(dependencies: ResearchApplicationServiceDependencies) {
    this.repository = dependencies.repository;
    this.resolveStrategy = dependencies.resolveStrategy;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.createSessionId = dependencies.createSessionId ?? (() => randomUUID());
    this.createRuntimeId = dependencies.createRuntimeId ?? (() => randomUUID());
    this.mapper = dependencies.mapper ?? new ResearchSessionMapper();
    this.leaseDurationMs = dependencies.leaseDurationMs;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs;
  }

  static create(dependencies: ResearchApplicationServiceDependencies): ResearchApplicationService {
    return new ResearchApplicationService(dependencies);
  }

  async createSession(
    requestInput: CreateResearchSessionRequest,
  ): Promise<ResearchSessionResponse> {
    const request = createResearchSessionRequest(requestInput);
    this.validateCreateRequest(request);

    const sessionId = this.createSessionId().trim();
    if (sessionId === '') {
      throw new ResearchValidationError('sessionId is required');
    }

    const existing = await this.repository.findById(sessionId);
    if (existing !== null) {
      throw new ResearchSessionAlreadyExistsError(sessionId);
    }

    const now = this.clock();
    const metadata = request.metadata === undefined ? null : Object.freeze({ ...request.metadata });

    const session = TradingSession.create({
      sessionId,
      workspaceId: request.workspaceId.trim(),
      deploymentId: `research-deployment-${sessionId}`,
      strategyId: request.strategyId.trim(),
      executionMode: request.executionMode,
      marketType: 'CRYPTOCURRENCY',
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      timeframe: Timeframe.M5,
      createdAt: now,
      metadataVersion: 1,
    });

    await this.repository.save(this.mapper.toRecord(session, metadata));
    this.emit({
      eventType: 'ResearchSessionCreated',
      sessionId,
      occurredAt: now,
      workspaceId: session.workspaceId,
      strategyId: session.strategyId,
      executionMode: session.executionMode,
    });

    return this.mapper.toResponse(session, null);
  }

  async startSession(sessionId: string): Promise<ResearchSessionResponse> {
    const record = await this.requireRecord(sessionId);
    const existingRuntime = this.runtimes.get(sessionId);

    if (existingRuntime !== undefined) {
      const status = existingRuntime.runner.status();
      if (status === RunnerStatus.STARTING || status === RunnerStatus.RUNNING) {
        throw new ResearchSessionAlreadyRunningError(sessionId);
      }
      if (status === RunnerStatus.STOPPED || status === RunnerStatus.FAILED) {
        throw new ResearchSessionStoppedError(sessionId);
      }
    }

    const session = this.mapper.toAggregate(record);
    if (session.isTerminal()) {
      throw new ResearchSessionStoppedError(sessionId);
    }

    let strategy: PaperStrategy;
    try {
      strategy = this.resolveStrategy(record.strategyId);
    } catch (error) {
      throw this.wrapValidation(error, 'strategy resolution failed');
    }
    if (strategy === null || strategy === undefined) {
      throw new ResearchValidationError('missing strategy');
    }

    const now = this.clock();
    const runner = PaperTradingRunner.create({
      session,
      strategy,
      runtimeId: this.createRuntimeId(),
      clock: this.clock,
      leaseDurationMs: this.leaseDurationMs,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });

    try {
      await runner.start(now);
    } catch (error) {
      throw this.mapRunnerError(sessionId, error);
    }

    this.runtimes.set(sessionId, {
      runner,
      metadata: record.metadata,
    });
    await this.persistRunner(runner, record.metadata);
    this.emit({
      eventType: 'ResearchSessionStarted',
      sessionId,
      occurredAt: now,
      startedAt: runner.startedAt() as string,
    });

    return this.mapper.toResponse(runner.session() as TradingSession, runner);
  }

  async runCycle(sessionId: string): Promise<ResearchSessionResponse> {
    const entry = await this.requireStartedRuntime(sessionId);
    if (
      entry.runner.status() === RunnerStatus.STOPPED ||
      entry.runner.status() === RunnerStatus.FAILED
    ) {
      throw new ResearchSessionStoppedError(sessionId);
    }

    try {
      await entry.runner.runCycle(this.clock());
    } catch (error) {
      await this.persistRunner(entry.runner, entry.metadata);
      throw this.mapRunnerError(sessionId, error);
    }

    await this.persistRunner(entry.runner, entry.metadata);
    return this.mapper.toResponse(entry.runner.session() as TradingSession, entry.runner);
  }

  async stopSession(sessionId: string): Promise<ResearchSessionResponse> {
    const entry = await this.requireStartedRuntime(sessionId);
    const runner = entry.runner;

    if (runner.status() === RunnerStatus.STOPPED) {
      return this.mapper.toResponse(runner.session() as TradingSession, runner);
    }
    if (runner.status() === RunnerStatus.FAILED) {
      throw new ResearchSessionStoppedError(sessionId);
    }

    const now = this.clock();
    try {
      await runner.stop(now);
    } catch (error) {
      if (error instanceof DuplicateRunnerStopError) {
        return this.mapper.toResponse(runner.session() as TradingSession, runner);
      }
      await this.persistRunner(runner, entry.metadata);
      throw this.mapRunnerError(sessionId, error);
    }

    await this.persistRunner(runner, entry.metadata);
    this.emit({
      eventType: 'ResearchSessionStopped',
      sessionId,
      occurredAt: now,
      stoppedAt: runner.stoppedAt() as string,
    });

    return this.mapper.toResponse(runner.session() as TradingSession, runner);
  }

  async recoverSession(sessionId: string): Promise<ResearchSessionResponse> {
    const record = await this.requireRecord(sessionId);
    const entry = this.runtimes.get(record.sessionId);
    const now = this.clock();

    if (entry === undefined) {
      const session = this.mapper.toAggregate(record);
      let recovered = session;
      let didRecover = false;

      try {
        if (session.isRecovering()) {
          recovered = session.completeRecovery(now);
          didRecover = true;
        } else if (session.canRecover(now)) {
          recovered = session.beginRecovery(now).completeRecovery(now);
          didRecover = true;
        }
      } catch (error) {
        throw this.wrapValidation(error, 'recovery failed');
      }

      if (didRecover) {
        await this.repository.save(this.mapper.toRecord(recovered, record.metadata));
        this.emit({
          eventType: 'ResearchSessionRecovered',
          sessionId: record.sessionId,
          occurredAt: now,
          recoveredAt: now,
        });
      }

      return this.mapper.toResponse(didRecover ? recovered : session, null);
    }

    const didRecover = entry.runner.recover(now);

    await this.persistRunner(entry.runner, entry.metadata);
    if (didRecover) {
      this.emit({
        eventType: 'ResearchSessionRecovered',
        sessionId: record.sessionId,
        occurredAt: now,
        recoveredAt: now,
      });
    }

    return this.mapper.toResponse(entry.runner.session() as TradingSession, entry.runner);
  }

  async getSession(sessionId: string): Promise<ResearchSessionResponse> {
    const record = await this.requireRecord(sessionId);
    const entry = this.runtimes.get(sessionId);
    const session = entry?.runner.session() ?? this.mapper.toAggregate(record);
    return this.mapper.toResponse(session as TradingSession, entry?.runner ?? null);
  }

  async listSessions(): Promise<readonly SessionSummary[]> {
    const records = await this.repository.findAll();
    return Object.freeze(
      records.map((record) => {
        const entry = this.runtimes.get(record.sessionId);
        const session = entry?.runner.session() ?? this.mapper.toAggregate(record);
        return this.mapper.toSummary(session as TradingSession);
      }),
    );
  }

  domainEvents(): readonly ResearchApplicationEvent[] {
    return Object.freeze([...this.applicationEvents]);
  }

  private validateCreateRequest(request: CreateResearchSessionRequest): void {
    if (!isExecutionMode(request.executionMode)) {
      throw new ResearchValidationError(`invalid execution mode: ${String(request.executionMode)}`);
    }
    if (request.executionMode !== ExecutionMode.PAPER) {
      throw new ResearchValidationError(`invalid execution mode: ${request.executionMode}`);
    }
    if (typeof request.strategyId !== 'string' || request.strategyId.trim() === '') {
      throw new ResearchValidationError('missing strategy');
    }
    if (typeof request.workspaceId !== 'string' || request.workspaceId.trim() === '') {
      throw new ResearchValidationError('workspaceId is required');
    }
  }

  private async requireRecord(sessionId: string): Promise<ResearchSessionRecord> {
    const normalized = typeof sessionId === 'string' ? sessionId.trim() : '';
    if (normalized === '') {
      throw new ResearchValidationError('sessionId is required');
    }
    const record = await this.repository.findById(normalized);
    if (record === null) {
      throw new ResearchSessionNotFoundError(normalized);
    }
    return record;
  }

  private async requireStartedRuntime(sessionId: string): Promise<RuntimeEntry> {
    const record = await this.requireRecord(sessionId);
    const entry = this.runtimes.get(record.sessionId);
    if (entry === undefined) {
      throw new ResearchValidationError(
        `invalid lifecycle: research session has not been started: ${record.sessionId}`,
      );
    }
    return entry;
  }

  private async persistRunner(
    runner: PaperTradingRunner,
    metadata: Readonly<Record<string, unknown>> | null,
  ): Promise<void> {
    const session = runner.session() as TradingSession;
    await this.repository.save(this.mapper.toRecord(session, metadata));
  }

  private mapRunnerError(_sessionId: string, error: unknown): Error {
    if (error instanceof ActiveRecoveryError) {
      return new ResearchValidationError('active recovery', error);
    }
    if (error instanceof InvalidExecutionModeError) {
      return new ResearchValidationError(`invalid execution mode: ${error.message}`, error);
    }
    if (error instanceof InvalidSessionLifecycleError) {
      return new ResearchValidationError(`invalid lifecycle: ${error.message}`, error);
    }
    if (error instanceof PaperTradingRunnerError) {
      return new ResearchValidationError(error.message, error);
    }
    return this.wrapValidation(error, 'research session operation failed');
  }

  private wrapValidation(error: unknown, fallback: string): ResearchValidationError {
    if (error instanceof ResearchValidationError) {
      return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return new ResearchValidationError(message.trim() === '' ? fallback : message, error);
  }

  private emit(event: ResearchApplicationEvent): void {
    this.applicationEvents.push(Object.freeze(event));
  }
}
