import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  RunCampaignBodyDto,
  RunMultiCampaignBodyDto,
  RunWalkForwardCampaignBodyDto,
} from '../../validation';
import { MultiDatasetCampaignService } from './multi-dataset-campaign.service';
import { ResearchCampaignService } from './research-campaign.service';
import { WalkForwardCampaignService } from './walk-forward-campaign.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type { CampaignReportExperiment } from './campaign-report.types';
import type { CampaignSummary } from './research-campaign.types';

export type CampaignCandidateParams = Record<string, string | number | boolean | null>;

/** One completed experiment, ranked for the campaign results page. */
export type CampaignCandidate = {
  rank: number;
  experimentId: string;
  params: CampaignCandidateParams;
  verdict: string;
  profitFactor: number | null;
  totalReturnPercent: number | null;
  expectancy: number | null;
  maxDrawdownPercent: number | null;
};

export type CampaignRunResponse = CampaignSummary & {
  candidates: CampaignCandidate[];
};

@Controller({ path: 'campaigns', version: '1' })
@RequirePermission(PermissionClass.Research)
export class CampaignController {
  constructor(
    private readonly campaigns: ResearchCampaignService,
    private readonly multiDatasetCampaigns: MultiDatasetCampaignService,
    private readonly walkForwardCampaigns: WalkForwardCampaignService,
  ) {}

  @Post('run')
  async run(@Body() body: RunCampaignBodyDto): Promise<CampaignRunResponse> {
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

    return {
      ...summary,
      candidates: rankCompletedCandidates(experiments),
    };
  }

  @Post('run-multi')
  async runMulti(@Body() body: RunMultiCampaignBodyDto) {
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
  async runWalkForward(@Body() body: RunWalkForwardCampaignBodyDto) {
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

/**
 * Rank completed experiments for display.
 * A profit factor can win only when it is a number strictly greater than the
 * running best, which starts at negative infinity in ExecuteResearchStep.
 * That accepts finite scores and positive infinity, and rejects missing
 * values, NaN, and negative infinity. Ties keep the earlier experiment.
 */
export function rankCompletedCandidates(
  experiments: readonly CampaignReportExperiment[],
): CampaignCandidate[] {
  const ranked = experiments.map((experiment, index) => ({
    experiment,
    index,
    score: comparableProfitFactor(experiment.metrics?.profitFactor),
  }));

  ranked.sort((left, right) => {
    if (left.score !== null && right.score !== null && left.score !== right.score) {
      return right.score - left.score;
    }
    if (left.score !== null && right.score === null) return -1;
    if (left.score === null && right.score !== null) return 1;
    return left.index - right.index;
  });

  return ranked.map(({ experiment }, index) => toCandidate(experiment, index + 1));
}

function comparableProfitFactor(value: unknown): number | null {
  if (typeof value !== 'number' || !(value > Number.NEGATIVE_INFINITY)) return null;
  return value;
}

function toCandidate(experiment: CampaignReportExperiment, rank: number): CampaignCandidate {
  return {
    rank,
    experimentId: experiment.id,
    params: readParams(experiment.report?.params),
    verdict: experiment.verdict,
    profitFactor: readMetric(experiment.metrics?.profitFactor),
    totalReturnPercent: readMetric(experiment.metrics?.totalReturnPercent),
    expectancy: readMetric(experiment.metrics?.expectancy),
    maxDrawdownPercent: readMetric(experiment.metrics?.maxDrawdownPercent),
  };
}

function readMetric(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function readParams(params: Record<string, unknown> | undefined): CampaignCandidateParams {
  if (params === undefined) return {};
  const result: CampaignCandidateParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'boolean' || value === null) {
      result[key] = value;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    }
  }
  return result;
}
