import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import type { PipelineContext } from '../pipeline/pipeline-context';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { readReplayResult } from '../pipeline/steps/replay/replay-pipeline-context';
import {
  assertValidReplaySession,
  cloneReplayReport,
  restoreReplayCampaignConfig,
} from '../pipeline/steps/replay/replay-session.helpers';
import type { ReplayContext } from './replay-context';
import type { ReplayResult } from './replay-result';
import { ReplayStatus } from './replay-status';

/**
 * Replay orchestrator (US089).
 * execute() delegates to PipelineExecutor + Replay PipelineSteps.
 * create()/buildContext() remain sync preparation using the same extracted helpers.
 * No History/Persistence writes on execute (`persistSession: false` inside steps).
 */
@Injectable()
export class CampaignReplayService {
  constructor(
    @Inject(PipelineExecutor)
    private readonly executor: PipelineExecutor,
    @Inject(PipelineTemplateService)
    private readonly templates: PipelineTemplateService,
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
  ) {}

  create(session: CampaignSession): ReplayResult {
    const context = this.buildContext(session);
    return this.toReadyResult(context);
  }

  /**
   * Builds an in-memory ReplayContext (validate session → config + report copy).
   */
  buildContext(session: CampaignSession): ReplayContext {
    assertValidReplaySession(session);

    return {
      sourceSession: session,
      campaignConfig: restoreReplayCampaignConfig(session),
      report: cloneReplayReport(session.report),
    };
  }

  /**
   * Executes a transient replay via PipelineExecutor + Replay steps.
   * Status ends as COMPLETED | FAILED. No Repository / Persistence / History writes.
   */
  async execute(session: CampaignSession): Promise<ReplayResult> {
    // Preserve BadRequestException behavior before pipeline (executor swallows step throws).
    assertValidReplaySession(session);

    const pipeline = this.templates.createPipelineFromTemplate(
      BUILTIN_PIPELINE_TEMPLATE_IDS.replay,
    );
    if (!pipeline) {
      throw new Error('Replay pipeline template is not registered');
    }

    const run = this.pipelines.createRun({ pipelineId: pipeline.pipelineId });
    if (!run) {
      throw new Error(`Failed to create PipelineRun for ${pipeline.pipelineId}`);
    }

    const context: PipelineContext = {
      input: { session },
      output: {},
      variables: {},
      metadata: {},
    };

    const pipelineResult = await this.executor.execute(pipeline, context, run);

    if (!pipelineResult.success) {
      throw new Error(pipelineResult.error ?? 'Replay pipeline failed');
    }

    return readReplayResult(pipelineResult.context);
  }

  private toReadyResult(context: ReplayContext): ReplayResult {
    return {
      replayId: randomUUID(),
      startedAt: new Date().toISOString(),
      sourceSessionId: context.sourceSession.id,
      status: ReplayStatus.READY,
      campaignConfig: context.campaignConfig,
      report: context.report,
    };
  }
}
