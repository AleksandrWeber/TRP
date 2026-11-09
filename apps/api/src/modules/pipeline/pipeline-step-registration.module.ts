import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { CampaignPersistenceModule } from '../campaign-persistence/campaign-persistence.module';
import { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { ExperimentsModule } from '../experiments/experiments.module';
import { ExperimentsService } from '../experiments/experiments.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { CampaignReportService } from '../research-campaign/campaign-report.service';
import { PipelineModule } from './pipeline.module';
import { PipelineRegistry } from './pipeline-registry';
import { registerPipelineCampaignSteps } from './pipeline-step-registration';

/**
 * Registers Campaign pipeline steps outside PipelineModule (TD-009).
 * Imports Knowledge, Pipeline, and Experiments in one direction:
 * Experiments → Knowledge → Pipeline, with no edge back to Experiments.
 */
@Module({
  imports: [PipelineModule, KnowledgeModule, ExperimentsModule, CampaignPersistenceModule],
  providers: [CampaignReportService, CampaignSessionFactory],
})
export class PipelineStepRegistrationModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(ExperimentsService)
    private readonly experiments: ExperimentsService,
    @Inject(CampaignReportService)
    private readonly reports: CampaignReportService,
    @Inject(CampaignSessionFactory)
    private readonly sessionFactory: CampaignSessionFactory,
    @Inject(CampaignPersistenceService)
    private readonly persistence: CampaignPersistenceService,
    @Inject(LOGGER)
    private readonly logger: Logger,
  ) {}

  onModuleInit(): void {
    registerPipelineCampaignSteps({
      registry: this.registry,
      experiments: this.experiments,
      reports: this.reports,
      sessionFactory: this.sessionFactory,
      persistence: this.persistence,
      logger: this.logger,
    });
  }
}
