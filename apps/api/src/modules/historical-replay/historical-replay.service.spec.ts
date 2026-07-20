import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ResearchValidationError,
  type CreateResearchSessionRequest,
  type ResearchSessionResponse,
} from '../research-api';
import {
  ActiveRecoveryError,
  ExpiredRuntimeHeartbeatError,
  InactiveRuntimeLeaseError,
  InvalidExecutionModeError,
  RunnerStatus,
  type PaperExecutionContext,
  type PaperStrategy,
} from '../paper-trading-runner';
import { Timeframe } from '../market-data/timeframe';
import { ExecutionMode, RecoveryStatus, SessionState } from '../trading-session/domain';
import {
  createExecutionResult,
  ExecutionStatus,
  InMemorySmokeSessionRepository,
} from '../smoke-backtest';
import {
  createEventEmissionFailingNotifier,
  HISTORICAL_REPLAY_COMPLETION_EVENTS,
} from '../chaos-testing';
import {
  createHistoricalCandle,
  createHistoricalDataset,
  createReplayConfiguration,
  createReplayMetrics,
  HistoricalMarketDataProvider,
  HistoricalReplayActiveRecoveryError,
  HistoricalReplayAlreadyCompletedError,
  HistoricalReplayDuplicateExecutionError,
  HistoricalReplayExecutionFailedError,
  HistoricalReplayExpiredHeartbeatError,
  HistoricalReplayExpiredLeaseError,
  HistoricalReplayRunnerStartupError,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  HistoricalReplayValidationError,
  type HistoricalCandle,
  type HistoricalDataset,
  type HistoricalResearchOrchestrator,
  type HistoricalReplayServiceDependencies,
} from './index';

const REPLAY_START_AT = '2026-07-20T10:00:00.000Z';
const CREATE_AT = '2026-07-20T10:00:01.000Z';
const START_AT = '2026-07-20T10:00:02.000Z';
const CYCLE_1_AT = '2026-07-20T10:00:03.000Z';
const CYCLE_2_AT = '2026-07-20T10:00:04.000Z';
const CYCLE_3_AT = '2026-07-20T10:00:05.000Z';
const STOP_AT = '2026-07-20T10:00:06.000Z';
const COMPLETED_AT = '2026-07-20T10:00:07.000Z';
const HEARTBEAT_EXPIRED_AT = '2026-07-20T10:00:08.000Z';
const LEASE_EXPIRED_AT = '2026-07-20T10:01:30.000Z';
const FAILED_AT = '2026-07-20T10:01:31.000Z';
const SESSION_ID = 'replay-session-193';
const RUNTIME_ID = 'replay-runtime-193';
const DATASET_ID = 'btc-m5-sample';

const DEFAULT_CLOCK_TIMES = [
  REPLAY_START_AT,
  CREATE_AT,
  START_AT,
  CYCLE_1_AT,
  CYCLE_2_AT,
  CYCLE_3_AT,
  STOP_AT,
  COMPLETED_AT,
] as const;

const DEFAULT_CANDLES: readonly HistoricalCandle[] = Object.freeze([
  createHistoricalCandle({
    timestamp: '2026-07-19T20:00:00.000Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1_000,
  }),
  createHistoricalCandle({
    timestamp: '2026-07-19T20:05:00.000Z',
    open: 105,
    high: 115,
    low: 100,
    close: 112,
    volume: 1_100,
  }),
  createHistoricalCandle({
    timestamp: '2026-07-19T20:10:00.000Z',
    open: 112,
    high: 120,
    low: 108,
    close: 118,
    volume: 1_200,
  }),
]);

