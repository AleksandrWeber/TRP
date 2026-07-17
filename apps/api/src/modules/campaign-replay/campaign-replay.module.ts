import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerReplayPipelineSteps } from '../pipeline/steps/replay/register-replay-steps';
import { CampaignReportService } from '../research-campaign/campaign-report.service';
import { ResearchCampaignModule } from '../research-campaign/research-campaign.module';
import { ResearchCampaignService } from '../research-campaign/research-campaign.service';
import { CampaignReplayService } from './campaign-replay.service';

/**
 * Campaign Replay Nest module (US066–US067, US089).
 * Prepares and executes transient replays via PipelineExecutor + Replay steps.
 * No HTTP API; no Persistence/History writes on execute (`persistSession: false`).
 */
@Module({
  imports: [ResearchCampaignModule, PipelineModule],
  providers: [CampaignReplayService],
  exports: [CampaignReplayService],
})
export class CampaignReplayModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(ResearchCampaignService)
    private readonly campaigns: ResearchCampaignService,
    @Inject(CampaignReportService)
    private readonly reports: CampaignReportService,
  ) {}

  onModuleInit(): void {
    if (this.registry.get('replay.load')) return;

    registerReplayPipelineSteps(this.registry, {
      campaigns: this.campaigns,
      reports: this.reports,
    });
  }
}
