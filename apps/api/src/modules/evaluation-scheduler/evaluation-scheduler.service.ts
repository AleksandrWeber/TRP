import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { SignalResult, SignalType } from '../signal-engine';
import { SignalEngineService } from '../signal-engine';
import { StrategyDomainService } from '../strategies';
import {
  freezeEvaluationResultEvent,
  type EvaluationResultListener,
} from './domain/evaluation-result-listener';
import {
  freezeSchedule,
  MAX_EVALUATION_INTERVAL_MS,
  MIN_EVALUATION_INTERVAL_MS,
  scheduleKey,
  type EvaluationSchedule,
} from './domain/evaluation-schedule';
import {
  DuplicateScheduleError,
  InvalidScheduleError,
  InvalidScheduleIntervalError,
  ScheduleNotFoundError,
  ScheduleStrategyNotFoundError,
} from './domain/evaluation-scheduler.error';

type ActiveSchedule = {
  schedule: EvaluationSchedule;
  timer: NodeJS.Timeout;
  /** Prevents overlapping evaluations for the same schedule. */
  running: boolean;
};

/**
 * Evaluation Scheduler (US015, result publication added in US016).
 *
 * Registers per-strategy intervals and periodically invokes
 * SignalEngineService.evaluate. Results (BUY / SELL / HOLD) are recorded on
 * the schedule and published to registered in-process listeners (US016 —
 * Paper Trading Executor). The scheduler itself still executes nothing:
 * no orders, risk, or notifications.
 */
