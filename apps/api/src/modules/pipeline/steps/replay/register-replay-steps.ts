import type { CampaignReportService } from '../../../research-campaign/campaign-report.service';
import type { ResearchCampaignService } from '../../../research-campaign/research-campaign.service';
import type { PipelineRegistry } from '../../pipeline-registry';
import { ExecuteReplayCampaignStep } from './execute-replay-campaign.step';
import { FinalizeReplayStep } from './finalize-replay.step';
import { LoadReplaySessionStep } from './load-replay-session.step';
import { RestoreReplayContextStep } from './restore-replay-context.step';

export type ReplayPipelineStepDeps = {
  campaigns: ResearchCampaignService;
  reports: CampaignReportService;
};

/**
 * Registers Replay PipelineStep implementations on a PipelineRegistry (US089).
 * Does not execute pipelines — registration only.
 */
export function registerReplayPipelineSteps(
  registry: PipelineRegistry,
  deps: ReplayPipelineStepDeps,
): void {
  registry.register(new LoadReplaySessionStep());
  registry.register(new RestoreReplayContextStep());
  registry.register(new ExecuteReplayCampaignStep(deps.campaigns));
  registry.register(new FinalizeReplayStep(deps.reports));
}
