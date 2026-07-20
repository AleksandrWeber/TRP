import { Timeframe } from '../market-data/timeframe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ExecutionMode,
  RecoveryStatus,
  SessionState,
  TradingSession,
  type CreateTradingSessionProperties,
} from '../trading-session/domain';
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
import { createPaperExecutionContext, type PaperExecutionContext } from './paper-execution-context';
import type { PaperStrategy } from './paper-strategy';
import { PaperTradingRunner, type PaperTradingRunnerDependencies } from './paper-trading-runner';
import { RunnerStatus, isRunnerStatus } from './runner-status';

const RUNTIME_ID = 'runtime-189';
const CREATED_AT = '2026-07-19T18:00:00.000Z';
const ACQUIRED_AT = '2026-07-19T18:00:30.000Z';
const STARTING_AT = '2026-07-19T18:00:40.000Z';
const RUNNING_AT = '2026-07-19T18:00:50.000Z';
const START_AT = '2026-07-19T18:01:00.000Z';
const CYCLE_AT = '2026-07-19T18:01:05.000Z';
const HEARTBEAT_EXPIRED_CYCLE_AT = '2026-07-19T18:01:06.000Z';
const CYCLE_2_AT = '2026-07-19T18:01:10.000Z';
const STOP_AT = '2026-07-19T18:01:15.000Z';
const LEASE_EXPIRED_AT = '2026-07-19T18:01:30.000Z';
const FAR_EXPIRES_AT = '2026-07-19T18:05:00.000Z';

function sessionProperties(
  overrides: Partial<CreateTradingSessionProperties> = {},
): CreateTradingSessionProperties {
  return {
    sessionId: 'session-189',
    workspaceId: 'workspace-1',
    deploymentId: 'deployment-1',
    strategyId: 'strategy-1',
    executionMode: ExecutionMode.PAPER,
    marketType: 'CRYPTOCURRENCY',
    exchange: 'BINANCE',
    symbol: 'BTCUSDT',
    timeframe: Timeframe.M5,
    createdAt: CREATED_AT,
    metadataVersion: 1,
    ...overrides,
  };
}

function createdSession(overrides: Partial<CreateTradingSessionProperties> = {}): TradingSession {
  return TradingSession.create(sessionProperties(overrides));
}

function runningSession(
  ownerId = RUNTIME_ID,
  options: Readonly<{ expiresAt?: string; heartbeatTimeoutMs?: number }> = {},
): TradingSession {
  return createdSession()
    .acquireLease(ownerId, {
      acquiredAt: ACQUIRED_AT,
      expiresAt: options.expiresAt ?? FAR_EXPIRES_AT,
      heartbeatTimeoutMs: options.heartbeatTimeoutMs ?? 300_000,
    })
    .start(STARTING_AT)
    .transitionTo(SessionState.RUNNING, RUNNING_AT);
}

class RecordingStrategy implements PaperStrategy {
  readonly initializeCalls: PaperExecutionContext[] = [];
  readonly executeCalls: PaperExecutionContext[] = [];
  readonly shutdownCalls: PaperExecutionContext[] = [];
  onInitialize: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;
  onExecute: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;
  onShutdown: ((context: PaperExecutionContext) => Promise<void> | void) | null = null;

  async initialize(context: PaperExecutionContext): Promise<void> {
    this.initializeCalls.push(context);
    await this.onInitialize?.(context);
  }

  async execute(context: PaperExecutionContext): Promise<void> {
    this.executeCalls.push(context);
    await this.onExecute?.(context);
  }

  async shutdown(context: PaperExecutionContext): Promise<void> {
    this.shutdownCalls.push(context);
    await this.onShutdown?.(context);
  }
}

function createRunner(overrides: Partial<PaperTradingRunnerDependencies> = {}): {
  runner: PaperTradingRunner;
  strategy: RecordingStrategy;
} {
  const strategy = new RecordingStrategy();
  const runner = PaperTradingRunner.create({
    session: createdSession(),
    strategy,
    runtimeId: RUNTIME_ID,
    ...overrides,
  });
  return { runner, strategy: (overrides.strategy as RecordingStrategy) ?? strategy };
}

