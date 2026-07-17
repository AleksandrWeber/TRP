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
import type { Recommendation } from './recommendation';
import { RecommendationDomainService } from './recommendation-domain.service';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';

const SORT_BY = ['createdAt', 'type', 'priority', 'title'] as const;

/**
 * Read-only Recommendation REST adapter (US100).
 * Does not generate Recommendations — Domain Service search / getById only.
 */
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendations: RecommendationDomainService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
  ): HistoryPage<Recommendation> {
    const pageRequest = parseApiPageRequest(
      { page, pageSize, sortBy, sortOrder },
      {
        allowedSortBy: SORT_BY,
        defaultSortBy: 'createdAt',
        badRequest: (message) => new BadRequestException(message),
      },
    );

    const filters = {
      ...(type !== undefined && type !== '' ? { type: parseRecommendationType(type) } : {}),
      ...(priority !== undefined && priority !== ''
        ? { priority: parseRecommendationPriority(priority) }
        : {}),
    };

    const items = this.recommendations.search(filters);
    return toHistoryPage(items, pageRequest, recommendationSortValue);
  }

  @Get(':id')
  getById(@Param('id') id: string): Recommendation {
    const recommendation = this.recommendations.getById(id);
    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} not found`);
    }
    return recommendation;
  }
}

function parseRecommendationType(value: string): RecommendationType {
  if (!Object.values(RecommendationType).includes(value as RecommendationType)) {
    throw new BadRequestException(
      `type must be one of: ${Object.values(RecommendationType).join(', ')}`,
    );
  }
  return value as RecommendationType;
}

function parseRecommendationPriority(value: string): RecommendationPriority {
  if (!Object.values(RecommendationPriority).includes(value as RecommendationPriority)) {
    throw new BadRequestException(
      `priority must be one of: ${Object.values(RecommendationPriority).join(', ')}`,
    );
  }
  return value as RecommendationPriority;
}

function recommendationSortValue(recommendation: Recommendation, field: string): string | number {
  if (field === 'type') return recommendation.type;
  if (field === 'priority') return recommendation.priority;
  if (field === 'title') return recommendation.title.toLowerCase();
  return recommendation.createdAt;
}
