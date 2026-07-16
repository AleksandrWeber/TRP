import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ExperimentsService } from '../experiments/experiments.service';
import type { CampaignReportExperiment } from './campaign-report.types';
import type { CampaignSummary, ResearchCampaignInput } from './research-campaign.types';

type ExperimentLike = {
  id: string;
  verdict: string;
  metrics?: {
    profitFactor?: number;
    totalReturnPercent?: number;
    expectancy?: number;
    maxDrawdownPercent?: number;
  } | null;
  report?: { params?: Record<string, unknown> } | null;
};

export type ResearchCampaignResult = {
  summary: CampaignSummary;
  experiments: CampaignReportExperiment[];
};

@Injectable()
export class ResearchCampaignService {
  private readonly logger = new Logger(ResearchCampaignService.name);

  constructor(private readonly experiments: ExperimentsService) {}

  async run(input: ResearchCampaignInput): Promise<ResearchCampaignResult> {
    const campaignId = randomUUID();
    const createdAt = new Date().toISOString();

    let passCount = 0;
    let failCount = 0;
    let needsReviewCount = 0;
    let bestExperimentId: string | null = null;
    let bestProfitFactor = Number.NEGATIVE_INFINITY;
    const failedRuns: CampaignSummary['failedRuns'] = [];
    const experiments: CampaignReportExperiment[] = [];

    for (const params of input.paramsList) {
      try {
        const experiment = (await this.experiments.run(
          input.datasetId,
          input.strategyId,
          params,
        )) as ExperimentLike;

        experiments.push({
          id: experiment.id,
          verdict: experiment.verdict,
          metrics: experiment.metrics ?? null,
          report: experiment.report ?? { params },
        });

        if (experiment.verdict === 'pass') passCount += 1;
        else if (experiment.verdict === 'needs_review') needsReviewCount += 1;
        else failCount += 1;

        const profitFactor = experiment.metrics?.profitFactor;
        if (typeof profitFactor === 'number' && profitFactor > bestProfitFactor) {
          bestProfitFactor = profitFactor;
          bestExperimentId = experiment.id;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Campaign ${campaignId} run failed for params ${JSON.stringify(params)}: ${message}`,
        );
        failedRuns.push({ params, error: message });
      }
    }

    const summary: CampaignSummary = {
      campaignId,
      strategyId: input.strategyId,
      datasetId: input.datasetId,
      totalRuns: input.paramsList.length,
      passCount,
      failCount,
      needsReviewCount,
      bestExperimentId,
      createdAt,
      failedRuns,
    };

    this.logger.log(
      `Campaign ${campaignId} finished: ${summary.passCount} pass / ${summary.failCount} fail / ${summary.needsReviewCount} needs_review / ${failedRuns.length} errors`,
    );

    return { summary, experiments };
  }
}
