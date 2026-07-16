import { Module } from '@nestjs/common';
import { ExperimentsModule } from '../experiments/experiments.module';
import { CampaignReportService } from './campaign-report.service';
import { ResearchCampaignController } from './research-campaign.controller';
import { ResearchCampaignService } from './research-campaign.service';

@Module({
  imports: [ExperimentsModule],
  controllers: [ResearchCampaignController],
  providers: [ResearchCampaignService, CampaignReportService],
  exports: [ResearchCampaignService, CampaignReportService],
})
export class ResearchCampaignModule {}
