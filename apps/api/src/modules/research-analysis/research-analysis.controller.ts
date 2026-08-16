import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AnalyzeCampaignBodyDto } from '../../validation';
import { ResearchAnalysisService } from './research-analysis.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'campaigns', version: '1' })
@RequirePermission(PermissionClass.Research)
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
