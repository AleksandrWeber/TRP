import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignalResult, type SignalResult, type SignalType } from '../signal-engine';
import type { SignalEngineService } from '../signal-engine/signal-engine.service';
import { Timeframe } from '../market-data-domain';
import { InMemoryStrategyRepository } from '../strategies/repositories/in-memory-strategy.repository';
import { StrategyDomainService } from '../strategies/strategy-domain.service';
import {
  DuplicateScheduleError,
  InvalidScheduleIntervalError,
  ScheduleNotFoundError,
  ScheduleStrategyNotFoundError,
} from './domain/evaluation-scheduler.error';
import { MIN_EVALUATION_INTERVAL_MS } from './domain/evaluation-schedule';
import { EvaluationSchedulerService } from './evaluation-scheduler.service';

const WORKSPACE_ID = 'ws-1';

describe('EvaluationSchedulerService (US015)', () => {
  let strategies: StrategyDomainService;
  let evaluateCalls: Array<{ workspaceId: string; strategyId: string }>;
  let signalType: SignalType;
  let evaluateShouldFail: boolean;
  let evaluationGate: Promise<void> | null;
  let scheduler: EvaluationSchedulerService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T12:00:00.000Z'));
    evaluateCalls = [];
    signalType = 'BUY';
    evaluateShouldFail = false;
    evaluationGate = null;
    strategies = new StrategyDomainService(new InMemoryStrategyRepository());

    const engine = {
      evaluate: async (workspaceId: string, strategyId: string): Promise<SignalResult | null> => {
        evaluateCalls.push({ workspaceId, strategyId });
        await evaluationGate;
        if (evaluateShouldFail) {
          throw new Error('evaluator blew up');
        }
        const strategy = await strategies.getById(workspaceId, strategyId);
        if (!strategy) return null;
        return createSignalResult({
          strategyId,
          symbol: strategy.tradingPair,
          timeframe: Timeframe.H1,
          signal: signalType,
          confidence: 0.5,
          timestamp: new Date().toISOString(),
          metadata: { evaluator: 'test' },
        });
      },
    } as SignalEngineService;

    scheduler = new EvaluationSchedulerService(engine, strategies);
    scheduler.onModuleInit();
  });

  afterEach(() => {
    scheduler.onModuleDestroy();
    vi.useRealTimers();
  });

  async function createStrategy(name = 'Alpha') {
    return strategies.create({
      workspaceId: WORKSPACE_ID,
      name,
      tradingPair: 'BTCUSDT',
      timeframe: '1h',
      direction: 'BOTH',
    });
  }

  it('starts correctly on module init', () => {
    expect(scheduler.isStarted()).toBe(true);
  });

  it('rejects invalid intervals', async () => {
    const strategy = await createStrategy();

    await expect(scheduler.schedule(WORKSPACE_ID, strategy.id, 0)).rejects.toBeInstanceOf(
      InvalidScheduleIntervalError,
    );
    await expect(scheduler.schedule(WORKSPACE_ID, strategy.id, -1)).rejects.toBeInstanceOf(
      InvalidScheduleIntervalError,
    );
    await expect(scheduler.schedule(WORKSPACE_ID, strategy.id, 1.5)).rejects.toBeInstanceOf(
      InvalidScheduleIntervalError,
    );
    await expect(
      scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS - 1),
    ).rejects.toBeInstanceOf(InvalidScheduleIntervalError);
    await expect(scheduler.schedule(WORKSPACE_ID, strategy.id, 86_400_001)).rejects.toBeInstanceOf(
      InvalidScheduleIntervalError,
    );

    expect(scheduler.list(WORKSPACE_ID)).toEqual([]);
  });

  it('rejects scheduling a missing strategy', async () => {
    await expect(
      scheduler.schedule(WORKSPACE_ID, 'missing-strategy', MIN_EVALUATION_INTERVAL_MS),
    ).rejects.toBeInstanceOf(ScheduleStrategyNotFoundError);
  });

  it('rejects duplicate schedules for the same strategy', async () => {
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);

    await expect(
      scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS * 2),
    ).rejects.toBeInstanceOf(DuplicateScheduleError);
  });

  it('executes a strategy on its schedule', async () => {
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);

    expect(evaluateCalls).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    expect(evaluateCalls).toEqual([{ workspaceId: WORKSPACE_ID, strategyId: strategy.id }]);
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastSignal).toBe('BUY');
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastEvaluatedAt).toBe(
      '2026-07-19T12:00:01.000Z',
    );
  });

  it('runs multiple strategies independently on different intervals', async () => {
    const fast = await createStrategy('Fast');
    const slow = await createStrategy('Slow');

    await scheduler.schedule(WORKSPACE_ID, fast.id, MIN_EVALUATION_INTERVAL_MS);
    await scheduler.schedule(WORKSPACE_ID, slow.id, MIN_EVALUATION_INTERVAL_MS * 2);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    expect(evaluateCalls.map((c) => c.strategyId)).toEqual([fast.id]);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    expect(evaluateCalls.map((c) => c.strategyId)).toEqual([fast.id, fast.id, slow.id]);
  });

  it('prevents overlapping evaluations for the same schedule', async () => {
    let releaseEvaluation!: () => void;
    evaluationGate = new Promise<void>((resolve) => {
      releaseEvaluation = resolve;
    });
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    expect(evaluateCalls).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS * 2);
    expect(evaluateCalls).toHaveLength(1);

    evaluationGate = null;
    releaseEvaluation();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    expect(evaluateCalls).toHaveLength(2);
  });

  it('handles HOLD results without throwing or executing trades', async () => {
    signalType = 'HOLD';
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);

    const result = await scheduler.runOnce(WORKSPACE_ID, strategy.id);

    expect(result?.signal).toBe('HOLD');
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastSignal).toBe('HOLD');
  });

  it('survives evaluation failures and continues scheduling', async () => {
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);

    evaluateShouldFail = true;
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    expect(evaluateCalls).toHaveLength(1);
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastSignal).toBeNull();

    evaluateShouldFail = false;
    signalType = 'SELL';
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    expect(evaluateCalls).toHaveLength(2);
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastSignal).toBe('SELL');
  });

  it('unschedules a strategy and stops further evaluations', async () => {
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    scheduler.unschedule(WORKSPACE_ID, strategy.id);

    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS * 3);
    expect(evaluateCalls).toHaveLength(0);
    expect(scheduler.list(WORKSPACE_ID)).toEqual([]);
  });

  it('throws when unscheduling an unknown schedule', async () => {
    expect(() => scheduler.unschedule(WORKSPACE_ID, 'missing')).toThrow(ScheduleNotFoundError);
  });

  it('stops all timers on module destroy', async () => {
    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    scheduler.onModuleDestroy();

    expect(scheduler.isStarted()).toBe(false);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS * 3);
    expect(evaluateCalls).toHaveLength(0);
  });

  it('publishes results to registered listeners on scheduled ticks (US016)', async () => {
    const events: Array<{ workspaceId: string; strategyId: string; signal: string }> = [];
    scheduler.onResult((event) => {
      events.push({
        workspaceId: event.workspaceId,
        strategyId: event.strategyId,
        signal: event.result.signal,
      });
    });

    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    expect(events).toEqual([{ workspaceId: WORKSPACE_ID, strategyId: strategy.id, signal: 'BUY' }]);
  });

  it('keeps scheduling when a listener throws (US016)', async () => {
    const received: string[] = [];
    scheduler.onResult(() => {
      throw new Error('listener blew up');
    });
    scheduler.onResult((event) => {
      received.push(event.result.signal);
    });

    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS * 2);

    expect(evaluateCalls).toHaveLength(2);
    expect(received).toEqual(['BUY', 'BUY']);
    expect(scheduler.get(WORKSPACE_ID, strategy.id)?.lastSignal).toBe('BUY');
  });

  it('stops notifying after unsubscribe (US016)', async () => {
    const received: string[] = [];
    const unsubscribe = scheduler.onResult((event) => {
      received.push(event.result.signal);
    });

    const strategy = await createStrategy();
    await scheduler.schedule(WORKSPACE_ID, strategy.id, MIN_EVALUATION_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);
    unsubscribe();
    await vi.advanceTimersByTimeAsync(MIN_EVALUATION_INTERVAL_MS);

    expect(evaluateCalls).toHaveLength(2);
    expect(received).toEqual(['BUY']);
  });
});