function createClock(times: readonly string[]): () => string {
  let index = 0;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function defaultDataset(
  overrides: Partial<{
    datasetId: string;
    symbol: string;
    timeframe: string;
    candles: readonly HistoricalCandle[];
  }> = {},
): HistoricalDataset {
  return createHistoricalDataset({
    datasetId: overrides.datasetId ?? DATASET_ID,
    symbol: overrides.symbol ?? 'BTCUSDT',
    timeframe: overrides.timeframe ?? Timeframe.M5,
    candles: overrides.candles ?? DEFAULT_CANDLES,
  });
}

function createService(
  overrides: Partial<HistoricalReplayServiceDependencies> & {
    clockTimes?: string[];
  } = {},
): {
  service: HistoricalReplayService;
  strategy: HistoricalReplayStrategy;
  marketData: HistoricalMarketDataProvider;
  dataset: HistoricalDataset;
} {
  const { clockTimes, ...dependencyOverrides } = overrides;
  const dataset =
    (dependencyOverrides.dataset as HistoricalDataset | null | undefined) ?? defaultDataset();
  const marketData =
    (dependencyOverrides.marketDataProvider as HistoricalMarketDataProvider | null | undefined) ??
    HistoricalMarketDataProvider.create({
      dataset,
      configuration: dependencyOverrides.configuration,
    });
  const strategy =
    (dependencyOverrides.strategy as HistoricalReplayStrategy | null | undefined) ??
    HistoricalReplayStrategy.create({ marketDataProvider: marketData });
  const clock = dependencyOverrides.clock ?? createClock([...(clockTimes ?? DEFAULT_CLOCK_TIMES)]);

  const service = HistoricalReplayService.create({
    createSessionId: () => SESSION_ID,
    createRuntimeId: () => RUNTIME_ID,
    leaseDurationMs: 60_000,
    heartbeatTimeoutMs: 300_000,
    ...dependencyOverrides,
    dataset: dependencyOverrides.dataset === undefined ? dataset : dependencyOverrides.dataset,
    strategy: dependencyOverrides.strategy === undefined ? strategy : dependencyOverrides.strategy,
    marketDataProvider:
      dependencyOverrides.marketDataProvider === undefined
        ? marketData
        : dependencyOverrides.marketDataProvider,
    clock,
  });

  return {
    service,
    strategy: strategy as HistoricalReplayStrategy,
    marketData: marketData as HistoricalMarketDataProvider,
    dataset,
  };
}

function response(overrides: Partial<ResearchSessionResponse> = {}): ResearchSessionResponse {
  return Object.freeze({
    sessionId: SESSION_ID,
    status: SessionState.RUNNING,
    runnerStatus: RunnerStatus.RUNNING,
    recoveryStatus: RecoveryStatus.NOT_REQUIRED,
    executionMode: ExecutionMode.PAPER,
    startedAt: START_AT,
    stoppedAt: null,
    cycleNumber: 0,
    ...overrides,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('US193 HistoricalCandle', () => {
  it('creates immutable candles and rejects invalid fields', () => {
    const candle = createHistoricalCandle(DEFAULT_CANDLES[0] as HistoricalCandle);
    expect(Object.isFrozen(candle)).toBe(true);
    expect(() =>
      createHistoricalCandle({
        ...(DEFAULT_CANDLES[0] as HistoricalCandle),
        timestamp: 'not-iso',
      }),
    ).toThrow(/timestamp must be an ISO-8601/);
    expect(() =>
      createHistoricalCandle({
        ...(DEFAULT_CANDLES[0] as HistoricalCandle),
        open: Number.NaN,
      }),
    ).toThrow(/open must be a finite number/);
  });
});

describe('US193 HistoricalDataset', () => {
  it('loads an immutable dataset', () => {
    const dataset = defaultDataset();
    expect(dataset.datasetId).toBe(DATASET_ID);
    expect(dataset.symbol).toBe('BTCUSDT');
    expect(dataset.timeframe).toBe(Timeframe.M5);
    expect(dataset.candles).toHaveLength(3);
    expect(Object.isFrozen(dataset)).toBe(true);
    expect(Object.isFrozen(dataset.candles)).toBe(true);
  });

  it('rejects empty, invalid order, duplicate timestamps, and invalid timeframe', () => {
    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: 'BTCUSDT',
        timeframe: Timeframe.M5,
        candles: [],
      }),
    ).toThrow(/dataset must not be empty/);

    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: 'BTCUSDT',
        timeframe: Timeframe.M5,
        candles: null as unknown as [],
      }),
    ).toThrow(/candles are required/);

    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: 'BTCUSDT',
        timeframe: '2m',
        candles: DEFAULT_CANDLES,
      }),
    ).toThrow(/invalid timeframe/);

    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: 'BTCUSDT',
        timeframe: Timeframe.M5,
        candles: [DEFAULT_CANDLES[1] as HistoricalCandle, DEFAULT_CANDLES[0] as HistoricalCandle],
      }),
    ).toThrow(/invalid candle order/);

    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: 'BTCUSDT',
        timeframe: Timeframe.M5,
        candles: [DEFAULT_CANDLES[0] as HistoricalCandle, DEFAULT_CANDLES[0] as HistoricalCandle],
      }),
    ).toThrow(/duplicate candle timestamp/);

    expect(() =>
      createHistoricalDataset({
        datasetId: '',
        symbol: 'BTCUSDT',
        timeframe: Timeframe.M5,
        candles: DEFAULT_CANDLES,
      }),
    ).toThrow(/datasetId is required/);

    expect(() =>
      createHistoricalDataset({
        datasetId: DATASET_ID,
        symbol: '   ',
        timeframe: Timeframe.M5,
        candles: DEFAULT_CANDLES,
      }),
    ).toThrow(/symbol is required/);
  });
});

