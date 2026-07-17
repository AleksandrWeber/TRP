import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { parseApiPageRequest, toHistoryPage } from '../../common/api-list/api-list';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { IdParamDto, ListCrossCampaignAnalysisQueryDto } from '../../validation';
import type { HistoryPage } from '../campaign-persistence/history-page';
import { WorkspaceDomainService } from '../workspace';
import type { CrossCampaignAnalysisResult } from './cross-campaign-analysis-result';
import { CrossCampaignAnalysisService } from './cross-campaign-analysis.service';

const SORT_BY = ['createdAt'] as const;

/**
 * Read-only Cross-Campaign Analysis REST adapter (US100).
 * Does not execute analysis pipelines — service search / getById only.
 * Scoped by X-Workspace-Id (US109).
 */
@Controller({ path: 'cross-campaign-analysis', version: '1' })
export class CrossCampaignAnalysisController {
  constructor(
    private readonly analyses: CrossCampaignAnalysisService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  list(
    @Query() query: ListCrossCampaignAnalysisQueryDto = {},
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): HistoryPage<CrossCampaignAnalysisResult> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const pageRequest = parseApiPageRequest(query, {
      allowedSortBy: SORT_BY,
      defaultSortBy: 'createdAt',
      badRequest: (message) => new BadRequestException(message),
    });

    const { campaignSessionId } = query;
    const filters = {
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
    };

    const items = this.analyses.search(filters, workspaceId);
    return toHistoryPage(items, pageRequest, (item, _field) => item.createdAt);
  }

  @Get(':id')
  getById(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): CrossCampaignAnalysisResult {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const analysis = this.analyses.getById(params.id, workspaceId);
    if (!analysis) {
      throw new NotFoundException(`Cross-campaign analysis ${params.id} not found`);
    }
    return analysis;
  }
}
