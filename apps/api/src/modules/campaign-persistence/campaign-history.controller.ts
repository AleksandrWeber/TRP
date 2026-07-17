import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignHistoryService } from './campaign-history.service';
import type { HistoryPageRequest, HistorySortBy, HistorySortDirection } from './history-page';
import type { HistoryQuery } from './history-query';

const SORT_BY: HistorySortBy[] = ['createdAt', 'completedAt', 'status'];
const SORT_DIRECTION: HistorySortDirection[] = ['ASC', 'DESC'];
const STATUSES = Object.values(CampaignSessionStatus);

@Controller('campaign-history')
export class CampaignHistoryController {
  constructor(private readonly history: CampaignHistoryService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDirection') sortDirection?: string,
    @Query('status') status?: string,
    @Query('engineVersion') engineVersion?: string,
    @Query('datasetId') datasetId?: string,
    @Query('tags') tags?: string | string[],
  ) {
    const pageRequest = this.toPageRequest({ page, pageSize, sortBy, sortDirection });
    const query = this.toHistoryQuery({ status, engineVersion, datasetId, tags });
    return this.history.search(query, pageRequest);
  }

  @Get(':sessionId')
  getById(@Param('sessionId') sessionId: string) {
    const session = this.history.getById(sessionId);
    if (!session) {
      throw new NotFoundException(`Campaign session ${sessionId} not found`);
    }
    return session;
  }

  private toPageRequest(input: {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: string;
  }): HistoryPageRequest {
    const page = parsePositiveInt(input.page, 1, 'page');
    const size = parsePositiveInt(input.pageSize, 20, 'pageSize');
    const sortBy = (input.sortBy ?? 'createdAt') as HistorySortBy;
    if (!SORT_BY.includes(sortBy)) {
      throw new BadRequestException(`sortBy must be one of: ${SORT_BY.join(', ')}`);
    }
    const sortDirection = (input.sortDirection ?? 'DESC') as HistorySortDirection;
    if (!SORT_DIRECTION.includes(sortDirection)) {
      throw new BadRequestException(`sortDirection must be one of: ${SORT_DIRECTION.join(', ')}`);
    }

    return { page, pageSize: size, sortBy, sortDirection };
  }

  private toHistoryQuery(input: {
    status?: string;
    engineVersion?: string;
    datasetId?: string;
    tags?: string | string[];
  }): HistoryQuery {
    const query: HistoryQuery = {};

    if (input.status !== undefined && input.status !== '') {
      if (!STATUSES.includes(input.status as CampaignSessionStatus)) {
        throw new BadRequestException(`status must be one of: ${STATUSES.join(', ')}`);
      }
      query.status = input.status as CampaignSessionStatus;
    }

    if (input.engineVersion !== undefined && input.engineVersion !== '') {
      query.engineVersion = input.engineVersion;
    }

    if (input.datasetId !== undefined && input.datasetId !== '') {
      query.datasetId = input.datasetId;
    }

    const tags = normalizeTags(input.tags);
    if (tags !== undefined) {
      query.tags = tags;
    }

    return query;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${name} must be a positive integer`);
  }
  return parsed;
}

function normalizeTags(tags: string | string[] | undefined): string[] | undefined {
  if (tags === undefined) return undefined;
  const parts = (Array.isArray(tags) ? tags : [tags])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return parts.length > 0 ? parts : undefined;
}
