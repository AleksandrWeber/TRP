import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { StrategyParams } from '@trp/research';
import { MultiDatasetCampaignService } from './multi-dataset-campaign.service';
import { ResearchCampaignService } from './research-campaign.service';
import { WalkForwardCampaignService } from './walk-forward-campaign.service';

@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaigns: ResearchCampaignService,
    private readonly multiDatasetCampaigns: MultiDatasetCampaignService,
    private readonly walkForwardCampaigns: WalkForwardCampaignService,
  ) {}

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

  @Post('run-multi')
  async runMulti(
    @Body()
    body: {
      strategyId?: string;
      datasets?: string[];
      paramsList?: StrategyParams[];
    },
  ) {
    if (!body.strategyId) {
      throw new BadRequestException('strategyId is required');
    }
    if (!Array.isArray(body.datasets) || body.datasets.length === 0) {
      throw new BadRequestException('datasets must be a non-empty array');
    }
    if (!Array.isArray(body.paramsList) || body.paramsList.length === 0) {
      throw new BadRequestException('paramsList must be a non-empty array');
    }

    return this.multiDatasetCampaigns.run({
      strategyId: body.strategyId,
      datasets: body.datasets,
      paramsList: body.paramsList,
    });
  }

  @Post('run-walk-forward')
  async runWalkForward(
    @Body()
    body: {
      datasetId?: string;
      strategyId?: string;
      paramsList?: StrategyParams[];
      datasetLength?: number;
      windowSize?: number;
      stepSize?: number;
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
    if (!Number.isFinite(body.datasetLength) || (body.datasetLength as number) <= 0) {
      throw new BadRequestException('datasetLength must be a positive number');
    }
    if (!Number.isFinite(body.windowSize) || (body.windowSize as number) <= 0) {
      throw new BadRequestException('windowSize must be a positive number');
    }
    if (!Number.isFinite(body.stepSize) || (body.stepSize as number) <= 0) {
      throw new BadRequestException('stepSize must be a positive number');
    }

    return this.walkForwardCampaigns.run({
      datasetId: body.datasetId,
      strategyId: body.strategyId,
      paramsList: body.paramsList,
      datasetLength: body.datasetLength as number,
      windowSize: body.windowSize as number,
      stepSize: body.stepSize as number,
    });
  }
}
