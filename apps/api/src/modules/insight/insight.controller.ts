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
import type { Insight } from './insight';
import { InsightDomainService } from './insight-domain.service';
import { InsightType } from './insight-type';

const SORT_BY = ['createdAt', 'type', 'confidence', 'title'] as const;

/**
 * Read-only Insight REST adapter (US100).
 * Does not extract / generate Insights — Domain Service search / getById only.
 */
@Controller('insights')
export class InsightController {
  constructor(private readonly insights: InsightDomainService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('type') type?: string,
    @Query('campaignSessionId') campaignSessionId?: string,
    @Query('experimentId') experimentId?: string,
  ): HistoryPage<Insight> {
    const pageRequest = parseApiPageRequest(
      { page, pageSize, sortBy, sortOrder },
      {
        allowedSortBy: SORT_BY,
        defaultSortBy: 'createdAt',
        badRequest: (message) => new BadRequestException(message),
      },
    );

    const filters = {
      ...(type !== undefined && type !== '' ? { type: parseInsightType(type) } : {}),
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
      ...(experimentId !== undefined && experimentId !== '' ? { experimentId } : {}),
    };

    const items = this.insights.search(filters);
    return toHistoryPage(items, pageRequest, insightSortValue);
  }

  @Get(':id')
  getById(@Param('id') id: string): Insight {
    const insight = this.insights.getById(id);
    if (!insight) {
      throw new NotFoundException(`Insight ${id} not found`);
    }
    return insight;
  }
}

function parseInsightType(value: string): InsightType {
  if (!Object.values(InsightType).includes(value as InsightType)) {
    throw new BadRequestException(`type must be one of: ${Object.values(InsightType).join(', ')}`);
  }
  return value as InsightType;
}

function insightSortValue(insight: Insight, field: string): string | number {
  if (field === 'type') return insight.type;
  if (field === 'confidence') return insight.confidence;
  if (field === 'title') return insight.title.toLowerCase();
  return insight.createdAt;
}