describe('US193 ReplayConfiguration', () => {
  it('creates frozen configuration and rejects invalid indices', () => {
    const configuration = createReplayConfiguration({
      datasetId: DATASET_ID,
      replaySpeed: 2,
      startIndex: 0,
      endIndex: 2,
    });
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(configuration.replaySpeed).toBe(2);

    expect(() =>
      createReplayConfiguration({
        datasetId: DATASET_ID,
        startIndex: 3,
        endIndex: 1,
      }),
    ).toThrow(/startIndex must be less than or equal to endIndex/);
    expect(() =>
      createReplayConfiguration({
        datasetId: DATASET_ID,
        startIndex: -1,
        endIndex: 1,
      }),
    ).toThrow(/startIndex must be a non-negative integer/);
    expect(() =>
      createReplayConfiguration({
        datasetId: DATASET_ID,
        endIndex: -1,
      }),
    ).toThrow(/endIndex must be a non-negative integer/);
    expect(() =>
      createReplayConfiguration({
        datasetId: DATASET_ID,
        replaySpeed: 0,
        endIndex: 1,
      }),
    ).toThrow(/replaySpeed must be a positive finite number/);
    expect(() =>
      createReplayConfiguration({
        datasetId: '   ',
        endIndex: 1,
      }),
    ).toThrow(/datasetId is required/);
  });
});

describe('US193 HistoricalMarketDataProvider', () => {
  it('replays candles in deterministic order until end of stream', () => {
    const dataset = defaultDataset();
    const provider = HistoricalMarketDataProvider.create({ dataset });
    provider.initialize();

    expect(provider.current()).toBeNull();
    expect(provider.hasNext()).toBe(true);
    expect(provider.isEndOfStream()).toBe(false);
    expect(provider.size()).toBe(3);

    const first = provider.next();
    const second = provider.next();
    const third = provider.next();
    const done = provider.next();

    expect(first?.timestamp).toBe('2026-07-19T20:00:00.000Z');
    expect(second?.timestamp).toBe('2026-07-19T20:05:00.000Z');
    expect(third?.timestamp).toBe('2026-07-19T20:10:00.000Z');
    expect(done).toBeNull();
    expect(provider.current()).toBeNull();
    expect(provider.hasNext()).toBe(false);
    expect(provider.isEndOfStream()).toBe(true);
    expect(provider.remaining()).toBe(0);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('supports current(), reset(), and initialize()', () => {
    const provider = HistoricalMarketDataProvider.create({
      dataset: defaultDataset(),
      configuration: createReplayConfiguration({
        datasetId: DATASET_ID,
        startIndex: 0,
        endIndex: 0,
      }),
    });

    expect(provider.next()?.timestamp).toBe('2026-07-19T20:00:00.000Z');
    expect(provider.current()?.timestamp).toBe('2026-07-19T20:00:00.000Z');
    expect(provider.next()).toBeNull();
    expect(provider.isEndOfStream()).toBe(true);

    provider.reset();
    expect(provider.hasNext()).toBe(true);
    expect(provider.current()).toBeNull();
    expect(provider.next()?.timestamp).toBe('2026-07-19T20:00:00.000Z');

    provider.initialize();
    expect(provider.current()).toBeNull();
    expect(provider.hasNext()).toBe(true);
  });

  it('never mutates the source dataset and rejects null dataset', () => {
    const dataset = defaultDataset();
    const provider = HistoricalMarketDataProvider.create({ dataset });
    provider.next();
    expect(dataset.candles).toHaveLength(3);
    expect(provider.sourceDataset()).toBe(dataset);

    expect(() => HistoricalMarketDataProvider.create({ dataset: null })).toThrow(
      /dataset is required/,
    );
    expect(() =>
      HistoricalMarketDataProvider.create({
        dataset,
        configuration: createReplayConfiguration({
          datasetId: 'other',
          endIndex: 1,
        }),
      }),
    ).toThrow(/datasetId mismatch/);
    expect(() =>
      HistoricalMarketDataProvider.create({
        dataset,
        configuration: createReplayConfiguration({
          datasetId: DATASET_ID,
          endIndex: 99,
        }),
      }),
    ).toThrow(/endIndex out of range/);
    expect(() =>
      HistoricalMarketDataProvider.create({
        dataset,
        configuration: Object.freeze({
          datasetId: DATASET_ID,
          replaySpeed: 1,
          startIndex: 5,
          endIndex: 2,
        }),
      }),
    ).toThrow(/startIndex out of range/);
  });
});

describe('US193 HistoricalReplayStrategy', () => {
  it('records initialize → execute → shutdown and consumes candles', async () => {
    const marketData = HistoricalMarketDataProvider.create({
      dataset: defaultDataset(),
    });
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: marketData,
    });
    const context = {
      sessionId: SESSION_ID,
      executionMode: ExecutionMode.PAPER,
      startedAt: START_AT,
      cycleNumber: 1,
      runtimeId: RUNTIME_ID,
    } as PaperExecutionContext;

    strategy.initialize(context);
    await strategy.execute(context);
    await strategy.execute({ ...context, cycleNumber: 2 });
    strategy.shutdown(context);

    expect(strategy.invocations).toEqual(['initialize', 'execute', 'execute', 'shutdown']);
    expect(strategy.consumedCandles.map((candle) => candle?.timestamp)).toEqual([
      '2026-07-19T20:00:00.000Z',
      '2026-07-19T20:05:00.000Z',
    ]);
    expect(marketData.remaining()).toBe(1);
  });

  it('rejects a null market data provider', () => {
    expect(() => HistoricalReplayStrategy.create({ marketDataProvider: null })).toThrow(
      /marketDataProvider is required/,
    );
  });
});

