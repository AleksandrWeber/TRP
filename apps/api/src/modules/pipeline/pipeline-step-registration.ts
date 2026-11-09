import type { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import type { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import type { ExperimentsService } from '../experiments/experiments.service';
import type { Logger } from '../../logging/logger';
import type { CampaignReportService } from '../research-campaign/campaign-report.service';
import type { PipelineRegistry } from './pipeline-registry';
import { registerCampaignPipelineSteps } from './steps/campaign/register-campaign-steps';

export type PipelineCampaignStepRegistrationDeps = {
  registry: PipelineRegistry;
  experiments: ExperimentsService;
  reports: CampaignReportService;
  sessionFactory: CampaignSessionFactory;
  persistence: CampaignPersistenceService;
  logger: Logger;
};

/**
 * Registers Campaign pipeline steps once.
 * Knowledge steps stay on KnowledgeModule. The campaign.prepare guard matches
 * the previous PipelineModule lifecycle check.
 */
export function registerPipelineCampaignSteps(deps: PipelineCampaignStepRegistrationDeps): void {
  if (deps.registry.get('campaign.prepare')) return;

  registerCampaignPipelineSteps(deps.registry, {
    experiments: deps.experiments,
    reports: deps.reports,
    sessionFactory: deps.sessionFactory,
    persistence: deps.persistence,
    logger: deps.logger,
  });
}
