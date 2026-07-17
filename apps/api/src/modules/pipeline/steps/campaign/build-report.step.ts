import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { CampaignReportService } from '../../../research-campaign/campaign-report.service';
import { readExperiments, readExecutionState, readSummary } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA } from './campaign-step-metadata';

/**
 * Campaign stage: build CampaignReport via CampaignReportService (US087).
 * Extracted from ResearchCampaignService.run report build.
 */
export class BuildReportStep extends AbstractPipelineStep {
  constructor(private readonly reports: CampaignReportService) {
    super(CAMPAIGN_PIPELINE_STEP_METADATA.buildReport);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const summary = readSummary(context);
    const experiments = readExperiments(context);
    const state = readExecutionState(context);

    const report = this.reports.build(summary, experiments, {
      sliceIdentity: state.sliceIdentity,
    });

    return {
      ...context,
      output: {
        ...context.output,
        report,
      },
    };
  }
}
