import { randomUUID } from 'node:crypto';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readLoadedSession, writeReplayExecutionState } from './replay-pipeline-context';
import { cloneReplayReport, restoreReplayCampaignConfig } from './replay-session.helpers';
import { REPLAY_PIPELINE_STEP_METADATA } from './replay-step-metadata';

/**
 * Replay stage: restore campaignConfig and clone source report (US089).
 * Extracted from CampaignReplayService.buildContext / execute RUNNING prelude.
 */
export class RestoreReplayContextStep extends AbstractPipelineStep {
  constructor() {
    super(REPLAY_PIPELINE_STEP_METADATA.restore);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const session = readLoadedSession(context);
    const campaignConfig = restoreReplayCampaignConfig(session);
    const sourceReport = cloneReplayReport(session.report);

    return writeReplayExecutionState(context, {
      replayId: randomUUID(),
      startedAt: new Date().toISOString(),
      sourceSessionId: session.id,
      campaignConfig,
      sourceReport,
      executeFailed: false,
    });
  }
}