describe('US193 ExecutionResult extension', () => {
  it('includes datasetId, candlesProcessed, and replayCompleted', () => {
    const result = createExecutionResult({
      sessionId: SESSION_ID,
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 3,
      startedAt: START_AT,
      completedAt: COMPLETED_AT,
      duration: 7_000,
      eventsPublished: 1,
      errors: [],
      datasetId: DATASET_ID,
      candlesProcessed: 3,
      replayCompleted: true,
    });
    expect(result.datasetId).toBe(DATASET_ID);
    expect(result.candlesProcessed).toBe(3);
    expect(result.replayCompleted).toBe(true);
    expect(
      createReplayMetrics({
        candlesProcessed: 3,
        replayDuration: 7_000,
        cyclesExecuted: 3,
        eventsPublished: 1,
        errorCount: 0,
      }),
    ).toEqual({
      candlesProcessed: 3,
      replayDuration: 7_000,
      cyclesExecuted: 3,
      eventsPublished: 1,
      errorCount: 0,
    });
    expect(() =>
      createReplayMetrics({
        candlesProcessed: -1,
        replayDuration: 0,
        cyclesExecuted: 0,
        eventsPublished: 0,
        errorCount: 0,
      }),
    ).toThrow(/candlesProcessed must be a non-negative integer/);
  });
});

describe('US193 HistoricalReplayService creation', () => {
  it('creates a service with historical strategy and market provider', () => {
    const { service, strategy, marketData, dataset } = createService();

    expect(service.paperStrategy()).toBe(strategy);
    expect(service.marketData()).toBe(marketData);
    expect(service.historicalDataset()).toBe(dataset);
    expect(service.lastResult()).toBeNull();
    expect(service.metrics()).toBeNull();
    expect(service.domainEvents()).toEqual([]);
  });

  it('rejects null dataset, strategy, provider, and invalid execution mode', () => {
    const dataset = defaultDataset();
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: marketData,
    });

    expect(() =>
      HistoricalReplayService.create({
        dataset: null,
        strategy,
        marketDataProvider: marketData,
      }),
    ).toThrow(HistoricalReplayValidationError);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy: null,
        marketDataProvider: marketData,
      }),
    ).toThrow(/strategy is required/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: null,
      }),
    ).toThrow(/marketDataProvider is required/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: marketData,
        executionMode: ExecutionMode.LIVE,
      }),
    ).toThrow(/invalid execution mode/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: marketData,
        executionMode: 'RESEARCH' as ExecutionMode,
      }),
    ).toThrow(/invalid execution mode/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: marketData,
        workspaceId: '   ',
      }),
    ).toThrow(/workspaceId is required/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: marketData,
        strategyId: '',
      }),
    ).toThrow(/strategyId is required/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        marketDataProvider: marketData,
        configuration: createReplayConfiguration({
          datasetId: 'other-dataset',
          endIndex: 1,
        }),
      }),
    ).toThrow(/datasetId mismatch/);

    expect(() =>
      HistoricalReplayService.create({
        dataset,
        strategy,
        configuration: createReplayConfiguration({
          datasetId: DATASET_ID,
          endIndex: 99,
        }),
      }),
    ).toThrow(/endIndex out of range/);
  });

  it('auto-creates a market data provider when omitted', () => {
    const dataset = defaultDataset();
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: marketData,
    });
    const service = HistoricalReplayService.create({
      dataset,
      strategy,
      createSessionId: () => SESSION_ID,
      createRuntimeId: () => RUNTIME_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      clock: createClock([...DEFAULT_CLOCK_TIMES]),
    });
    expect(service.marketData().datasetId()).toBe(DATASET_ID);
    expect(service.marketData().size()).toBe(3);
  });
});

