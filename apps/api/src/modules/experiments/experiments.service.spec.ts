import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { OhlcvBar } from '@trp/research';

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
  resolveSlice: vi.fn(
    ({
      bars,
      startIndex,
      endIndex,
    }: {
      bars: OhlcvBar[];
      startIndex: number;
      endIndex: number;
    }) => ({
      bars: bars.slice(startIndex, endIndex + 1),
      ref: {},
      sliceIdentity: 'slice-id',
    }),
  ),
  buildSliceIdentity: vi.fn(
    (datasetId: string, startIndex: number, endIndex: number, role: string) =>
      `${datasetId}:${startIndex}:${endIndex}:${role}`,
  ),
  hashConfig: vi.fn(() => 'cfg-hash'),
}));

vi.mock('../../common/git', () => ({
  getGitCommit: vi.fn(() => 'git-commit-123'),
}));

import { ExperimentsService } from './experiments.service';
import { NoOpLogger } from '../../logging/noop.logger';
import type { PrismaService } from '../../storage/prisma/prisma.module';
import type { DatasetsService } from '../datasets/datasets.service';
import type { KnowledgeService } from '../knowledge/knowledge.service';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  RESEARCH_ENGINE_VERSION,
  VALIDATION_VERSION,
} from '../knowledge/knowledge.version';

type ExperimentReportShape = {
  researchEngineVersion: string;
  validationVersion: string;
};

function reportOf(experiment: { report: unknown }): ExperimentReportShape {
  return experiment.report as ExperimentReportShape;
}

type ExperimentCreateData = {
  datasetId: string;
  strategyId: string;
  strategyVersion: string;
  configHash: string;
  gitCommit: string | null;
  verdict: string;
  report: {
    researchEngineVersion: string;
    validationVersion: string;
  };
  metrics: Record<string, unknown>;
  validation: Record<string, unknown>;
  trades: unknown[];
};

describe('ExperimentsService provenance', () => {
  let prisma: {
    dataset: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    experiment: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  let datasetsService: {
    getBars: ReturnType<typeof vi.fn>;
  };
  let knowledge: {
    recordFromExperiment: ReturnType<typeof vi.fn>;
  };

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
        create: vi.fn().mockImplementation(async ({ data }: { data: ExperimentCreateData }) => ({
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
    const service = new ExperimentsService(
      prisma as unknown as PrismaService,
      datasetsService as unknown as DatasetsService,
      knowledge as unknown as KnowledgeService,
      new NoOpLogger(),
    );
    const experiment = await service.run('ds-1');

    expect(reportOf(experiment).researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
  });

  it('stores validationVersion in report', async () => {
    const service = new ExperimentsService(
      prisma as unknown as PrismaService,
      datasetsService as unknown as DatasetsService,
      knowledge as unknown as KnowledgeService,
      new NoOpLogger(),
    );
    const experiment = await service.run('ds-1');

    expect(reportOf(experiment).validationVersion).toBe(VALIDATION_VERSION);
  });

  it('report versions match the single version source', async () => {
    const service = new ExperimentsService(
      prisma as unknown as PrismaService,
      datasetsService as unknown as DatasetsService,
      knowledge as unknown as KnowledgeService,
      new NoOpLogger(),
    );
    const experiment = await service.run('ds-1');

    expect(reportOf(experiment).researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
    expect(reportOf(experiment).validationVersion).toBe(VALIDATION_VERSION);
    expect(KNOWLEDGE_SCHEMA_VERSION).toBe(2);
  });
});
