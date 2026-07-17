import { Inject, Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignRepository } from './campaign-repository';
import { CAMPAIGN_REPOSITORY } from './campaign-repository.token';
import { CampaignSessionMapper } from './campaign-session.mapper';
import type { HistoryPage, HistoryPageRequest, HistorySortBy } from './history-page';
import type { HistoryQuery } from './history-query';

/**
 * Read-only Campaign Session history queries.
 * Writes remain on CampaignPersistenceService.
 */
@Injectable()
export class CampaignHistoryService {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY) private readonly repository: CampaignRepository,
    private readonly mapper: CampaignSessionMapper,
  ) {}

  getById(sessionId: string, workspaceId: string): CampaignSession | null {
    const record = this.repository.findById(sessionId, workspaceId);
    if (!record) return null;
    return this.mapper.toSession(record);
  }

  getAll(workspaceId: string): CampaignSession[] {
    return this.repository.findAll(workspaceId).map((record) => this.mapper.toSession(record));
  }

  exists(sessionId: string, workspaceId: string): boolean {
    return this.repository.exists(sessionId, workspaceId);
  }

  /**
   * Load all (scoped to workspaceId) → filter → sort → paginate (in-service).
   * Repository contract is unchanged — always findAll(workspaceId).
   */
  search(
    query: HistoryQuery,
    pageRequest: HistoryPageRequest,
    workspaceId: string,
  ): HistoryPage<CampaignSession> {
    const filtered = this.getAll(workspaceId).filter((session) => matchesQuery(session, query));
    const sorted = sortSessions(filtered, pageRequest.sortBy, pageRequest.sortDirection);
    return paginate(sorted, pageRequest);
  }
}

function matchesQuery(session: CampaignSession, query: HistoryQuery): boolean {
  if (query.status !== undefined && session.status !== query.status) {
    return false;
  }

  if (query.engineVersion !== undefined && session.metadata.engineVersion !== query.engineVersion) {
    return false;
  }

  if (query.datasetId !== undefined && session.metadata.datasetId !== query.datasetId) {
    return false;
  }

  if (query.tags !== undefined) {
    const sessionTags = session.metadata.tags ?? [];
    for (const tag of query.tags) {
      if (!sessionTags.includes(tag)) {
        return false;
      }
    }
  }

  return true;
}

function sortSessions(
  sessions: CampaignSession[],
  sortBy: HistorySortBy,
  sortDirection: HistoryPageRequest['sortDirection'],
): CampaignSession[] {
  const direction = sortDirection === 'ASC' ? 1 : -1;
  return [...sessions].sort((left, right) => {
    const leftValue = sortValue(left, sortBy);
    const rightValue = sortValue(right, sortBy);
    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });
}

function sortValue(session: CampaignSession, sortBy: HistorySortBy): string {
  if (sortBy === 'createdAt') return session.createdAt;
  if (sortBy === 'completedAt') return session.completedAt ?? '';
  return session.status;
}

function paginate(
  sessions: CampaignSession[],
  pageRequest: HistoryPageRequest,
): HistoryPage<CampaignSession> {
  const pageSize = Math.max(1, pageRequest.pageSize);
  const currentPage = Math.max(1, pageRequest.page);
  const totalItems = sessions.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const start = (currentPage - 1) * pageSize;
  const items = start >= totalItems ? [] : sessions.slice(start, start + pageSize);

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  };
}
