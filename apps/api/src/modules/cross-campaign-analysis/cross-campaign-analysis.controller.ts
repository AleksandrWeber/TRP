import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { parseApiPageRequest, toHistoryPage } from '../../common/api-list/api-list';
import type { HistoryPage } from '../campaign-persistence/history-page';
import type { CrossCampaignAnalysisResult } from './cross-campaign-analysis-result';
import { CrossCampaignAnalysisService } from './cross-campaign-analysis.service';

const SORT_BY = ['createdAt'] as const;

/**
 * Read-only Cross-Campaign Analysis REST adapter (US100).
 * Does not execute analysis pipelines — service search / getById only.
 */
@Controller('cross-campaign-analysis')
export class CrossCampaignAnalysisController {
  constructor(private readonly analyses: CrossCampaignAnalysisService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('campaignSessionId') campaignSessionId?: string,
  ): HistoryPage<CrossCampaignAnalysisResult> {
    const pageRequest = parseApiPageRequest(
      { page, pageSize, sortBy, sortOrder },
      {
        allowedSortBy: SORT_BY,
        defaultSortBy: 'createdAt',
        badRequest: (message) => new BadRequestException(message),
      },
    );

    const filters = {
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
    };

    const items = this.analyses.search(filters);
    return toHistoryPage(items, pageRequest, (item, _field) => item.createdAt);
  }

  @Get(':id')
  getById(@Param('id') id: string): CrossCampaignAnalysisResult {
    const analysis = this.analyses.getById(id);
    if (!analysis) {
      throw new NotFoundException(`Cross-campaign analysis ${id} not found`);
    }
    return analysis;
  }
}
