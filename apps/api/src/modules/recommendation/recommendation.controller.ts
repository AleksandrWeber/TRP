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
import { IdParamDto, ListRecommendationQueryDto } from '../../validation';
import type { HistoryPage } from '../campaign-persistence/history-page';
import { WorkspaceDomainService } from '../workspace';
import type { Recommendation } from './recommendation';
import { RecommendationDomainService } from './recommendation-domain.service';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';

const SORT_BY = ['createdAt', 'type', 'priority', 'title'] as const;

/**
 * Read-only Recommendation REST adapter (US100).
 * Does not generate Recommendations — Domain Service search / getById only.
 * Scoped by X-Workspace-Id (US109).
 */
@Controller({ path: 'recommendations', version: '1' })
export class RecommendationController {
  constructor(
    private readonly recommendations: RecommendationDomainService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  list(
    @Query() query: ListRecommendationQueryDto = {},
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): HistoryPage<Recommendation> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const pageRequest = parseApiPageRequest(query, {
      allowedSortBy: SORT_BY,
      defaultSortBy: 'createdAt',
      badRequest: (message) => new BadRequestException(message),
    });

    const { type, priority } = query;
    const filters = {
      ...(type !== undefined && (type as string) !== ''
        ? { type: parseRecommendationType(type) }
        : {}),
      ...(priority !== undefined && (priority as string) !== ''
        ? { priority: parseRecommendationPriority(priority) }
        : {}),
    };

    const items = this.recommendations.search(filters, workspaceId);
    return toHistoryPage(items, pageRequest, recommendationSortValue);
  }

  @Get(':id')
  getById(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Recommendation {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const recommendation = this.recommendations.getById(params.id, workspaceId);
    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${params.id} not found`);
    }
    return recommendation;
  }
}

function parseRecommendationType(value: RecommendationType | string): RecommendationType {
  if (!Object.values(RecommendationType).includes(value as RecommendationType)) {
    throw new BadRequestException(
      `type must be one of: ${Object.values(RecommendationType).join(', ')}`,
    );
  }
  return value as RecommendationType;
}

function parseRecommendationPriority(
  value: RecommendationPriority | string,
): RecommendationPriority {
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
