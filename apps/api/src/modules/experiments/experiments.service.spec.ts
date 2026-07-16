import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@trp/research', () => ({
  DEFAULT_BACKTEST_CONFIG: {
    initialCapital: 10_000,
    feeRate: 0.001,
    slippageRate: 0.0005,
  },
  defaultExperimentConfig: vi.fn(() => ({
    strategyId: 'ema-crossover',
    strategyVersion: '1.0.0',
    params: { emaFast: 20, emaSlow: 50 },
    backtest: {
      initialCapital: 10_000,
      feeRate: 0.001,
      slippageRate: 0.0005,
    },
  })),
  resolveStrategy: vi.fn(() => ({
    id: 'ema-crossover',
    version: '1.0.0',
    normalizeParams: (params: Record<string, unknown>) => params,
  })),
  runBacktest: vi.fn(() => ({
    metrics: { tradeCount: 7, profitFactor: 0.35, expectancy: -81.55, totalReturnPercent: -6.37 },
    trades: [{ entryTime: 1, exitTime: 2, pnl: -81.55 }],
  })),
  validateBacktest: vi.fn(() => ({
    verdict: 'fail',
    reasons: ['Non-positive expectancy'],
    checks: [],
  })),
  runExperiment: vi.fn(() => ({
    strategyId: 'ema-crossover',
    strategyVersion: '1.0.0',
    params: { emaFast: 20, emaSlow: 50 },
    backtest: {
      initialCapital: 10_000,
      feeRate: 0.001,
      slippageRate: 0.0005,
    },
    metrics: { tradeCount: 7, profitFactor: 0.35, expectancy: -81.55, totalReturnPercent: -6.37 },
    validation: {
      verdict: 'fail',
      reasons: ['Non-positive expectancy'],
      checks: [],
    },
    tradeCount: 7,
    datasetBarCount: 500,
    generatedAt: '2026-07-16T09:00:00.000Z',
  })),
  hashConfig: vi.fn(() => 'cfg-hash'),
}));

vi.mock('../../common/git', () => ({
  getGitCommit: vi.fn(() => 'git-commit-123'),
}));

import { ExperimentsService } from './experiments.service';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  RESEARCH_ENGINE_VERSION,
  VALIDATION_VERSION,
} from '../knowledge/knowledge.version';

describe('ExperimentsService provenance', () => {
  let prisma: any;
  let datasetsService: any;
  let knowledge: any;

  beforeEach(() => {
    prisma = {
      dataset: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ds-1',
          symbol: 'BTCUSDT',
          timeframe: '1h',
        }),
      },
      experiment: {
        create: vi.fn().mockImplementation(async ({ data }: any) => ({
          id: 'exp-1',
          ...data,
          dataset: {
            symbol: 'BTCUSDT',
            timeframe: '1h',
            contentHash: 'content-hash',
            barCount: 500,
          },
        })),
      },
    };

    datasetsService = {
      getBars: vi
        .fn()
        .mockResolvedValue([{ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }]),
    };

    knowledge = {
      recordFromExperiment: vi.fn().mockResolvedValue({ status: 'created', entry: { id: 'k-1' } }),
    };
  });

  it('stores researchEngineVersion in report', async () => {
    const service = new ExperimentsService(prisma, datasetsService, knowledge);
    const experiment = await service.run('ds-1');

    expect(experiment.report.researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
  });

  it('stores validationVersion in report', async () => {
    const service = new ExperimentsService(prisma, datasetsService, knowledge);
    const experiment = await service.run('ds-1');

    expect(experiment.report.validationVersion).toBe(VALIDATION_VERSION);
  });

  it('report versions match the single version source', async () => {
    const service = new ExperimentsService(prisma, datasetsService, knowledge);
    const experiment = await service.run('ds-1');

    expect(experiment.report.researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
    expect(experiment.report.validationVersion).toBe(VALIDATION_VERSION);
    expect(KNOWLEDGE_SCHEMA_VERSION).toBe(2);
  });
});
