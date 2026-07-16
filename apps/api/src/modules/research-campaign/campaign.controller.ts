import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { StrategyParams } from '@trp/research';
import { ResearchCampaignService } from './research-campaign.service';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaigns: ResearchCampaignService) {}

  @Post('run')
  async run(
    @Body()
    body: {
      datasetId?: string;
      strategyId?: string;
      paramsList?: StrategyParams[];
    },
  ) {
    if (!body.datasetId) {
      throw new BadRequestException('datasetId is required');
    }
    if (!body.strategyId) {
      throw new BadRequestException('strategyId is required');
    }
    if (!Array.isArray(body.paramsList) || body.paramsList.length === 0) {
      throw new BadRequestException('paramsList must be a non-empty array');
    }

    const { summary } = await this.campaigns.run({
      datasetId: body.datasetId,
      strategyId: body.strategyId,
      paramsList: body.paramsList,
    });

    return summary;
  }
}
