import type { PipelineStepMetadata } from '../../pipeline-step-metadata';

/**
 * Replay Pipeline step metadata (US089).
 * Mirrors CampaignReplayService.execute stages — no new business logic.
 */
export const REPLAY_PIPELINE_STEP_METADATA = {
  load: {
    stepId: 'replay.load',
    name: 'Load Replay Session',
    description: 'Validate and load the source CampaignSession',
    order: 1,
  },
  restore: {
    stepId: 'replay.restore',
    name: 'Restore Replay Context',
    description: 'Restore campaign config and clone source report',
    order: 2,
  },
  execute: {
    stepId: 'replay.execute',
    name: 'Execute Replay Campaign',
    description: 'Re-run campaign via ResearchCampaignService (no persistence)',
    order: 3,
  },
  finalize: {
    stepId: 'replay.finalize',
    name: 'Finalize Replay',
    description: 'Build ReplayResult COMPLETED or FAILED',
    order: 4,
  },
} as const satisfies Record<string, PipelineStepMetadata>;

export const REPLAY_PIPELINE_STEPS: PipelineStepMetadata[] = [
  REPLAY_PIPELINE_STEP_METADATA.load,
  REPLAY_PIPELINE_STEP_METADATA.restore,
  REPLAY_PIPELINE_STEP_METADATA.execute,
  REPLAY_PIPELINE_STEP_METADATA.finalize,
];
