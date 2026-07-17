import type { PipelineContext } from '../../pipeline-context';
import type { CampaignSession } from '../../../campaign-session/campaign-session';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';
import type { ResearchCampaignResult } from '../../../research-campaign/research-campaign.service';
import type { ReplayCampaignConfig } from '../../../campaign-replay/replay-campaign-config';
import type { ReplayResult } from '../../../campaign-replay/replay-result';

/**
 * Typed accessors for Replay PipelineContext payloads (US089).
 * Context remains structurally generic — helpers only cast known keys.
 */

export function readReplaySession(context: PipelineContext): CampaignSession {
  return context.input.session as CampaignSession;
}

export function writeReplaySession(
  context: PipelineContext,
  session: CampaignSession,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      session,
    },
  };
}

export function readLoadedSession(context: PipelineContext): CampaignSession {
  return (context.variables.session ?? context.input.session) as CampaignSession;
}

export type ReplayExecutionState = {
  replayId: string;
  startedAt: string;
  sourceSessionId: string;
  campaignConfig: ReplayCampaignConfig;
  sourceReport: CampaignReport;
  executeFailed: boolean;
  campaignResult?: ResearchCampaignResult;
};

export function readReplayExecutionState(context: PipelineContext): ReplayExecutionState {
  return {
    replayId: String(context.variables.replayId ?? ''),
    startedAt: String(context.variables.startedAt ?? ''),
    sourceSessionId: String(context.variables.sourceSessionId ?? ''),
    campaignConfig: context.variables.campaignConfig as ReplayCampaignConfig,
    sourceReport: context.variables.sourceReport as CampaignReport,
    executeFailed: context.variables.executeFailed === true,
    campaignResult: context.variables.campaignResult as ResearchCampaignResult | undefined,
  };
}

export function writeReplayExecutionState(
  context: PipelineContext,
  state: Partial<ReplayExecutionState>,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      ...state,
    },
  };
}

export function readReplayResult(context: PipelineContext): ReplayResult {
  return context.output.replayResult as ReplayResult;
}
