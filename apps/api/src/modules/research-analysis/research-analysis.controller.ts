import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { CampaignSummary } from '../research-campaign/research-campaign.types';
import { ResearchAnalysisService } from './research-analysis.service';

@Controller('campaigns')
export class ResearchAnalysisController {
  constructor(private readonly analysis: ResearchAnalysisService) {}

  @Post('analyze')
  analyze(
    @Body()
    body: {
      campaignSummary?: CampaignSummary;
    },
  ) {
    if (!body.campaignSummary) {
      throw new BadRequestException('campaignSummary is required');
    }

    return this.analysis.analyzeCampaignSummary(body.campaignSummary);
  }
}
