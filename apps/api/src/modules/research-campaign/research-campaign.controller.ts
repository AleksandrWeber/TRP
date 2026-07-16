import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { StrategyParams } from '@trp/research';
import { CampaignReportService } from './campaign-report.service';
import { ResearchCampaignService } from './research-campaign.service';

@Controller('research-campaigns')
export class ResearchCampaignController {
  constructor(
    private readonly campaigns: ResearchCampaignService,
    private readonly reports: CampaignReportService,
  ) {}

  @Post()
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

    const { summary, experiments } = await this.campaigns.run({
      datasetId: body.datasetId,
      strategyId: body.strategyId,
      paramsList: body.paramsList,
    });

    const report = this.reports.build(summary, experiments);

    return {
      summary,
      report,
      experimentIds: experiments.map((experiment) => experiment.id),
    };
  }
}
