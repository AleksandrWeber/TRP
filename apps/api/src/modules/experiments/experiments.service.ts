import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_BACKTEST_CONFIG,
  defaultExperimentConfig,
  hashConfig,
  resolveSlice,
  resolveStrategy,
  runBacktest,
  runExperiment,
  type ExperimentReport,
  type SliceRef,
  type StrategyParams,
  validateBacktest,
} from '@trp/research';
import { getGitCommit } from '../../common/git';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { DatasetsService } from '../datasets/datasets.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { RESEARCH_ENGINE_VERSION, VALIDATION_VERSION } from '../knowledge/knowledge.version';

@Injectable()
export class ExperimentsService {
  private readonly logger = new Logger(ExperimentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly datasetsService: DatasetsService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async run(datasetId: string, strategyId?: string, params?: StrategyParams, sliceRef?: SliceRef) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) {
      throw new NotFoundException(`Dataset ${datasetId} not found`);
    }

    const bars = await this.datasetsService.getBars(datasetId);
    const baseConfig = defaultExperimentConfig(strategyId);
    const strategy = resolveStrategy(baseConfig.strategyId);
    const config = {
      ...baseConfig,
      params: strategy.normalizeParams(params ?? baseConfig.params),
      backtest: DEFAULT_BACKTEST_CONFIG,
    };

    const engineBars = sliceRef
      ? resolveSlice({
          datasetId: sliceRef.datasetId,
          startIndex: sliceRef.startIndex,
          endIndex: sliceRef.endIndex,
          role: sliceRef.role,
          bars,
        }).bars
      : bars;

    const backtest = runBacktest(engineBars, strategy, config.params, config.backtest);
    const validation = validateBacktest(backtest.metrics);
    const report = {
      ...runExperiment(bars, config, sliceRef),
      researchEngineVersion: RESEARCH_ENGINE_VERSION,
      validationVersion: VALIDATION_VERSION,
    } satisfies ExperimentReport;
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

    try {
      await this.knowledge.recordFromExperiment(experiment.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to record knowledge for experiment ${experiment.id}: ${message}`);
    }

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
