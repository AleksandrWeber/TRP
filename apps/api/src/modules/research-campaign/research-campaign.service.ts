import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import type { PipelineContext } from '../pipeline/pipeline-context';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { readExperiments, readSummary } from '../pipeline/steps/campaign/campaign-context';
import type { CampaignReport, CampaignReportExperiment } from './campaign-report.types';
import type { CampaignSummary, ResearchCampaignInput } from './research-campaign.types';

export type ResearchCampaignResult = {
  summary: CampaignSummary;
  experiments: CampaignReportExperiment[];
  /** Present only when the campaign ran with a SliceRef. */
  sliceIdentity?: string;
};

/**
 * Campaign orchestrator (US088).
 * Delegates execution to PipelineExecutor + Campaign PipelineSteps.
 * Preserves the public run() contract and persistence/error behavior.
 */
@Injectable()
export class ResearchCampaignService {
  constructor(
    @Inject(PipelineExecutor)
    private readonly executor: PipelineExecutor,
    @Inject(PipelineTemplateService)
    private readonly templates: PipelineTemplateService,
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
    @Inject(CampaignSessionFactory)
    private readonly sessionFactory: CampaignSessionFactory,
    @Inject(CampaignPersistenceService)
    private readonly persistence: CampaignPersistenceService,
  ) {}

  async run(
    input: ResearchCampaignInput,
    options?: { persistSession?: boolean },
  ): Promise<ResearchCampaignResult> {
    const persistSession = options?.persistSession !== false;

    try {
      const pipeline = this.templates.createPipelineFromTemplate(
        BUILTIN_PIPELINE_TEMPLATE_IDS.campaign,
      );
      if (!pipeline) {
        throw new Error('Campaign pipeline template is not registered');
      }

      const run = this.pipelines.createRun({ pipelineId: pipeline.pipelineId });
      if (!run) {
        throw new Error(`Failed to create PipelineRun for ${pipeline.pipelineId}`);
      }

      const context = createCampaignPipelineContext(input, persistSession);
      const pipelineResult = await this.executor.execute(pipeline, context, run);

      if (!pipelineResult.success) {
        throw new Error(pipelineResult.error ?? 'Campaign pipeline failed');
      }

      return toCampaignResult(pipelineResult.context);
    } catch (error) {
      const report = this.buildFailedExecutionReport(input);
      if (persistSession) {
        this.persistSession(report, CampaignSessionStatus.FAILED, input.datasetId);
      }
      throw error;
    }
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
}

function createCampaignPipelineContext(
  input: ResearchCampaignInput,
  persistSession: boolean,
): PipelineContext {
  const contextInput: Record<string, unknown> = {
    datasetId: input.datasetId,
    strategyId: input.strategyId,
    paramsList: input.paramsList,
    persistSession,
  };

  if (input.sliceRef !== undefined) {
    contextInput.sliceRef = input.sliceRef;
  }

  return {
    input: contextInput,
    output: {},
    variables: {},
    metadata: {},
  };
}

function toCampaignResult(context: PipelineContext): ResearchCampaignResult {
  const summary = readSummary(context);
  const experiments = readExperiments(context);
  const result: ResearchCampaignResult = { summary, experiments };

  const sliceIdentity =
    context.output.sliceIdentity !== undefined
      ? context.output.sliceIdentity
      : context.variables.sliceIdentity;

  if (sliceIdentity !== undefined) {
    result.sliceIdentity = String(sliceIdentity);
  }

  return result;
}
