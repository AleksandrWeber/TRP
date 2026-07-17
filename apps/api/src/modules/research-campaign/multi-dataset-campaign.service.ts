import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { ResearchCampaignService } from './research-campaign.service';
import type {
  MultiDatasetCampaignInput,
  MultiDatasetCampaignSummary,
} from './multi-dataset-campaign.types';

@Injectable()
export class MultiDatasetCampaignService {
  private readonly logger: Logger;

  constructor(
    @Inject(ResearchCampaignService) private readonly campaigns: ResearchCampaignService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(MultiDatasetCampaignService.name);
  }

  async run(input: MultiDatasetCampaignInput): Promise<MultiDatasetCampaignSummary> {
    const campaignSummaries: MultiDatasetCampaignSummary['campaignSummaries'] = [];
    const failedDatasetErrors: MultiDatasetCampaignSummary['failedDatasetErrors'] = [];

    let overallBestExperimentId: string | null = null;
    let overallBestProfitFactor: number | null = null;
    let bestPf = Number.NEGATIVE_INFINITY;

    for (const datasetId of input.datasets) {
      try {
        const { summary, experiments } = await this.campaigns.run({
          datasetId,
          strategyId: input.strategyId,
          paramsList: input.paramsList,
        });

        campaignSummaries.push(summary);

        for (const experiment of experiments) {
          const profitFactor = experiment.metrics?.profitFactor;
          if (typeof profitFactor === 'number' && profitFactor > bestPf) {
            bestPf = profitFactor;
            overallBestExperimentId = experiment.id;
            overallBestProfitFactor = profitFactor;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Multi-dataset campaign failed for dataset ${datasetId}: ${message}`, {
          datasetId,
        });
        failedDatasetErrors.push({ datasetId, error: message });
      }
    }

    return {
      totalDatasets: input.datasets.length,
      completedDatasets: campaignSummaries.length,
      failedDatasets: failedDatasetErrors.length,
      campaignSummaries,
      overallBestExperimentId,
      overallBestProfitFactor,
      failedDatasetErrors,
    };
  }
}
