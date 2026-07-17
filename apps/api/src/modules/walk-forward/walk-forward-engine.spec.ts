import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BacktestEngine } from '../backtesting/backtest-engine';
import { BacktestStatus } from '../backtesting/backtest-status';
import type { Strategy } from '../backtesting/strategy';
import { toInstrument } from '../market-data/instrument';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import { InMemoryMarketDataRepository } from '../market-data/repositories/in-memory-market-data.repository';
import { Timeframe } from '../market-data/timeframe';
import { LocalRepositoryProvider } from '../market-data-provider/local-repository.provider';
import { ProviderRegistry } from '../market-data-provider/provider-registry';
import { WalkForwardEngine } from './walk-forward-engine';
import type { WalkForwardSession } from './walk-forward-session';
import { toWalkForwardSessionId } from './walk-forward-session-id';
import { buildWalkForwardWindows } from './walk-forward-window-builder';

const WS = 'ws-1';

describe('buildWalkForwardWindows (US119)', () => {
  it('builds rolling train/test windows with separate testingWindow and stepSize', () => {
    const bars = timestampsToBars(['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']);

    expect(buildWalkForwardWindows(bars, 4, 2, 2)).toEqual([
      {
        index: 0,
        trainFrom: 't0',
        trainTo: 't3',
        testFrom: 't4',
        testTo: 't5',
      },
      {
        index: 1,
        trainFrom: 't2',
        trainTo: 't5',
        testFrom: 't6',
        testTo: 't7',
      },
      {
        index: 2,
        trainFrom: 't4',
        trainTo: 't7',
        testFrom: 't8',
        testTo: 't9',
      },
    ]);
  });

  it('returns empty when history is too short', () => {
    const bars = timestampsToBars(['t0', 't1', 't2', 't3', 't4']);
    expect(buildWalkForwardWindows(bars, 4, 2, 2)).toEqual([]);
  });

  it('rejects non-positive window sizes', () => {
    expect(() => buildWalkForwardWindows([], 0, 2, 2)).toThrow(/trainingWindow/);
    expect(() => buildWalkForwardWindows([], 4, 0, 2)).toThrow(/testingWindow/);
    expect(() => buildWalkForwardWindows([], 4, 2, 0)).toThrow(/stepSize/);
  });
});

describe('WalkForwardEngine (US119)', () => {
  let marketData: MarketDataDomainService;
  let backtests: BacktestEngine;
  let engine: WalkForwardEngine;

  beforeEach(() => {
    marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
    const local = new LocalRepositoryProvider(marketData);
    const providers = new ProviderRegistry([local]);
    backtests = new BacktestEngine(providers);
    engine = new WalkForwardEngine(providers, backtests);
  });

  it('runs BacktestEngine sequentially on each testing window', async () => {
    seedHourlyBars(marketData, 10);

    const phases: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;

    const strategy: Strategy = {
      initialize: async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        phases.push('initialize');
        await Promise.resolve();
        inFlight -= 1;
      },
      onBar: async () => {
        phases.push('onBar');
      },
      finalize: async () => {
        phases.push('finalize');
      },
    };

    const runSpy = vi.spyOn(backtests, 'run');
    const result = await engine.run(
      createSession({ trainingWindow: 4, testingWindow: 2, stepSize: 2 }),
      strategy,
    );

    expect(result.totalWindows).toBe(3);
    expect(result.completedWindows).toBe(3);
    expect(result.failedWindows).toBe(0);
    expect(result.totalProcessedBars).toBe(6);
    expect(result.windowResults).toHaveLength(3);
    expect(runSpy).toHaveBeenCalledTimes(3);
    expect(maxInFlight).toBe(1);

    expect(result.windowResults[0]?.window).toMatchObject({
      index: 0,
      testFrom: '2026-07-17T04:00:00.000Z',
      testTo: '2026-07-17T05:00:00.000Z',
    });
    expect(result.windowResults[0]?.result.processedBars).toBe(2);
    expect(result.windowResults[0]?.result.status).toBe(BacktestStatus.Completed);

    // initialize→onBar*→finalize per window, sequential
    expect(phases.filter((p) => p === 'initialize')).toHaveLength(3);
    expect(phases.filter((p) => p === 'finalize')).toHaveLength(3);
    expect(phases.filter((p) => p === 'onBar')).toHaveLength(6);

    expect(Object.keys(result).sort()).toEqual([
      'completedWindows',
      'durationMs',
      'failedWindows',
      'finishedAt',
      'startedAt',
      'totalProcessedBars',
      'totalWindows',
      'windowResults',
    ]);
  });

  it('counts failed windows without stopping the sequence', async () => {
    seedHourlyBars(marketData, 10);

    let windowRuns = 0;
    const strategy: Strategy = {
      initialize: () => {
        windowRuns += 1;
        if (windowRuns === 2) throw new Error('boom');
      },
      onBar: () => undefined,
      finalize: () => undefined,
    };

    const result = await engine.run(
      createSession({ trainingWindow: 4, testingWindow: 2, stepSize: 2 }),
      strategy,
    );

    expect(result.totalWindows).toBe(3);
    expect(result.completedWindows).toBe(2);
    expect(result.failedWindows).toBe(1);
    expect(result.windowResults.map((item) => item.result.status)).toEqual([
      BacktestStatus.Completed,
      BacktestStatus.Failed,
      BacktestStatus.Completed,
    ]);
  });

  it('returns empty aggregation when not enough bars for a window', async () => {
    seedHourlyBars(marketData, 3);

    const strategy: Strategy = {
      initialize: () => undefined,
      onBar: () => undefined,
      finalize: () => undefined,
    };

    const result = await engine.run(
      createSession({ trainingWindow: 4, testingWindow: 2, stepSize: 2 }),
      strategy,
    );

    expect(result.totalWindows).toBe(0);
    expect(result.windowResults).toEqual([]);
    expect(result.totalProcessedBars).toBe(0);
  });
});

function createSession(
  overrides: Partial<
    Pick<WalkForwardSession, 'trainingWindow' | 'testingWindow' | 'stepSize'>
  > = {},
): WalkForwardSession {
  return {
    id: toWalkForwardSessionId('wf-1'),
    workspaceId: WS,
    strategyId: 'noop',
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.H1,
    trainingWindow: 4,
    testingWindow: 2,
    stepSize: 2,
    ...overrides,
  };
}

function seedHourlyBars(marketData: MarketDataDomainService, count: number): void {
  const timestamps = Array.from({ length: count }, (_, i) => {
    const hour = String(i).padStart(2, '0');
    return `2026-07-17T${hour}:00:00.000Z`;
  });
  marketData.saveBars(
    timestamps.map((timestamp, index) => ({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      timestamp,
      open: 100 + index,
      high: 110 + index,
      low: 95 + index,
      close: 105 + index,
      volume: 1,
    })),
  );
}

function timestampsToBars(timestamps: string[]) {
  return timestamps.map((timestamp, index) => ({
    id: `bar-${index}` as never,
    workspaceId: WS,
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.H1,
    timestamp,
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
  }));
}
