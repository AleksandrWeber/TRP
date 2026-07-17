import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { CampaignPersistenceModule } from '../campaign-persistence/campaign-persistence.module';
import { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { ExperimentsModule } from '../experiments/experiments.module';
import { ExperimentsService } from '../experiments/experiments.service';
import { CampaignReportService } from '../research-campaign/campaign-report.service';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineExecutor } from './pipeline-executor';
import { PipelineHookRegistry, pipelineHookRegistry } from './pipeline-hook-registry';
import { PipelineRegistry, pipelineRegistry } from './pipeline-registry';
import { PipelineTemplateService } from './pipeline-template.service';
import { registerCampaignPipelineSteps } from './steps/campaign/register-campaign-steps';

/**
 * Generic Research Pipeline Nest module (US081–US097).
 * Domain + step registry + executor + hooks + templates + Campaign step registration.
 * Campaign / Replay / Knowledge / Insight / Cross-Campaign Analysis orchestrators execute via PipelineExecutor.
 */
@Module({
  imports: [ExperimentsModule, CampaignPersistenceModule],
  providers: [
    PipelineDomainService,
    PipelineTemplateService,
    CampaignReportService,
    CampaignSessionFactory,
    {
      provide: PipelineRegistry,
      useValue: pipelineRegistry,
    },
    {
      provide: PipelineHookRegistry,
      useValue: pipelineHookRegistry,
    },
    PipelineExecutor,
  ],
  exports: [
    PipelineDomainService,
    PipelineTemplateService,
    PipelineRegistry,
    PipelineHookRegistry,
    PipelineExecutor,
  ],
})
export class PipelineModule implements OnModuleInit {
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
  ) {}

  onModuleInit(): void {
    // Idempotent: skip if Campaign steps already registered (e.g. hot reload).
    if (this.registry.get('campaign.prepare')) return;

    registerCampaignPipelineSteps(this.registry, {
      experiments: this.experiments,
      reports: this.reports,
      sessionFactory: this.sessionFactory,
      persistence: this.persistence,
    });
  }
}