describe('US193 HistoricalReplayService successful execution', () => {
  it('runs create → start → replay until EOS → stop and returns ExecutionResult', async () => {
    const { service, strategy, marketData } = createService();

    const result = await service.execute();

    expect(result).toMatchObject({
      sessionId: SESSION_ID,
      runnerStatus: RunnerStatus.STOPPED,
      executionStatus: ExecutionStatus.COMPLETED,
      cyclesExecuted: 3,
      startedAt: START_AT,
      completedAt: COMPLETED_AT,
      eventsPublished: 1,
      errors: [],
      datasetId: DATASET_ID,
      candlesProcessed: 3,
      replayCompleted: true,
    });
    expect(result.duration).toBe(Date.parse(COMPLETED_AT) - Date.parse(REPLAY_START_AT));
    expect(Object.isFrozen(result)).toBe(true);

    expect(strategy.invocations).toEqual([
      'initialize',
      'execute',
      'execute',
      'execute',
      'shutdown',
    ]);
    expect(strategy.consumedCandles.map((candle) => candle?.timestamp)).toEqual([
      '2026-07-19T20:00:00.000Z',
      '2026-07-19T20:05:00.000Z',
      '2026-07-19T20:10:00.000Z',
    ]);
    expect(marketData.isEndOfStream()).toBe(true);
    expect(marketData.next()).toBeNull();

    expect(service.domainEvents()).toEqual([
      expect.objectContaining({
        eventType: 'HistoricalReplayStarted',
        datasetId: DATASET_ID,
        candlesToProcess: 3,
        occurredAt: REPLAY_START_AT,
      }),
      expect.objectContaining({
        eventType: 'HistoricalReplayCompleted',
        sessionId: SESSION_ID,
        candlesProcessed: 3,
        cyclesExecuted: 3,
        completedAt: COMPLETED_AT,
      }),
      expect.objectContaining({
        eventType: 'HistoricalReplayFinished',
        datasetId: DATASET_ID,
        replayCompleted: true,
        finishedAt: COMPLETED_AT,
      }),
    ]);
    expect(service.metrics()).toEqual({
      candlesProcessed: 3,
      replayDuration: result.duration,
      cyclesExecuted: 3,
      eventsPublished: 1,
      errorCount: 0,
    });
    expect(service.lastResult()).toBe(result);
  });

  it('respects startIndex and endIndex window', async () => {
    const dataset = defaultDataset();
    const configuration = createReplayConfiguration({
      datasetId: DATASET_ID,
      startIndex: 1,
      endIndex: 1,
      replaySpeed: 1,
    });
    const { service, strategy } = createService({
      dataset,
      configuration,
      clockTimes: [REPLAY_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const result = await service.execute();
    expect(result.candlesProcessed).toBe(1);
    expect(result.cyclesExecuted).toBe(1);
    expect(strategy.consumedCandles.map((candle) => candle?.timestamp)).toEqual([
      '2026-07-19T20:05:00.000Z',
    ]);
    expect(service.replayConfiguration().replaySpeed).toBe(1);
  });

  it('uses the default clock when none is provided', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(REPLAY_START_AT));
    const dataset = defaultDataset({
      candles: DEFAULT_CANDLES.slice(0, 1),
    });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: marketData,
    });
    const service = HistoricalReplayService.create({
      dataset,
      strategy,
      marketDataProvider: marketData,
      createSessionId: () => SESSION_ID,
      createRuntimeId: () => RUNTIME_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
    });

    const result = await service.execute();
    expect(result.sessionId).toBe(SESSION_ID);
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
    expect(result.replayCompleted).toBe(true);
  });
});

