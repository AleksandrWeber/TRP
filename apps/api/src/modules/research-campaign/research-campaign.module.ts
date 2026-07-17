import { Module } from '@nestjs/common';
import { CampaignPersistenceModule } from '../campaign-persistence/campaign-persistence.module';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { ExperimentsModule } from '../experiments/experiments.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { CampaignController } from './campaign.controller';
import { CampaignReportService } from './campaign-report.service';
import { MultiDatasetCampaignService } from './multi-dataset-campaign.service';
import { ResearchCampaignController } from './research-campaign.controller';
import { ResearchCampaignService } from './research-campaign.service';
import { WalkForwardAnalysisService } from './walk-forward-analysis.service';
import { WalkForwardCampaignService } from './walk-forward-campaign.service';

@Module({
  imports: [ExperimentsModule, CampaignPersistenceModule, PipelineModule],
  controllers: [ResearchCampaignController, CampaignController],
  providers: [
    ResearchCampaignService,
    CampaignReportService,
    CampaignSessionFactory,
    MultiDatasetCampaignService,
    WalkForwardCampaignService,
    WalkForwardAnalysisService,
  ],
  exports: [
    ResearchCampaignService,
    CampaignReportService,
    MultiDatasetCampaignService,
    WalkForwardCampaignService,
    WalkForwardAnalysisService,
  ],
})
export class ResearchCampaignModule {}
