import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { buildSliceIdentity, type SliceRef } from '@trp/research';
import { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { ExperimentsService } from '../experiments/experiments.service';
import { CampaignReportService } from './campaign-report.service';
import type { CampaignReport, CampaignReportExperiment } from './campaign-report.types';
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
  report?: { params?: Record<string, unknown>; sliceIdentity?: string } | null;
};

export type ResearchCampaignResult = {
  summary: CampaignSummary;
  experiments: CampaignReportExperiment[];
  /** Present only when the campaign ran with a SliceRef. */
  sliceIdentity?: string;
};

@Injectable()
export class ResearchCampaignService {
  private readonly logger = new Logger(ResearchCampaignService.name);

  constructor(
    private readonly experiments: ExperimentsService,
    private readonly reports: CampaignReportService,
    private readonly sessionFactory: CampaignSessionFactory,
    private readonly persistence: CampaignPersistenceService,
  ) {}

  async run(input: ResearchCampaignInput): Promise<ResearchCampaignResult> {
    try {
      const result = await this.executeCampaign(input);
      const report = this.reports.build(result.summary, result.experiments, {
        sliceIdentity: result.sliceIdentity,
      });
      this.persistSession(report, CampaignSessionStatus.COMPLETED, input.datasetId);
      return result;
    } catch (error) {
      const report = this.buildFailedExecutionReport(input);
      this.persistSession(report, CampaignSessionStatus.FAILED, input.datasetId);
      throw error;
    }
  }

  private async executeCampaign(input: ResearchCampaignInput): Promise<ResearchCampaignResult> {
    const campaignId = randomUUID();
    const createdAt = new Date().toISOString();

    let passCount = 0;
    let failCount = 0;
    let needsReviewCount = 0;
    let bestExperimentId: string | null = null;
    let bestProfitFactor = Number.NEGATIVE_INFINITY;
    const failedRuns: CampaignSummary['failedRuns'] = [];
    const experiments: CampaignReportExperiment[] = [];

    const sliceRef = input.sliceRef;
    const sliceIdentity = sliceRef ? this.sliceIdentityFrom(sliceRef) : undefined;

    for (const params of input.paramsList) {
      try {
        const experiment = (await this.experiments.run(
          input.datasetId,
          input.strategyId,
          params,
          sliceRef,
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

    const result: ResearchCampaignResult = { summary, experiments };
    if (sliceIdentity !== undefined) {
      result.sliceIdentity = sliceIdentity;
    }
    return result;
  }

  private persistSession(
    report: CampaignReport,
    status: CampaignSessionStatus.COMPLETED | CampaignSessionStatus.FAILED,
    datasetId: string,
  ): void {
    const session = this.sessionFactory.create({
      report,
      metadata: { datasetId },
    });
    this.persistence.save({
      ...session,
      status,
      completedAt: new Date().toISOString(),
    });
  }

  private buildFailedExecutionReport(input: ResearchCampaignInput): CampaignReport {
    return {
      campaignId: randomUUID(),
      strategyId: input.strategyId,
      datasetId: input.datasetId,
      totalRuns: input.paramsList.length,
      passCount: 0,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: null,
      bestProfitFactor: null,
      bestReturn: null,
      bestExpectancy: null,
      lowestDrawdown: null,
      verdict: 'FAIL',
      recommendations: ['Campaign execution failed.'],
      createdAt: new Date().toISOString(),
    };
  }

  private sliceIdentityFrom(sliceRef: SliceRef): string {
    return buildSliceIdentity(
      sliceRef.datasetId,
      sliceRef.startIndex,
      sliceRef.endIndex,
      sliceRef.role,
    );
  }
}
