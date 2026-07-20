import type { PrismaService } from '../../storage/prisma/prisma.module';
import type { DatasetsService } from '../datasets/datasets.service';
import type { Strategy } from '../strategies';
import type { StrategyDomainService } from '../strategies';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoricalReplayEngine } from './historical-replay.engine';
import { HistoricalResearchService } from './historical-research.service';

const STRATEGY: Strategy = {
  id: 'strategy-1',
  workspaceId: 'workspace-1',
  name: 'EMA',
  description: '',
  status: 'active',
  tradingPair: 'BTCUSDT',
  timeframe: '1h',
  direction: 'LONG',
  positionSize: 1,
  stopLossPercent: 0,
  takeProfitPercent: 0,
  parameters: { evaluator: 'ema' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DATASETS = [dataset('dataset-bull', 'BULL_MARKET'), dataset('dataset-bear', 'BEAR_MARKET')];

describe('HistoricalResearchService (US018)', () => {
  let runCreate: ReturnType<typeof vi.fn>;
  let runUpdate: ReturnType<typeof vi.fn>;
  let resultCreate: ReturnType<typeof vi.fn>;
  let replay: ReturnType<typeof vi.fn>;
  let service: HistoricalResearchService;

  beforeEach(() => {
    runCreate = vi.fn(async ({ data }) => data);
    runUpdate = vi.fn(async ({ where, data }) => ({ id: where.id, ...data, results: [] }));
    resultCreate = vi.fn(async ({ data }) => data);
    replay = vi.fn(async ({ dataset }) => replayResult(dataset));

    const prisma = {
      historicalResearchRun: {
        create: runCreate,
        update: runUpdate,
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      historicalResearchResult: {
        create: resultCreate,
        findMany: vi.fn(),
      },
    } as unknown as PrismaService;
    const datasets = {
      getMany: vi.fn(async (ids: readonly string[]) =>
        DATASETS.filter((datasetRecord) => ids.includes(datasetRecord.id)),
      ),
      listEnabled: vi.fn(async () => DATASETS),
      getCandles: vi.fn(async () => [{}]),
    } as unknown as DatasetsService;
    const strategies = {
      listByWorkspace: vi.fn(async () => [STRATEGY]),
    } as unknown as StrategyDomainService;
    service = new HistoricalResearchService(prisma, datasets, strategies, {
      replay,
    } as unknown as HistoricalReplayEngine);
  });

  it('isolates dataset failures and preserves a result for every compatible execution', async () => {
    replay.mockRejectedValueOnce(new Error('bad dataset')).mockResolvedValueOnce(
      replayResult({
        ...DATASETS[1],
        id: 'dataset-bear',
        marketRegime: 'BEAR_MARKET',
      }),
    );

    await service.run({
      workspaceId: 'workspace-1',
      datasetIds: ['dataset-bull', 'dataset-bear'],
      strategyIds: ['strategy-1'],
    });

    expect(replay).toHaveBeenCalledTimes(2);
    expect(resultCreate).toHaveBeenCalledTimes(2);
    expect(resultCreate.mock.calls.map(([call]) => call.data.status)).toEqual([
      'FAILED',
      'COMPLETED',
    ]);
    expect(runUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED_WITH_FAILURES' }),
      }),
    );
  });

  it('always inserts new runs and results instead of overwriting previous research', async () => {
    await service.run({
      workspaceId: 'workspace-1',
      datasetIds: ['dataset-bull'],
      strategyIds: ['strategy-1'],
    });
    await service.run({
      workspaceId: 'workspace-1',
      datasetIds: ['dataset-bull'],
      strategyIds: ['strategy-1'],
    });

    const runIds = runCreate.mock.calls.map(([call]) => call.data.id);
    const resultRunIds = resultCreate.mock.calls.map(([call]) => call.data.researchId);
    expect(new Set(runIds).size).toBe(2);
    expect(resultRunIds).toEqual(runIds);
  });
});

function dataset(id: string, marketRegime: string) {
  return {
    id,
    displayName: id,
    description: '',
    marketRegime,
    symbol: 'BTCUSDT',
    symbols: ['BTCUSDT'],
    timeframe: '1h',
    exchange: 'binance',
    enabled: true,
    contentHash: `${id}-hash`,
    barCount: 3,
    startTime: new Date('2026-01-01T00:00:00.000Z'),
    endTime: new Date('2026-01-01T03:00:00.000Z'),
    gitCommit: null,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

function replayResult(datasetRecord: ReturnType<typeof dataset>) {
  return {
    dataset: {
      datasetId: datasetRecord.id,
      displayName: datasetRecord.displayName,
      description: '',
      marketRegime: datasetRecord.marketRegime,
      exchange: 'binance',
      symbols: ['BTCUSDT'],
      timeframe: '1h',
      startDate: datasetRecord.startTime.toISOString(),
      endDate: datasetRecord.endTime.toISOString(),
      enabled: true,
      contentHash: datasetRecord.contentHash,
    },
    strategy: STRATEGY,
    symbol: 'BTCUSDT',
    timeframe: '1h',
    trades: [],
    signalStats: { buy: 0, sell: 0, hold: 3, ignored: 0, duplicates: 0, failures: 0 },
    metrics: {
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      netProfit: 0,
      profitFactor: 0,
      maxDrawdown: 0,
    },
    validation: {
      passed: true,
      chronologicalReplay: true,
      noFutureDataLeakage: true,
      noDuplicateCandles: true,
      noDuplicateTrades: true,
      processedCandles: 3,
      evaluatedCandles: 3,
      warmupCandles: 0,
      resultHash: `${datasetRecord.id}-result`,
    },
    executionTimeMs: 1,
  };
}