describe('US193 HistoricalReplayService runner integration', () => {
  it('starts and shuts down the runner through the research boundary', async () => {
    const { service, strategy } = createService();
    await service.execute();

    expect(strategy.initializeCalls).toHaveLength(1);
    expect(strategy.shutdownCalls).toHaveLength(1);
    expect(strategy.initializeCalls[0]?.sessionId).toBe(SESSION_ID);
  });

  it('maps runner startup failures to HistoricalReplayRunnerStartupError', async () => {
    const dataset = defaultDataset();
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: marketData,
    });
    strategy.initialize = () => {
      throw new Error('initialize exploded');
    };
    const { service } = createService({
      dataset,
      strategy,
      marketDataProvider: marketData,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayRunnerStartupError);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'HistoricalReplayStarted',
      'HistoricalReplayFailed',
      'HistoricalReplayFinished',
    ]);
    expect(service.domainEvents().at(-1)).toMatchObject({
      eventType: 'HistoricalReplayFinished',
      replayCompleted: false,
    });
    expect(service.metrics()?.errorCount).toBe(1);
  });

  it('persists the research session in the in-memory repository', async () => {
    const repository = new InMemorySmokeSessionRepository();
    const { service } = createService({ repository });
    await service.execute();

    const found = await repository.findById(SESSION_ID);
    expect(found?.sessionId).toBe(SESSION_ID);
    expect(found?.metadata).toMatchObject({
      source: 'historical-replay',
      datasetId: DATASET_ID,
    });
  });
});

describe('US193 HistoricalReplayService validation failures', () => {
  it('rejects expired heartbeat during a cycle', async () => {
    const { service } = createService({
      clockTimes: [
        REPLAY_START_AT,
        CREATE_AT,
        START_AT,
        HEARTBEAT_EXPIRED_AT,
        FAILED_AT,
        FAILED_AT,
      ],
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 5_000,
      dataset: defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) }),
    });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayExpiredHeartbeatError);
    expect(service.domainEvents().at(-2)?.eventType).toBe('HistoricalReplayFailed');
  });

  it('rejects expired lease during a cycle', async () => {
    const { service } = createService({
      clockTimes: [REPLAY_START_AT, CREATE_AT, START_AT, LEASE_EXPIRED_AT, FAILED_AT, FAILED_AT],
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      dataset: defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) }),
    });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayExpiredLeaseError);
  });

  it('rejects active recovery on runner startup', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError('active recovery', new ActiveRecoveryError());
      },
      runCycle: async () => response({ cycleNumber: 1 }),
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
        }),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayActiveRecoveryError);
  });

  it('maps invalid execution mode from the research layer', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError(
          'invalid execution mode: LIVE',
          new InvalidExecutionModeError(ExecutionMode.LIVE),
        );
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayValidationError);
  });
});

describe('US193 HistoricalReplayService idempotency', () => {
  it('returns the same final result on repeated execute()', async () => {
    const { service } = createService();
    const first = await service.execute();
    const eventsAfterFirst = service.domainEvents().length;

    const second = await service.execute();

    expect(second).toBe(first);
    expect(second).toEqual(first);
    expect(service.domainEvents()).toHaveLength(eventsAfterFirst);
  });

  it('produces identical outcomes across independent replays of the same dataset', async () => {
    const dataset = defaultDataset();
    const first = createService({
      dataset,
      clockTimes: [...DEFAULT_CLOCK_TIMES],
    });
    const second = createService({
      dataset,
      clockTimes: [...DEFAULT_CLOCK_TIMES],
    });

    const resultA = await first.service.execute();
    const resultB = await second.service.execute();

    expect(resultA).toEqual(resultB);
    expect(first.service.domainEvents()).toEqual(second.service.domainEvents());
    expect(first.service.metrics()).toEqual(second.service.metrics());
    expect(resultA.cyclesExecuted).toBe(resultB.cyclesExecuted);
  });

  it('rejects repeated execute when rejectOnRepeat is enabled', async () => {
    const { service } = createService({ rejectOnRepeat: true });
    await service.execute();

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayAlreadyCompletedError);
  });

  it('rejects concurrent execute to avoid duplicate runners', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const dataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    let cycleNumber = 0;

    const research: HistoricalResearchOrchestrator = {
      createSession: async (_request: CreateResearchSessionRequest) => {
        await gate;
        return response({
          status: SessionState.CREATED,
          runnerStatus: RunnerStatus.CREATED,
        });
      },
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        marketData.next();
        cycleNumber += 1;
        return response({ cycleNumber });
      },
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
          cycleNumber,
        }),
      domainEvents: () => [],
    };

    const { service } = createService({
      researchService: research,
      dataset,
      marketDataProvider: marketData,
      clockTimes: [REPLAY_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const first = service.execute();
    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayDuplicateExecutionError);
    release();
    const result = await first;
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
  });
});

