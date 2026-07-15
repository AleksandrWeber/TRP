import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_BACKTEST_CONFIG,
  DEFAULT_EMA_CROSSOVER_PARAMS,
  hashConfig,
  runBacktest,
  runExperiment,
  STRATEGY_ID,
  STRATEGY_VERSION,
  validateBacktest,
} from '@trp/research';
import { getGitCommit } from '../../common/git';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { DatasetsService } from '../datasets/datasets.service';

@Injectable()
export class ExperimentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasetsService: DatasetsService,
  ) {}

  async run(datasetId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) {
      throw new NotFoundException(`Dataset ${datasetId} not found`);
    }

    const bars = await this.datasetsService.getBars(datasetId);
    const config = {
      strategyId: STRATEGY_ID,
      strategyVersion: STRATEGY_VERSION,
      params: DEFAULT_EMA_CROSSOVER_PARAMS,
      backtest: DEFAULT_BACKTEST_CONFIG,
    };

    const backtest = runBacktest(bars, config.params, config.backtest);
    const validation = validateBacktest(backtest.metrics);
    const report = runExperiment(bars, config);
    const configHash = hashConfig(config);

    const experiment = await this.prisma.experiment.create({
      data: {
        datasetId,
        strategyId: config.strategyId,
        strategyVersion: config.strategyVersion,
        configHash,
        gitCommit: getGitCommit(),
        verdict: validation.verdict,
        report,
        metrics: backtest.metrics,
        validation,
        trades: backtest.trades,
      },
      include: {
        dataset: {
          select: {
            symbol: true,
            timeframe: true,
            contentHash: true,
            barCount: true,
          },
        },
      },
    });

    return experiment;
  }

  list() {
    return this.prisma.experiment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        dataset: {
          select: { symbol: true, timeframe: true, contentHash: true },
        },
        deployment: {
          select: { id: true, status: true, mode: true },
        },
      },
    });
  }

  async get(id: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
      include: {
        dataset: true,
      },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    return experiment;
  }
}
