import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AnalyzeCampaignBodyDto } from '../../validation';
import { ResearchAnalysisService } from './research-analysis.service';

@Controller({ path: 'campaigns', version: '1' })
export class ResearchAnalysisController {
  constructor(private readonly analysis: ResearchAnalysisService) {}

  @Post('analyze')
  analyze(@Body() body: AnalyzeCampaignBodyDto) {
    if (!body.campaignSummary) {
      throw new BadRequestException('campaignSummary is required');
    }

    return this.analysis.analyzeCampaignSummary(body.campaignSummary);
  }
}
