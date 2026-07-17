import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readReplaySession, writeReplaySession } from './replay-pipeline-context';
import { assertValidReplaySession } from './replay-session.helpers';
import { REPLAY_PIPELINE_STEP_METADATA } from './replay-step-metadata';

/**
 * Replay stage: validate and load source CampaignSession (US089).
 * Extracted from CampaignReplayService.assertValidSession / buildContext prelude.
 */
export class LoadReplaySessionStep extends AbstractPipelineStep {
  constructor() {
    super(REPLAY_PIPELINE_STEP_METADATA.load);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const session = readReplaySession(context);
    assertValidReplaySession(session);
    return writeReplaySession(context, session);
  }
}
