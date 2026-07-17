import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { CampaignReportService } from '../../../research-campaign/campaign-report.service';
import type { ReplayResult } from '../../../campaign-replay/replay-result';
import { ReplayStatus } from '../../../campaign-replay/replay-status';
import { readReplayExecutionState } from './replay-pipeline-context';
import { REPLAY_PIPELINE_STEP_METADATA } from './replay-step-metadata';

/**
 * Replay stage: assemble ReplayResult COMPLETED | FAILED (US089).
 * Extracted from CampaignReplayService.execute success/failure result assembly.
 */
export class FinalizeReplayStep extends AbstractPipelineStep {
  constructor(private readonly reports: CampaignReportService) {
    super(REPLAY_PIPELINE_STEP_METADATA.finalize);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const state = readReplayExecutionState(context);
    const completedAt = new Date().toISOString();

    let replayResult: ReplayResult;

    if (state.executeFailed || !state.campaignResult) {
      replayResult = {
        replayId: state.replayId,
        sourceSessionId: state.sourceSessionId,
        startedAt: state.startedAt,
        completedAt,
        status: ReplayStatus.FAILED,
        campaignConfig: state.campaignConfig,
        report: state.sourceReport,
      };
    } else {
      const report = this.reports.build(
        state.campaignResult.summary,
        state.campaignResult.experiments,
        { sliceIdentity: state.campaignResult.sliceIdentity },
      );

      replayResult = {
        replayId: state.replayId,
        sourceSessionId: state.sourceSessionId,
        startedAt: state.startedAt,
        completedAt,
        status: ReplayStatus.COMPLETED,
        campaignConfig: state.campaignConfig,
        report,
      };
    }

    return {
      ...context,
      output: {
        ...context.output,
        replayResult,
      },
    };
  }
}