@Injectable()
export class EvaluationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationSchedulerService.name);
  private readonly active = new Map<string, ActiveSchedule>();
  private readonly listeners = new Set<EvaluationResultListener>();
  private started = false;

  constructor(
    @Inject(SignalEngineService) private readonly engine: SignalEngineService,
    @Inject(StrategyDomainService) private readonly strategies: StrategyDomainService,
  ) {}

  onModuleInit(): void {
    this.started = true;
    this.logger.log('Evaluation scheduler started');
  }

  onModuleDestroy(): void {
    for (const entry of this.active.values()) {
      clearInterval(entry.timer);
    }
    this.active.clear();
    this.listeners.clear();
    this.started = false;
    this.logger.log('Evaluation scheduler stopped');
  }

  /**
   * Subscribe to every successful scheduled/manual evaluation result (US016).
   * Returns an unsubscribe function. Listener failures are logged and never
   * break scheduling, other listeners, or the caller of runOnce.
   */
  onResult(listener: EvaluationResultListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** True after Nest module init and before destroy. */
  isStarted(): boolean {
    return this.started;
  }

  /**
   * Register a periodic evaluation for one workspace-scoped strategy.
   * The first evaluation fires after `intervalMs` (not immediately).
   */
  async schedule(
    workspaceId: string,
    strategyId: string,
    intervalMs: number,
  ): Promise<EvaluationSchedule> {
    assertValidInterval(intervalMs);
    assertNonEmpty(workspaceId, 'workspaceId');
    assertNonEmpty(strategyId, 'strategyId');

    const strategy = await this.strategies.getById(workspaceId, strategyId);
    if (!strategy) {
      throw new ScheduleStrategyNotFoundError(workspaceId, strategyId);
    }

    const key = scheduleKey(workspaceId, strategyId);
    if (this.active.has(key)) {
      throw new DuplicateScheduleError(workspaceId, strategyId);
    }

    const schedule = freezeSchedule({
      workspaceId,
      strategyId,
      intervalMs,
      createdAt: new Date().toISOString(),
      lastEvaluatedAt: null,
      lastSignal: null,
    });

    const timer = setInterval(() => {
      void this.trigger(key);
    }, intervalMs);
    timer.unref();

    this.active.set(key, { schedule, timer, running: false });
    this.logger.log(
      `Scheduled evaluation for strategy ${strategyId} every ${intervalMs}ms (workspace ${workspaceId})`,
    );
    return schedule;
  }

  /** Remove a schedule and clear its timer. */
  unschedule(workspaceId: string, strategyId: string): EvaluationSchedule {
    const key = scheduleKey(workspaceId, strategyId);
    const entry = this.active.get(key);
    if (!entry) {
      throw new ScheduleNotFoundError(workspaceId, strategyId);
    }

    clearInterval(entry.timer);
    this.active.delete(key);
    this.logger.log(`Unscheduled evaluation for strategy ${strategyId} (workspace ${workspaceId})`);
    return freezeSchedule(entry.schedule);
  }

  list(workspaceId: string): ReadonlyArray<EvaluationSchedule> {
    return [...this.active.values()]
      .map((entry) => entry.schedule)
      .filter((schedule) => schedule.workspaceId === workspaceId)
      .map(freezeSchedule);
  }

  get(workspaceId: string, strategyId: string): EvaluationSchedule | null {
    const entry = this.active.get(scheduleKey(workspaceId, strategyId));
    return entry ? freezeSchedule(entry.schedule) : null;
  }

  /**
   * Deterministic single-cycle trigger for tests and manual inspection.
   * Returns the SignalResult (including HOLD) or null when the strategy is gone.
   * Evaluation failures are logged and rethrown so callers can assert them;
   * the background timer path swallows failures via {@link trigger}.
   */
  async runOnce(workspaceId: string, strategyId: string): Promise<SignalResult | null> {
    const key = scheduleKey(workspaceId, strategyId);
    const entry = this.active.get(key);
    if (!entry) {
      throw new ScheduleNotFoundError(workspaceId, strategyId);
    }
    return this.evaluateScheduled(entry);
  }

  /** Background tick — failures must not kill the scheduler or other schedules. */
  private async trigger(key: string): Promise<void> {
    const entry = this.active.get(key);
    if (!entry || entry.running) return;

    entry.running = true;
    try {
      await this.evaluateScheduled(entry);
    } catch (error) {
      this.logger.error(
        `Scheduled evaluation failed for ${key}; scheduler continues`,
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      entry.running = false;
    }
  }

  private async evaluateScheduled(entry: ActiveSchedule): Promise<SignalResult | null> {
    const { workspaceId, strategyId } = entry.schedule;
    const result = await this.engine.evaluate(workspaceId, strategyId);

    if (!result) {
      this.logger.warn(
        `Strategy ${strategyId} missing during scheduled evaluation (workspace ${workspaceId}); skipping`,
      );
      return null;
    }

    // BUY / SELL / HOLD are all valid outcomes — the scheduler records them
    // and publishes to listeners (US016); it never executes anything itself.
    const lastSignal: SignalType = result.signal;
    entry.schedule = freezeSchedule({
      ...entry.schedule,
      lastEvaluatedAt: result.timestamp,
      lastSignal,
    });

    this.logger.debug(
      `Scheduled evaluation ${strategyId}: ${result.signal} (confidence ${result.confidence})`,
    );
    await this.publish(workspaceId, strategyId, result);
    return result;
  }

  /** Notify listeners; a failing listener never affects scheduling or peers. */
  private async publish(
    workspaceId: string,
    strategyId: string,
    result: SignalResult,
  ): Promise<void> {
    if (this.listeners.size === 0) return;

    const event = freezeEvaluationResultEvent({ workspaceId, strategyId, result });
    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (error) {
        this.logger.error(
          `Evaluation result listener failed for strategy ${strategyId} (workspace ${workspaceId}); scheduler continues`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}

function assertValidInterval(intervalMs: number): void {
  if (
    !Number.isInteger(intervalMs) ||
    intervalMs < MIN_EVALUATION_INTERVAL_MS ||
    intervalMs > MAX_EVALUATION_INTERVAL_MS
  ) {
    throw new InvalidScheduleIntervalError(intervalMs);
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new InvalidScheduleError(`${field} must not be empty`);
  }
}