async function startedRunner(
  overrides: Partial<PaperTradingRunnerDependencies> = {},
): Promise<{ runner: PaperTradingRunner; strategy: RecordingStrategy }> {
  const created = createRunner(overrides);
  await created.runner.start(START_AT);
  return created;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US189 PaperTradingRunner creation', () => {
  it('creates a runner in CREATED status with no execution state', () => {
    const session = createdSession();
    const { runner } = createRunner({ session });

    expect(runner.status()).toBe(RunnerStatus.CREATED);
    expect(runner.isRunning()).toBe(false);
    expect(runner.isStopped()).toBe(false);
    expect(runner.runtimeId).toBe(RUNTIME_ID);
    expect(runner.session()).toBe(session);
    expect(runner.executionContext()).toBeNull();
    expect(runner.cycleNumber()).toBe(0);
    expect(runner.startedAt()).toBeNull();
    expect(runner.stoppedAt()).toBeNull();
    expect(runner.failedAt()).toBeNull();
    expect(runner.failureReason()).toBeNull();
    expect(runner.domainEvents()).toEqual([]);
    expect(Object.isFrozen(runner.domainEvents())).toBe(true);
  });

  it('generates a runtime identity when none is provided', () => {
    const { runner } = createRunner({ runtimeId: undefined });

    expect(runner.runtimeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('rejects a null or undefined strategy', () => {
    expect(() => createRunner({ strategy: null as unknown as PaperStrategy })).toThrow(
      MissingPaperStrategyError,
    );
    expect(() => createRunner({ strategy: undefined as unknown as PaperStrategy })).toThrow(
      MissingPaperStrategyError,
    );
  });

  it('rejects a blank runtime identity', () => {
    expect(() => createRunner({ runtimeId: '   ' })).toThrow(/runtimeId is required/);
  });
});

describe('US189 PaperExecutionContext', () => {
  it('creates an immutable execution context without market state', () => {
    const context = createPaperExecutionContext({
      sessionId: ' session-189 ',
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 0,
      runtimeId: RUNTIME_ID,
    });

    expect(context).toEqual({
      sessionId: 'session-189',
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 0,
      runtimeId: RUNTIME_ID,
    });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it.each([
    [{ sessionId: '' }, /sessionId is required/],
    [{ sessionId: 42 as unknown as string }, /sessionId is required/],
    [{ runtimeId: ' ' }, /runtimeId is required/],
    [{ executionMode: 'INVALID' as ExecutionMode }, /Invalid executionMode/],
    [{ startedAt: 'not-a-timestamp' }, /startedAt must be an ISO-8601 UTC timestamp/],
    [{ cycleNumber: -1 }, /cycleNumber must be a non-negative integer/],
    [{ cycleNumber: 1.5 }, /cycleNumber must be a non-negative integer/],
  ])('rejects invalid context properties %j', (overrides, expected) => {
    expect(() =>
      createPaperExecutionContext({
        sessionId: 'session-189',
        executionMode: ExecutionMode.PAPER,
        startedAt: START_AT,
        cycleNumber: 0,
        runtimeId: RUNTIME_ID,
        ...overrides,
      }),
    ).toThrow(expected);
  });
});

describe('US189 PaperTradingRunner start', () => {
  it('starts a CREATED session: acquires the lease, transitions the lifecycle, and initializes the strategy', async () => {
    const { runner, strategy } = createRunner();

    await runner.start(START_AT);

    expect(runner.status()).toBe(RunnerStatus.RUNNING);
    expect(runner.isRunning()).toBe(true);
    expect(runner.startedAt()).toBe(START_AT);

    const session = runner.session() as TradingSession;
    expect(session.currentState()).toBe(SessionState.RUNNING);
    expect(session.hasLease(START_AT)).toBe(true);
    expect(session.leaseOwner(START_AT)).toBe(RUNTIME_ID);
    expect(Object.isFrozen(session)).toBe(true);

    expect(strategy.initializeCalls).toHaveLength(1);
    expect(strategy.initializeCalls[0]).toEqual({
      sessionId: 'session-189',
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 0,
      runtimeId: RUNTIME_ID,
    });
    expect(runner.executionContext()).toBe(strategy.initializeCalls[0]);
    expect(Object.isFrozen(strategy.initializeCalls[0])).toBe(true);

    expect(runner.domainEvents()).toHaveLength(1);
    const event = runner.domainEvents()[0];
    expect(event).toEqual({
      eventType: 'PaperRunnerStarted',
      sessionId: 'session-189',
      runtimeId: RUNTIME_ID,
      occurredAt: START_AT,
      startedAt: START_AT,
      runnerStatus: RunnerStatus.RUNNING,
    });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it('applies configured lease duration and heartbeat timeout when acquiring the lease', async () => {
    const { runner } = await startedRunner({
      leaseDurationMs: 120_000,
      heartbeatTimeoutMs: 45_000,
    });

    const lease = (runner.session() as TradingSession).toProperties().runtimeLease;
    expect(lease?.expiresAt).toBe('2026-07-19T18:03:00.000Z');
    expect(lease?.heartbeatTimeoutMs).toBe(45_000);
  });

  it('operates with the default clock and runtime identity', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START_AT));
    const strategy = new RecordingStrategy();
    const runner = PaperTradingRunner.create({ session: createdSession(), strategy });

    await runner.start();
    expect(runner.isRunning()).toBe(true);
    expect(runner.startedAt()).toBe(START_AT);
    expect((runner.session() as TradingSession).leaseOwner(START_AT)).toBe(runner.runtimeId);
    expect(runner.recover()).toBe(false);

    vi.setSystemTime(new Date(CYCLE_AT));
    const context = await runner.runCycle();
    expect(context.cycleNumber).toBe(1);

    vi.setSystemTime(new Date(STOP_AT));
    await runner.stop();
    expect(runner.stoppedAt()).toBe(STOP_AT);
  });

  it('attaches to a RUNNING session whose active lease this runtime owns without reacquiring it', async () => {
    const session = runningSession();
    const { runner, strategy } = createRunner({ session });

    await runner.start(START_AT);

    expect(runner.status()).toBe(RunnerStatus.RUNNING);
    const properties = (runner.session() as TradingSession).toProperties();
    expect(properties.lastLeaseVersion).toBe(1);
    expect(properties.runtimeLease?.acquiredAt).toBe(ACQUIRED_AT);
    expect(strategy.initializeCalls).toHaveLength(1);
  });

  it('rejects startup when the TradingSession is missing', async () => {
    const { runner } = createRunner({ session: null });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(MissingTradingSessionError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
    expect(runner.domainEvents()).toEqual([]);
  });

  it('rejects startup for non-PAPER execution modes', async () => {
    const { runner } = createRunner({
      session: createdSession({ executionMode: ExecutionMode.LIVE }),
    });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(InvalidExecutionModeError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
  });

  it('rejects startup while session recovery is active', async () => {
    const session = runningSession(RUNTIME_ID, { heartbeatTimeoutMs: 10_000 }).beginRecovery(
      START_AT,
    );
    const { runner } = createRunner({ session });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(ActiveRecoveryError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
  });

  it.each([
    ['STARTING', () => createdSession().start(STARTING_AT)],
    [
      'PAUSED',
      () =>
        runningSession()
          .pause('2026-07-19T18:00:52.000Z')
          .transitionTo(SessionState.PAUSED, '2026-07-19T18:00:54.000Z'),
    ],
  ])('rejects startup when the session lifecycle is %s', async (_state, buildSession) => {
    const { runner } = createRunner({ session: buildSession() });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(InvalidSessionLifecycleError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
  });

  it('rejects startup when a CREATED session already carries an active foreign lease', async () => {
    const session = createdSession().acquireLease('other-runtime', {
      acquiredAt: ACQUIRED_AT,
      expiresAt: FAR_EXPIRES_AT,
    });
    const { runner } = createRunner({ session });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(InactiveRuntimeLeaseError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
  });

  it('rejects startup when a RUNNING session lease is expired', async () => {
    const session = runningSession(RUNTIME_ID, {
      expiresAt: '2026-07-19T18:00:55.000Z',
    });
    const { runner } = createRunner({ session });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(InactiveRuntimeLeaseError);
  });

  it('rejects startup when a RUNNING session lease belongs to another runtime', async () => {
    const { runner } = createRunner({ session: runningSession('other-runtime') });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(InactiveRuntimeLeaseError);
  });

  it('rejects startup when the runtime heartbeat has expired', async () => {
    const session = runningSession(RUNTIME_ID, { heartbeatTimeoutMs: 10_000 });
    const { runner } = createRunner({ session });

    await expect(runner.start(START_AT)).rejects.toBeInstanceOf(ExpiredRuntimeHeartbeatError);
    expect(runner.status()).toBe(RunnerStatus.CREATED);
  });

  it('fails the runner and the session when strategy initialization throws', async () => {
    const { runner, strategy } = createRunner();
    strategy.onInitialize = () => {
      throw new Error('initialize exploded');
    };

    await expect(runner.start(START_AT)).rejects.toThrow('initialize exploded');
    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect(runner.failureReason()).toBe('initialize exploded');
    expect(runner.failedAt()).toBe(START_AT);

    const session = runner.session() as TradingSession;
    expect(session.isFailed()).toBe(true);
    expect(session.failureReason).toBe('initialize exploded');

    expect(runner.domainEvents().at(-1)).toMatchObject({
      eventType: 'PaperRunnerFailed',
      sessionId: 'session-189',
      reason: 'initialize exploded',
      runnerStatus: RunnerStatus.FAILED,
    });
  });

  it('normalizes non-Error and empty startup failures into readable reasons', async () => {
    const first = createRunner();
    first.strategy.onInitialize = () => {
      throw 'boom';
    };
    await expect(first.runner.start(START_AT)).rejects.toBe('boom');
    expect(first.runner.failureReason()).toBe('boom');

    const second = createRunner();
    second.strategy.onInitialize = () => {
      throw new Error('');
    };
    await expect(second.runner.start(START_AT)).rejects.toBeInstanceOf(Error);
    expect(second.runner.failureReason()).toBe('PaperTradingRunner operation failed');
  });

  it('rejects duplicate start without creating a second running instance', async () => {
    const { runner, strategy } = await startedRunner();

    await expect(runner.start(CYCLE_AT)).rejects.toBeInstanceOf(DuplicateRunnerStartError);
    expect(runner.status()).toBe(RunnerStatus.RUNNING);
    expect(strategy.initializeCalls).toHaveLength(1);
    expect(runner.domainEvents()).toHaveLength(1);
  });

  it('rejects reentrant start while STARTING', async () => {
    const { runner, strategy } = createRunner();
    let observedStatus: RunnerStatus | null = null;
    let reentrantError: unknown = null;
    strategy.onInitialize = async () => {
      observedStatus = runner.status();
      reentrantError = await runner.start(CYCLE_AT).catch((error: unknown) => error);
    };

    await runner.start(START_AT);

    expect(observedStatus).toBe(RunnerStatus.STARTING);
    expect(reentrantError).toBeInstanceOf(DuplicateRunnerStartError);
    expect(runner.status()).toBe(RunnerStatus.RUNNING);
  });

  it('rejects starting a STOPPED or FAILED runner', async () => {
    const stopped = await startedRunner();
    await stopped.runner.stop(STOP_AT);
    await expect(stopped.runner.start(LEASE_EXPIRED_AT)).rejects.toBeInstanceOf(
      InvalidRunnerStatusError,
    );

    const failed = await startedRunner();
    failed.runner.fail('manual failure', CYCLE_AT);
    await expect(failed.runner.start(CYCLE_2_AT)).rejects.toBeInstanceOf(InvalidRunnerStatusError);
  });
});

describe('US189 PaperTradingRunner cycle execution', () => {
  it('executes a single orchestration cycle: validates, invokes the strategy stub, and publishes the event', async () => {
    const { runner, strategy } = await startedRunner();

    const context = await runner.runCycle(CYCLE_AT);

    expect(context).toEqual({
      sessionId: 'session-189',
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 1,
      runtimeId: RUNTIME_ID,
    });
    expect(Object.isFrozen(context)).toBe(true);
    expect(runner.cycleNumber()).toBe(1);
    expect(runner.executionContext()).toBe(context);

    expect(strategy.executeCalls).toEqual([context]);

    const session = runner.session() as TradingSession;
    expect(session.lastHeartbeat()).toBe(CYCLE_AT);

    expect(runner.domainEvents().at(-1)).toEqual({
      eventType: 'PaperRunnerCycleExecuted',
      sessionId: 'session-189',
      runtimeId: RUNTIME_ID,
      occurredAt: CYCLE_AT,
      cycleNumber: 1,
      context,
    });
  });

  it('increments the cycle number across consecutive cycles', async () => {
    const { runner, strategy } = await startedRunner();

    await runner.runCycle(CYCLE_AT);
    const second = await runner.runCycle(CYCLE_2_AT);

    expect(second.cycleNumber).toBe(2);
    expect(runner.cycleNumber()).toBe(2);
    expect(strategy.executeCalls).toHaveLength(2);
    expect((runner.session() as TradingSession).lastHeartbeat()).toBe(CYCLE_2_AT);
  });

  it('skips heartbeat recording when the cycle timestamp has not advanced', async () => {
    const { runner } = await startedRunner();

    const context = await runner.runCycle(START_AT);

    expect(context.cycleNumber).toBe(1);
    expect((runner.session() as TradingSession).lastHeartbeat()).toBe(START_AT);
  });

  it('rejects cycles unless the runner is RUNNING', async () => {
    const { runner } = createRunner();
    await expect(runner.runCycle(CYCLE_AT)).rejects.toBeInstanceOf(InvalidRunnerStatusError);

    const stopped = await startedRunner();
    await stopped.runner.stop(STOP_AT);
    await expect(stopped.runner.runCycle(LEASE_EXPIRED_AT)).rejects.toBeInstanceOf(
      InvalidRunnerStatusError,
    );
  });

  it('rejects a cycle when the runtime lease has expired', async () => {
    const { runner, strategy } = await startedRunner();

    await expect(runner.runCycle(LEASE_EXPIRED_AT)).rejects.toBeInstanceOf(
      InactiveRuntimeLeaseError,
    );
    expect(strategy.executeCalls).toHaveLength(0);
    expect(runner.cycleNumber()).toBe(0);
  });

  it('rejects a cycle when the runtime heartbeat has expired', async () => {
    const { runner } = await startedRunner({
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 5_000,
    });

    await expect(runner.runCycle(HEARTBEAT_EXPIRED_CYCLE_AT)).rejects.toBeInstanceOf(
      ExpiredRuntimeHeartbeatError,
    );
  });
});

describe('US189 PaperTradingRunner stop', () => {
  it('stops gracefully: shuts the strategy down, releases the lease, and stops the session', async () => {
    const { runner, strategy } = await startedRunner();
    await runner.runCycle(CYCLE_AT);

    await runner.stop(STOP_AT);

    expect(runner.status()).toBe(RunnerStatus.STOPPED);
    expect(runner.isStopped()).toBe(true);
    expect(runner.isRunning()).toBe(false);
    expect(runner.stoppedAt()).toBe(STOP_AT);

    const session = runner.session() as TradingSession;
    expect(session.currentState()).toBe(SessionState.STOPPED);
    expect(session.stoppedAt).toBe(STOP_AT);
    expect(session.hasLease(STOP_AT)).toBe(false);
    expect(session.toProperties().runtimeLease).toBeNull();

    expect(strategy.shutdownCalls).toHaveLength(1);
    expect(strategy.shutdownCalls[0]).toBe(runner.executionContext());

    expect(runner.domainEvents().at(-1)).toEqual({
      eventType: 'PaperRunnerStopped',
      sessionId: 'session-189',
      runtimeId: RUNTIME_ID,
      occurredAt: STOP_AT,
      stoppedAt: STOP_AT,
      runnerStatus: RunnerStatus.STOPPED,
    });
  });

  it('stops gracefully even when the lease already expired, retaining the stale lease', async () => {
    const { runner } = await startedRunner();

    await runner.stop(LEASE_EXPIRED_AT);

    const session = runner.session() as TradingSession;
    expect(runner.status()).toBe(RunnerStatus.STOPPED);
    expect(session.currentState()).toBe(SessionState.STOPPED);
    expect(session.toProperties().runtimeLease).not.toBeNull();
  });

  it('rejects duplicate stop without changing the final state', async () => {
    const { runner } = await startedRunner();
    await runner.stop(STOP_AT);
    const eventsAfterStop = runner.domainEvents().length;

    await expect(runner.stop(LEASE_EXPIRED_AT)).rejects.toBeInstanceOf(DuplicateRunnerStopError);
    expect(runner.status()).toBe(RunnerStatus.STOPPED);
    expect(runner.stoppedAt()).toBe(STOP_AT);
    expect((runner.session() as TradingSession).currentState()).toBe(SessionState.STOPPED);
    expect(runner.domainEvents()).toHaveLength(eventsAfterStop);
  });

  it('rejects reentrant stop while STOPPING', async () => {
    const { runner, strategy } = await startedRunner();
    let observedStatus: RunnerStatus | null = null;
    let reentrantError: unknown = null;
    strategy.onShutdown = async () => {
      observedStatus = runner.status();
      reentrantError = await runner.stop(LEASE_EXPIRED_AT).catch((error: unknown) => error);
    };

    await runner.stop(STOP_AT);

    expect(observedStatus).toBe(RunnerStatus.STOPPING);
    expect(reentrantError).toBeInstanceOf(DuplicateRunnerStopError);
    expect(runner.status()).toBe(RunnerStatus.STOPPED);
  });

  it('rejects stopping a runner that is not RUNNING', async () => {
    const created = createRunner();
    await expect(created.runner.stop(STOP_AT)).rejects.toBeInstanceOf(InvalidRunnerStatusError);

    const failed = await startedRunner();
    failed.runner.fail('manual failure', CYCLE_AT);
    await expect(failed.runner.stop(STOP_AT)).rejects.toBeInstanceOf(InvalidRunnerStatusError);
  });

  it('fails the runner when strategy shutdown throws', async () => {
    const { runner, strategy } = await startedRunner();
    strategy.onShutdown = () => {
      throw new Error('shutdown exploded');
    };

    await expect(runner.stop(STOP_AT)).rejects.toThrow('shutdown exploded');
    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect(runner.failureReason()).toBe('shutdown exploded');
    expect((runner.session() as TradingSession).isFailed()).toBe(true);
  });
});

describe('US189 PaperTradingRunner failure', () => {
  it('fails a RUNNING runner and its session with the given reason', async () => {
    const { runner } = await startedRunner();

    runner.fail('  strategy diverged  ', CYCLE_AT);

    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect(runner.isRunning()).toBe(false);
    expect(runner.failureReason()).toBe('strategy diverged');
    expect(runner.failedAt()).toBe(CYCLE_AT);

    const session = runner.session() as TradingSession;
    expect(session.isFailed()).toBe(true);
    expect(session.failureReason).toBe('strategy diverged');

    expect(runner.domainEvents().at(-1)).toEqual({
      eventType: 'PaperRunnerFailed',
      sessionId: 'session-189',
      runtimeId: RUNTIME_ID,
      occurredAt: CYCLE_AT,
      failedAt: CYCLE_AT,
      reason: 'strategy diverged',
      runnerStatus: RunnerStatus.FAILED,
    });
  });

  it('leaves the session untouched when its lifecycle cannot fail', () => {
    const { runner } = createRunner();

    runner.fail('startup aborted', START_AT);

    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect((runner.session() as TradingSession).currentState()).toBe(SessionState.CREATED);
  });

  it('fails a runner without a session, publishing a session-less event', () => {
    const { runner } = createRunner({ session: null });

    runner.fail('no session available', START_AT);

    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect(runner.domainEvents().at(-1)).toMatchObject({
      eventType: 'PaperRunnerFailed',
      sessionId: null,
      reason: 'no session available',
    });
  });

  it('fails with the default clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START_AT));
    const { runner } = createRunner();

    runner.fail('default clock failure');

    expect(runner.status()).toBe(RunnerStatus.FAILED);
    expect(runner.failedAt()).toBe(START_AT);
  });

  it('rejects a missing failure reason', async () => {
    const { runner } = await startedRunner();

    expect(() => runner.fail('', CYCLE_AT)).toThrow(MissingRunnerFailureReasonError);
    expect(() => runner.fail('   ', CYCLE_AT)).toThrow(MissingRunnerFailureReasonError);
    expect(() => runner.fail(undefined as unknown as string, CYCLE_AT)).toThrow(
      MissingRunnerFailureReasonError,
    );
    expect(runner.status()).toBe(RunnerStatus.RUNNING);
  });

  it('rejects failing a runner already in a final state', async () => {
    const failed = await startedRunner();
    failed.runner.fail('first failure', CYCLE_AT);
    expect(() => failed.runner.fail('second failure', CYCLE_2_AT)).toThrow(
      InvalidRunnerStatusError,
    );
    expect(failed.runner.failureReason()).toBe('first failure');

    const stopped = await startedRunner();
    await stopped.runner.stop(STOP_AT);
    expect(() => stopped.runner.fail('too late', LEASE_EXPIRED_AT)).toThrow(
      InvalidRunnerStatusError,
    );
  });
});

describe('US189 PaperTradingRunner recovery', () => {
  it('invokes recovery when the heartbeat expires and remains idempotent afterwards', async () => {
    const { runner } = await startedRunner({
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 5_000,
    });
    await expect(runner.runCycle(HEARTBEAT_EXPIRED_CYCLE_AT)).rejects.toBeInstanceOf(
      ExpiredRuntimeHeartbeatError,
    );

    expect(runner.recover(HEARTBEAT_EXPIRED_CYCLE_AT)).toBe(true);

    const session = runner.session() as TradingSession;
    expect(session.isRecovered()).toBe(true);
    expect(session.recoveryStatus()).toBe(RecoveryStatus.RECOVERED);
    expect(session.recoveryAttempt).toBe(1);

    expect(runner.recover(CYCLE_2_AT)).toBe(false);
    expect((runner.session() as TradingSession).recoveryAttempt).toBe(1);
  });

  it('completes an already in-flight session recovery', () => {
    const session = runningSession(RUNTIME_ID, { heartbeatTimeoutMs: 10_000 }).beginRecovery(
      START_AT,
    );
    const { runner } = createRunner({ session });

    expect(runner.recover(CYCLE_AT)).toBe(true);
    expect((runner.session() as TradingSession).isRecovered()).toBe(true);
  });

  it('is a no-op when recovery is not required', async () => {
    const { runner } = await startedRunner();

    expect(runner.recover(CYCLE_AT)).toBe(false);
    expect((runner.session() as TradingSession).recoveryStatus()).toBe(RecoveryStatus.NOT_REQUIRED);
  });

  it('rejects recovery without a TradingSession', () => {
    const { runner } = createRunner({ session: null });

    expect(() => runner.recover(CYCLE_AT)).toThrow(MissingTradingSessionError);
  });
});

describe('US189 RunnerStatus', () => {
  it('exposes the Runner-only status values', () => {
    expect(Object.values(RunnerStatus)).toEqual([
      'CREATED',
      'STARTING',
      'RUNNING',
      'STOPPING',
      'STOPPED',
      'FAILED',
    ]);
  });

  it.each(Object.values(RunnerStatus))('recognizes %s as a RunnerStatus', (status) => {
    expect(isRunnerStatus(status)).toBe(true);
  });

  it('rejects unknown status values', () => {
    expect(isRunnerStatus('PAUSED')).toBe(false);
    expect(isRunnerStatus(undefined)).toBe(false);
  });
});
