import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { DatasetsService } from '../datasets/datasets.service';
import { isMarketRegime } from '../datasets/dataset-metadata';
import { StrategyDomainService, type Strategy } from '../strategies';
import type { HistoricalDataset, HistoricalResearchReport } from './domain/historical-research';
import { HistoricalReplayEngine } from './historical-replay.engine';

export type RunHistoricalResearchInput = {
  workspaceId: string;
  datasetIds?: readonly string[];
  allDatasets?: boolean;
  strategyIds?: readonly string[];
};

export type HistoricalResultFilter = {
  strategyId?: string;
  datasetId?: string;
  marketRegime?: string;
};

@Injectable()
export class HistoricalResearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasets: DatasetsService,
    private readonly strategies: StrategyDomainService,
    private readonly replay: HistoricalReplayEngine,
  ) {}

  async run(input: RunHistoricalResearchInput) {
    const datasets = await this.resolveDatasets(input);
    const strategies = await this.resolveStrategies(input);
    const researchId = randomUUID();
    const startedAt = new Date();

    await this.prisma.historicalResearchRun.create({
      data: {
        id: researchId,
        workspaceId: input.workspaceId,
        status: 'RUNNING',
        datasetIds: datasets.map((dataset) => dataset.id),
        strategyIds: strategies.map((strategy) => strategy.id),
        startedAt,
      },
    });

    const persistedResults: Array<{
      datasetId: string;
      datasetName: string;
      marketRegime: string;
      strategyId: string;
      strategyName: string;
      tradeCount: number;
      winRate: number;
      netProfit: number;
      maxDrawdown: number;
      status: string;
    }> = [];
    let compatibleExecutions = 0;

    try {
      for (const datasetRecord of datasets) {
        const dataset = toHistoricalDataset(datasetRecord);
        for (const strategy of strategies) {
          if (
            !dataset.symbols.includes(strategy.tradingPair) ||
            dataset.timeframe !== strategy.timeframe
          ) {
            continue;
          }
          compatibleExecutions += 1;
          const resultId = randomUUID();
          const createdAt = new Date();
          try {
            const candles = await this.datasets.getCandles(dataset.datasetId, strategy.tradingPair);
            const result = await this.replay.replay({
              workspaceId: input.workspaceId,
              dataset,
              strategy,
              candles,
            });
            const persisted = await this.prisma.historicalResearchResult.create({
              data: {
                id: resultId,
                researchId,
                workspaceId: input.workspaceId,
                datasetId: dataset.datasetId,
                datasetName: dataset.displayName,
                datasetContentHash: dataset.contentHash,
                marketRegime: dataset.marketRegime,
                strategyId: strategy.id,
                strategyName: strategy.name,
                strategySnapshot: toJson(strategy),
                exchange: dataset.exchange,
                symbol: result.symbol,
                timeframe: result.timeframe,
                status: 'COMPLETED',
                trades: toJson(result.trades),
                tradeCount: result.metrics.trades,
                winRate: result.metrics.winRate,
                netProfit: result.metrics.netProfit,
                profitFactor: result.metrics.profitFactor,
                maxDrawdown: result.metrics.maxDrawdown,
                executionTimeMs: result.executionTimeMs,
                validation: toJson(result.validation),
                resultHash: result.validation.resultHash,
                createdAt,
              },
            });
            persistedResults.push(persisted);
          } catch (error) {
            const failure = errorMessage(error);
            const persisted = await this.prisma.historicalResearchResult.create({
              data: {
                id: resultId,
                researchId,
                workspaceId: input.workspaceId,
                datasetId: dataset.datasetId,
                datasetName: dataset.displayName,
                datasetContentHash: dataset.contentHash,
                marketRegime: dataset.marketRegime,
                strategyId: strategy.id,
                strategyName: strategy.name,
                strategySnapshot: toJson(strategy),
                exchange: dataset.exchange,
                symbol: strategy.tradingPair,
                timeframe: strategy.timeframe,
                status: 'FAILED',
                failure,
                trades: [],
                tradeCount: 0,
                winRate: 0,
                netProfit: 0,
                profitFactor: 0,
                maxDrawdown: 0,
                executionTimeMs: 0,
                validation: {
                  passed: false,
                  failure,
                },
                resultHash: hashFailure(dataset, strategy, failure),
                createdAt,
              },
            });
            persistedResults.push(persisted);
          }
        }
      }

      if (compatibleExecutions === 0) {
        throw new BadRequestException(
          'No selected strategy matches the selected dataset symbols and timeframe',
        );
      }

      const report = buildReport(researchId, datasets.map(toHistoricalDataset), persistedResults);
      return await this.prisma.historicalResearchRun.update({
        where: { id: researchId },
        data: {
          status: persistedResults.some((result) => result.status === 'FAILED')
            ? 'COMPLETED_WITH_FAILURES'
            : 'COMPLETED',
          completedAt: new Date(),
          report: toJson(report),
        },
        include: { results: { orderBy: { createdAt: 'asc' } } },
      });
    } catch (error) {
      await this.prisma.historicalResearchRun.update({
        where: { id: researchId },
        data: {
          status: 'FAILED',
          failure: errorMessage(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  listRuns(workspaceId: string) {
    return this.prisma.historicalResearchRun.findMany({
      where: { workspaceId },
      orderBy: { startedAt: 'desc' },
      include: { _count: { select: { results: true } } },
    });
  }

  async getRun(workspaceId: string, researchId: string) {
    const run = await this.prisma.historicalResearchRun.findFirst({
      where: { id: researchId, workspaceId },
      include: { results: { orderBy: { createdAt: 'asc' } } },
    });
    if (!run) throw new NotFoundException(`Historical research ${researchId} not found`);
    return run;
  }

  async getReport(workspaceId: string, researchId: string) {
    const run = await this.getRun(workspaceId, researchId);
    if (!run.report) throw new NotFoundException(`Research report ${researchId} is not available`);
    return run.report;
  }

  listResults(workspaceId: string, filter: HistoricalResultFilter = {}) {
    return this.prisma.historicalResearchResult.findMany({
      where: {
        workspaceId,
        strategyId: filter.strategyId,
        datasetId: filter.datasetId,
        marketRegime: filter.marketRegime,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveDatasets(input: RunHistoricalResearchInput) {
    const requested = uniqueNonEmpty(input.datasetIds);
    if (input.allDatasets && requested.length > 0) {
      throw new BadRequestException('Use either allDatasets or datasetIds, not both');
    }
    if (!input.allDatasets && requested.length === 0) {
      throw new BadRequestException('datasetIds are required unless allDatasets is true');
    }
    const datasets = input.allDatasets
      ? await this.datasets.listEnabled()
      : await this.datasets.getMany(requested);
    if (datasets.length === 0) throw new BadRequestException('No enabled datasets selected');
    const found = new Set(datasets.map((dataset) => dataset.id));
    const missing = requested.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Datasets not found: ${missing.join(', ')}`);
    }
    const disabled = datasets.filter((dataset) => !dataset.enabled);
    if (disabled.length > 0) {
      throw new BadRequestException(
        `Datasets are disabled: ${disabled.map((dataset) => dataset.id).join(', ')}`,
      );
    }
    return datasets;
  }

  private async resolveStrategies(input: RunHistoricalResearchInput): Promise<Strategy[]> {
    const available = await this.strategies.listByWorkspace(input.workspaceId);
    const requested = uniqueNonEmpty(input.strategyIds);
    if (requested.length === 0) {
      const active = available.filter((strategy) => strategy.status === 'active');
      if (active.length === 0) throw new BadRequestException('No active strategies available');
      return active;
    }
    const requestedSet = new Set(requested);
    const selected = available.filter((strategy) => requestedSet.has(strategy.id));
    const found = new Set(selected.map((strategy) => strategy.id));
    const missing = requested.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Strategies not found: ${missing.join(', ')}`);
    }
    return selected;
  }
}

function toHistoricalDataset(dataset: {
  id: string;
  displayName: string;
  description: string;
  marketRegime: string;
  symbol: string;
  symbols: string[];
  timeframe: string;
  exchange: string;
  enabled: boolean;
  contentHash: string;
  startTime: Date;
  endTime: Date;
}): HistoricalDataset {
  return Object.freeze({
    datasetId: dataset.id,
    displayName: dataset.displayName || `${dataset.symbol} ${dataset.timeframe} historical dataset`,
    description: dataset.description,
    marketRegime: isMarketRegime(dataset.marketRegime) ? dataset.marketRegime : 'UNCLASSIFIED',
    exchange: dataset.exchange,
    symbols: Object.freeze(dataset.symbols.length > 0 ? [...dataset.symbols] : [dataset.symbol]),
    timeframe: dataset.timeframe,
    startDate: dataset.startTime.toISOString(),
    endDate: dataset.endTime.toISOString(),
    enabled: dataset.enabled,
    contentHash: dataset.contentHash,
  });
}

function buildReport(
  researchId: string,
  datasets: readonly HistoricalDataset[],
  results: readonly {
    datasetId: string;
    datasetName: string;
    marketRegime: string;
    strategyId: string;
    strategyName: string;
    tradeCount: number;
    winRate: number;
    netProfit: number;
    maxDrawdown: number;
    status: string;
  }[],
): HistoricalResearchReport {
  const strategies = new Map(
    results.map((result) => [
      result.strategyId,
      { strategyId: result.strategyId, name: result.strategyName },
    ]),
  );
  const completed = results.filter((result) => result.status === 'COMPLETED');
  return Object.freeze({
    researchId,
    datasets: datasets.map((dataset) => ({
      datasetId: dataset.datasetId,
      displayName: dataset.displayName,
      marketRegime: dataset.marketRegime,
    })),
    strategiesExecuted: [...strategies.values()],
    statistics: {
      resultCount: results.length,
      datasetCount: new Set(results.map((result) => result.datasetId)).size,
      strategyCount: strategies.size,
      totalTrades: completed.reduce((sum, result) => sum + result.tradeCount, 0),
    },
    performanceMetrics: {
      netProfit: round8(completed.reduce((sum, result) => sum + result.netProfit, 0)),
      averageWinRate:
        completed.length > 0
          ? round8(completed.reduce((sum, result) => sum + result.winRate, 0) / completed.length)
          : 0,
      worstMaxDrawdown: Math.max(0, ...completed.map((result) => result.maxDrawdown)),
    },
    validationSummary: {
      passed: results.length > 0 && completed.length === results.length,
      passedResults: completed.length,
      failedResults: results.length - completed.length,
    },
  });
}

function uniqueNonEmpty(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return structuredClone(value) as Prisma.InputJsonValue;
}

function hashFailure(dataset: HistoricalDataset, strategy: Strategy, failure: string): string {
  return createHash('sha256')
    .update(`${dataset.contentHash}::${strategy.id}::${failure}`)
    .digest('hex');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}