describe('US193 HistoricalReplayService failure mapping', () => {
  it('maps generic research validation and unknown failures', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => {
        throw new ResearchValidationError('workspace rejected');
      },
      startSession: async () => response(),
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayValidationError);
  });

  it('maps plain errors and non-error throws during execution', async () => {
    const dataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new Error('cycle boom');
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: research,
      dataset,
      marketDataProvider: marketData,
    });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayExecutionFailedError);

    const research2: HistoricalResearchOrchestrator = {
      createSession: async () => {
        throw 'string-failure';
      },
      startSession: async () => response(),
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const dataset2 = defaultDataset();
    const marketData2 = HistoricalMarketDataProvider.create({ dataset: dataset2 });
    const strategy2 = HistoricalReplayStrategy.create({
      marketDataProvider: marketData2,
    });
    const service2 = HistoricalReplayService.create({
      dataset: dataset2,
      strategy: strategy2,
      marketDataProvider: marketData2,
      researchService: research2,
      clock: createClock([REPLAY_START_AT, FAILED_AT, FAILED_AT]),
    });
    await expect(service2.execute()).rejects.toThrow(/string-failure/);
  });

  it('maps heartbeat and lease errors from message text when cause is absent', async () => {
    const heartbeatDataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const heartbeatMarketData = HistoricalMarketDataProvider.create({
      dataset: heartbeatDataset,
    });
    const heartbeatResearch: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new ResearchValidationError('runtime heartbeat has expired');
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: heartbeatResearch,
      dataset: heartbeatDataset,
      marketDataProvider: heartbeatMarketData,
    });
    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayExpiredHeartbeatError);

    const leaseDataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const leaseMarketData = HistoricalMarketDataProvider.create({
      dataset: leaseDataset,
    });
    const leaseResearch: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => response({ status: SessionState.RUNNING, startedAt: START_AT }),
      runCycle: async () => {
        throw new ResearchValidationError(
          'runtime lease is missing, expired, or owned by another runtime',
        );
      },
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const strategy = HistoricalReplayStrategy.create({
      marketDataProvider: leaseMarketData,
    });
    const leaseService = HistoricalReplayService.create({
      dataset: leaseDataset,
      strategy,
      marketDataProvider: leaseMarketData,
      researchService: leaseResearch,
      clock: createClock([
        REPLAY_START_AT,
        CREATE_AT,
        START_AT,
        LEASE_EXPIRED_AT,
        FAILED_AT,
        FAILED_AT,
      ]),
    });
    await expect(leaseService.execute()).rejects.toBeInstanceOf(HistoricalReplayExpiredLeaseError);
  });

  it('exposes typed application error codes', () => {
    expect(new HistoricalReplayValidationError('x').code).toBe('HISTORICAL_REPLAY_VALIDATION');
    expect(new HistoricalReplayAlreadyCompletedError('x').code).toBe(
      'HISTORICAL_REPLAY_ALREADY_COMPLETED',
    );
    expect(new HistoricalReplayDuplicateExecutionError().code).toBe(
      'HISTORICAL_REPLAY_DUPLICATE_EXECUTION',
    );
    expect(new HistoricalReplayRunnerStartupError('x').code).toBe(
      'HISTORICAL_REPLAY_RUNNER_STARTUP_FAILED',
    );
    expect(new HistoricalReplayActiveRecoveryError().code).toBe(
      'HISTORICAL_REPLAY_ACTIVE_RECOVERY',
    );
    expect(new HistoricalReplayExpiredLeaseError().code).toBe('HISTORICAL_REPLAY_EXPIRED_LEASE');
    expect(new HistoricalReplayExpiredHeartbeatError().code).toBe(
      'HISTORICAL_REPLAY_EXPIRED_HEARTBEAT',
    );
    expect(new HistoricalReplayExecutionFailedError('x').code).toBe(
      'HISTORICAL_REPLAY_EXECUTION_FAILED',
    );
    expect(
      new HistoricalReplayExpiredHeartbeatError(new ExpiredRuntimeHeartbeatError()).cause,
    ).toBeInstanceOf(ExpiredRuntimeHeartbeatError);
    expect(
      new HistoricalReplayExpiredLeaseError(new InactiveRuntimeLeaseError()).cause,
    ).toBeInstanceOf(InactiveRuntimeLeaseError);
  });

  it('does not remount historical replay errors when mapping', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new HistoricalReplayValidationError('already mapped');
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toThrow(/already mapped/);
  });

  it('falls back to replay start time when runner startedAt is null', async () => {
    const dataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    let cycleNumber = 0;
    const research: HistoricalResearchOrchestrator = {
      createSession: async () =>
        response({ status: SessionState.CREATED, runnerStatus: RunnerStatus.CREATED }),
      startSession: async () =>
        response({
          status: SessionState.RUNNING,
          startedAt: null,
        }),
      runCycle: async () => {
        marketData.next();
        cycleNumber += 1;
        return response({ cycleNumber });
      },
      stopSession: async () =>
        response({
          status: SessionState.STOPPED,
          runnerStatus: RunnerStatus.STOPPED,
          stoppedAt: STOP_AT,
          cycleNumber,
        }),
      domainEvents: () => [],
    };
    const { service } = createService({
      researchService: research,
      dataset,
      marketDataProvider: marketData,
      clockTimes: [REPLAY_START_AT, CREATE_AT, START_AT, CYCLE_1_AT, STOP_AT, COMPLETED_AT],
    });

    const result = await service.execute();
    expect(result.startedAt).toBe(REPLAY_START_AT);
  });

  it('maps blank startup failures with a fallback message', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new Error('');
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayRunnerStartupError);
  });

  it('maps InvalidExecutionModeError cause without relying on message text', async () => {
    const research: HistoricalResearchOrchestrator = {
      createSession: async () => response({ status: SessionState.CREATED }),
      startSession: async () => {
        throw new ResearchValidationError(
          'mode rejected',
          new InvalidExecutionModeError(ExecutionMode.LIVE),
        );
      },
      runCycle: async () => response(),
      stopSession: async () => response(),
      domainEvents: () => [],
    };
    const { service } = createService({ researchService: research });

    await expect(service.execute()).rejects.toBeInstanceOf(HistoricalReplayValidationError);
  });
});

