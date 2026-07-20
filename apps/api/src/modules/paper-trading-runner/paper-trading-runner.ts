import { randomUUID } from 'node:crypto';
import { ExecutionMode, SessionState, TradingSession } from '../trading-session/domain';
import {
  ActiveRecoveryError,
  DuplicateRunnerStartError,
  DuplicateRunnerStopError,
  ExpiredRuntimeHeartbeatError,
  InactiveRuntimeLeaseError,
  InvalidExecutionModeError,
  InvalidRunnerStatusError,
  InvalidSessionLifecycleError,
  MissingPaperStrategyError,
  MissingRunnerFailureReasonError,
  MissingTradingSessionError,
} from './paper-trading-runner-errors';
import type { PaperRunnerDomainEvent } from './paper-trading-runner-events';
import { createPaperExecutionContext, type PaperExecutionContext } from './paper-execution-context';
import type { PaperStrategy } from './paper-strategy';
import { RunnerStatus } from './runner-status';

export type PaperTradingRunnerDependencies = Readonly<{
  session: TradingSession | null;
  strategy: PaperStrategy;
  runtimeId?: string;
  clock?: () => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

/**
 * US189 Paper Trading Runner.
 *
 * Application service orchestrating a TradingSession in PAPER execution
 * mode: startup validation, runtime lease acquisition, lifecycle
 * transitions, heartbeat supervision, cycle execution, graceful stop, and
 * recovery invocation.
 *
 * The Runner contains no trading logic: no indicators, strategy
 * evaluation, fills, PnL, positions, or exchange communication.
 */
export class PaperTradingRunner {
  readonly runtimeId: string;
  private readonly strategy: PaperStrategy;
  private readonly clock: () => string;
  private readonly leaseDurationMs: number | undefined;
  private readonly heartbeatTimeoutMs: number | undefined;
  private currentSession: TradingSession | null;
  private runnerStatus: RunnerStatus;
  private cycles: number;
  private lastContext: PaperExecutionContext | null;
  private startedAtValue: string | null;
  private stoppedAtValue: string | null;
  private failedAtValue: string | null;
  private failureReasonValue: string | null;
  private readonly runnerEvents: PaperRunnerDomainEvent[];

  private constructor(dependencies: PaperTradingRunnerDependencies) {
    if (dependencies.strategy === null || dependencies.strategy === undefined) {
      throw new MissingPaperStrategyError();
    }
    if (dependencies.runtimeId !== undefined && dependencies.runtimeId.trim() === '') {
      throw new Error('runtimeId is required');
    }

    this.runtimeId = dependencies.runtimeId?.trim() ?? randomUUID();
    this.strategy = dependencies.strategy;
    this.clock = dependencies.clock ?? (() => new Date().toISOString());
    this.leaseDurationMs = dependencies.leaseDurationMs;
    this.heartbeatTimeoutMs = dependencies.heartbeatTimeoutMs;
    this.currentSession = dependencies.session;
    this.runnerStatus = RunnerStatus.CREATED;
    this.cycles = 0;
    this.lastContext = null;
    this.startedAtValue = null;
    this.stoppedAtValue = null;
    this.failedAtValue = null;
    this.failureReasonValue = null;
    this.runnerEvents = [];
  }

  static create(dependencies: PaperTradingRunnerDependencies): PaperTradingRunner {
    return new PaperTradingRunner(dependencies);
  }

  /**
   * Starts the runner. Validates execution prerequisites, acquires the
   * runtime lease when the session is freshly CREATED (or attaches to an
   * already RUNNING session whose lease this runtime owns), transitions
   * the session lifecycle, and initializes the strategy pipeline.
   *
   * Precondition failures reject without changing runner state, so start
   * never creates a duplicate running instance. Failures while starting
   * up transition the runner to FAILED.
   */
  async start(now = this.clock()): Promise<void> {
    if (this.runnerStatus === RunnerStatus.STARTING || this.runnerStatus === RunnerStatus.RUNNING) {
      throw new DuplicateRunnerStartError();
    }
    if (this.runnerStatus !== RunnerStatus.CREATED) {
      throw new InvalidRunnerStatusError('started', this.runnerStatus);
    }

    const session = this.assertStartable(now);
    this.runnerStatus = RunnerStatus.STARTING;
    try {
      this.currentSession = this.prepareSession(session, now);
      const context = this.buildContext(now);
      this.lastContext = context;
      await this.strategy.initialize(context);
      this.startedAtValue = now;
      this.runnerStatus = RunnerStatus.RUNNING;
      this.emit({
        eventType: 'PaperRunnerStarted',
        sessionId: this.currentSession.sessionId,
        runtimeId: this.runtimeId,
        occurredAt: now,
        startedAt: now,
        runnerStatus: RunnerStatus.RUNNING,
      });
    } catch (error) {
      this.markFailed(failureReasonFrom(error), now);
      throw error;
    }
  }

  /**
   * Executes a single orchestration cycle: validate session, lease, and
   * heartbeat, invoke the strategy pipeline (stub), and publish the
   * execution event. Performs no market simulation.
   */
  async runCycle(now = this.clock()): Promise<PaperExecutionContext> {
    if (this.runnerStatus !== RunnerStatus.RUNNING) {
      throw new InvalidRunnerStatusError('cycled', this.runnerStatus);
    }

    const session = this.requireSession();
    if (session.leaseOwner(now) !== this.runtimeId) {
      throw new InactiveRuntimeLeaseError();
    }
    if (session.isHeartbeatExpired(now)) {
      throw new ExpiredRuntimeHeartbeatError();
    }
    if (Date.parse(now) > Date.parse(session.lastHeartbeat() as string)) {
      this.currentSession = session.heartbeat(this.runtimeId, now);
    }

    this.cycles += 1;
    const context = this.buildContext(this.startedAtValue as string);
    this.lastContext = context;
    await this.strategy.execute(context);
    this.emit({
      eventType: 'PaperRunnerCycleExecuted',
      sessionId: session.sessionId,
      runtimeId: this.runtimeId,
      occurredAt: now,
      cycleNumber: this.cycles,
      context,
    });
    return context;
  }

  /**
   * Stops the runner gracefully: shuts the strategy pipeline down,
   * releases the runtime lease when still owned, and drives the session
   * lifecycle to STOPPED. Repeated stop never changes the final state.
   */
  async stop(now = this.clock()): Promise<void> {
    if (this.runnerStatus === RunnerStatus.STOPPING || this.runnerStatus === RunnerStatus.STOPPED) {
      throw new DuplicateRunnerStopError();
    }
    if (this.runnerStatus !== RunnerStatus.RUNNING) {
      throw new InvalidRunnerStatusError('stopped', this.runnerStatus);
    }

    this.runnerStatus = RunnerStatus.STOPPING;
    try {
      const session = this.requireSession();
      await this.strategy.shutdown(this.lastContext as PaperExecutionContext);

      let next = session.stop(now);
      if (next.canRelease(this.runtimeId, now)) {
        next = next.releaseLease(this.runtimeId, now);
      }
      next = next.transitionTo(SessionState.STOPPED, now);

      this.currentSession = next;
      this.stoppedAtValue = now;
      this.runnerStatus = RunnerStatus.STOPPED;
      this.emit({
        eventType: 'PaperRunnerStopped',
        sessionId: next.sessionId,
        runtimeId: this.runtimeId,
        occurredAt: now,
        stoppedAt: now,
        runnerStatus: RunnerStatus.STOPPED,
      });
    } catch (error) {
      this.markFailed(failureReasonFrom(error), now);
      throw error;
    }
  }

  /** Marks the runner FAILED and fails the session when its lifecycle allows. */
  fail(reason: string, now = this.clock()): void {
    if (this.runnerStatus === RunnerStatus.STOPPED || this.runnerStatus === RunnerStatus.FAILED) {
      throw new InvalidRunnerStatusError('failed', this.runnerStatus);
    }
    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
    if (normalizedReason === '') {
      throw new MissingRunnerFailureReasonError();
    }
    this.markFailed(normalizedReason, now);
  }

  /**
   * Invokes session recovery when required. Completes an in-flight
   * recovery, or begins and completes a newly eligible one. Idempotent:
   * returns false without side effects when recovery is not required.
   */
  recover(now = this.clock()): boolean {
    const session = this.requireSession();
    if (session.isRecovering()) {
      this.currentSession = session.completeRecovery(now);
      return true;
    }
    if (session.canRecover(now)) {
      this.currentSession = session.beginRecovery(now).completeRecovery(now);
      return true;
    }
    return false;
  }

  status(): RunnerStatus {
    return this.runnerStatus;
  }

  isRunning(): boolean {
    return this.runnerStatus === RunnerStatus.RUNNING;
  }

  isStopped(): boolean {
    return this.runnerStatus === RunnerStatus.STOPPED;
  }

  session(): TradingSession | null {
    return this.currentSession;
  }

  executionContext(): PaperExecutionContext | null {
    return this.lastContext;
  }

  cycleNumber(): number {
    return this.cycles;
  }

  startedAt(): string | null {
    return this.startedAtValue;
  }

  stoppedAt(): string | null {
    return this.stoppedAtValue;
  }

  failedAt(): string | null {
    return this.failedAtValue;
  }

  failureReason(): string | null {
    return this.failureReasonValue;
  }

  domainEvents(): readonly PaperRunnerDomainEvent[] {
    return Object.freeze([...this.runnerEvents]);
  }

  private assertStartable(now: string): TradingSession {
    const session = this.requireSession();
    if (session.executionMode !== ExecutionMode.PAPER) {
      throw new InvalidExecutionModeError(session.executionMode);
    }
    if (session.isRecovering()) {
      throw new ActiveRecoveryError();
    }

    const state = session.currentState();
    if (state === SessionState.CREATED) {
      if (session.hasLease(now)) {
        throw new InactiveRuntimeLeaseError();
      }
      return session;
    }
    if (state !== SessionState.RUNNING) {
      throw new InvalidSessionLifecycleError(state);
    }
    if (session.leaseOwner(now) !== this.runtimeId) {
      throw new InactiveRuntimeLeaseError();
    }
    if (session.isHeartbeatExpired(now)) {
      throw new ExpiredRuntimeHeartbeatError();
    }
    return session;
  }

  private prepareSession(session: TradingSession, now: string): TradingSession {
    if (session.currentState() !== SessionState.CREATED) {
      return session;
    }
    return session
      .acquireLease(this.runtimeId, {
        acquiredAt: now,
        expiresAt:
          this.leaseDurationMs === undefined
            ? undefined
            : new Date(Date.parse(now) + this.leaseDurationMs).toISOString(),
        heartbeatTimeoutMs: this.heartbeatTimeoutMs,
      })
      .start(now)
      .transitionTo(SessionState.RUNNING, now);
  }

  private buildContext(startedAt: string): PaperExecutionContext {
    const session = this.requireSession();
    return createPaperExecutionContext({
      sessionId: session.sessionId,
      executionMode: session.executionMode,
      startedAt,
      cycleNumber: this.cycles,
      runtimeId: this.runtimeId,
    });
  }

  private markFailed(reason: string, occurredAt: string): void {
    if (this.currentSession !== null && this.currentSession.canTransitionTo(SessionState.FAILED)) {
      this.currentSession = this.currentSession.fail(reason, occurredAt);
    }
    this.failureReasonValue = reason;
    this.failedAtValue = occurredAt;
    this.runnerStatus = RunnerStatus.FAILED;
    this.emit({
      eventType: 'PaperRunnerFailed',
      sessionId: this.currentSession?.sessionId ?? null,
      runtimeId: this.runtimeId,
      occurredAt,
      failedAt: occurredAt,
      reason,
      runnerStatus: RunnerStatus.FAILED,
    });
  }

  private requireSession(): TradingSession {
    if (this.currentSession === null) {
      throw new MissingTradingSessionError();
    }
    return this.currentSession;
  }

  private emit(event: PaperRunnerDomainEvent): void {
    this.runnerEvents.push(Object.freeze(event));
  }
}

function failureReasonFrom(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() === '' ? 'PaperTradingRunner operation failed' : message;
}
