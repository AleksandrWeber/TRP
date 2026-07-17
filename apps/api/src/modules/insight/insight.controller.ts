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
import { IdParamDto, ListInsightQueryDto } from '../../validation';
import type { HistoryPage } from '../campaign-persistence/history-page';
import { WorkspaceDomainService } from '../workspace';
import type { Insight } from './insight';
import { InsightDomainService } from './insight-domain.service';
import { InsightType } from './insight-type';

const SORT_BY = ['createdAt', 'type', 'confidence', 'title'] as const;

/**
 * Read-only Insight REST adapter (US100).
 * Does not extract / generate Insights — Domain Service search / getById only.
 * Scoped by X-Workspace-Id (US109).
 */
@Controller({ path: 'insights', version: '1' })
export class InsightController {
  constructor(
    private readonly insights: InsightDomainService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  list(
    @Query() query: ListInsightQueryDto = {},
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): HistoryPage<Insight> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const pageRequest = parseApiPageRequest(query, {
      allowedSortBy: SORT_BY,
      defaultSortBy: 'createdAt',
      badRequest: (message) => new BadRequestException(message),
    });

    const { type, campaignSessionId, experimentId } = query;
    const filters = {
      ...(type !== undefined && (type as string) !== '' ? { type: parseInsightType(type) } : {}),
      ...(campaignSessionId !== undefined && campaignSessionId !== '' ? { campaignSessionId } : {}),
      ...(experimentId !== undefined && experimentId !== '' ? { experimentId } : {}),
    };

    const items = this.insights.search(filters, workspaceId);
    return toHistoryPage(items, pageRequest, insightSortValue);
  }

  @Get(':id')
  getById(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Insight {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const insight = this.insights.getById(params.id, workspaceId);
    if (!insight) {
      throw new NotFoundException(`Insight ${params.id} not found`);
    }
    return insight;
  }
}

function parseInsightType(value: InsightType | string): InsightType {
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