describe('US193 HistoricalReplayService custom strategy', () => {
  it('accepts any PaperStrategy that records invocations', async () => {
    const dataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 2) });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const calls: string[] = [];
    const strategy: PaperStrategy = {
      initialize: () => {
        calls.push('initialize');
      },
      execute: () => {
        calls.push('execute');
        marketData.next();
      },
      shutdown: () => {
        calls.push('shutdown');
      },
    };
    const { service } = createService({
      dataset,
      strategy,
      marketDataProvider: marketData,
      clockTimes: [
        REPLAY_START_AT,
        CREATE_AT,
        START_AT,
        CYCLE_1_AT,
        CYCLE_2_AT,
        STOP_AT,
        COMPLETED_AT,
      ],
    });

    await service.execute();
    expect(calls).toEqual(['initialize', 'execute', 'execute', 'shutdown']);
  });
});

describe('ADR-019 HistoricalReplayService EventEmissionFailure (Contract B)', () => {
  function createFailingService(): HistoricalReplayService {
    const dataset = defaultDataset({ candles: DEFAULT_CANDLES.slice(0, 1) });
    const marketData = HistoricalMarketDataProvider.create({ dataset });
    const strategy = HistoricalReplayStrategy.create({ marketDataProvider: marketData });
    return HistoricalReplayService.create({
      dataset,
      strategy,
      marketDataProvider: marketData,
      clock: createClock(DEFAULT_CLOCK_TIMES),
      createSessionId: () => SESSION_ID,
      createRuntimeId: () => RUNTIME_ID,
      leaseDurationMs: 60_000,
      heartbeatTimeoutMs: 300_000,
      applicationEventNotifier: createEventEmissionFailingNotifier(
        HISTORICAL_REPLAY_COMPLETION_EVENTS,
      ),
    });
  }

  it('preserves COMPLETED execution when completion notifications throw', async () => {
    const service = createFailingService();

    const result = await service.execute();

    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
    expect(result.errors).toEqual([]);
    expect(service.eventEmissionDiagnostics()).toHaveLength(2);
    expect(service.domainEvents().map((event) => event.eventType)).toEqual([
      'HistoricalReplayStarted',
    ]);
    expect(service.metrics()?.errorCount).toBe(0);
  });

  it('caches the completed result after notification failure', async () => {
    const service = createFailingService();

    const result = await service.execute();
    expect(await service.execute()).toBe(result);
    expect(result.executionStatus).toBe(ExecutionStatus.COMPLETED);
  });

  it('produces identical execution results on repeated notification failure', async () => {
    const first = createFailingService();
    const second = createFailingService();

    expect(await first.execute()).toEqual(await second.execute());
    expect(first.eventEmissionDiagnostics()).toEqual(second.eventEmissionDiagnostics());
  });
});
