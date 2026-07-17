import type { CampaignPersistenceService } from '../../../campaign-persistence/campaign-persistence.service';
import type { CampaignSessionFactory } from '../../../campaign-session/campaign-session.factory';
import type { ExperimentsService } from '../../../experiments/experiments.service';
import type { CampaignReportService } from '../../../research-campaign/campaign-report.service';
import type { PipelineRegistry } from '../../pipeline-registry';
import { AggregateResultStep } from './aggregate-result.step';
import { BuildReportStep } from './build-report.step';
import { ExecuteResearchStep } from './execute-research.step';
import { PersistCampaignStep } from './persist-campaign.step';
import { PrepareCampaignStep } from './prepare-campaign.step';

export type CampaignPipelineStepDeps = {
  experiments: ExperimentsService;
  reports: CampaignReportService;
  sessionFactory: CampaignSessionFactory;
  persistence: CampaignPersistenceService;
};

/**
 * Registers Campaign PipelineStep implementations on a PipelineRegistry (US087).
 * Does not execute pipelines — registration only.
 */
export function registerCampaignPipelineSteps(
  registry: PipelineRegistry,
  deps: CampaignPipelineStepDeps,
): void {
  registry.register(new PrepareCampaignStep());
  registry.register(new ExecuteResearchStep(deps.experiments));
  registry.register(new AggregateResultStep());
  registry.register(new BuildReportStep(deps.reports));
  registry.register(new PersistCampaignStep(deps.sessionFactory, deps.persistence));
}
