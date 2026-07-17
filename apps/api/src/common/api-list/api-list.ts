import type { HistoryPage } from '../../modules/campaign-persistence/history-page';

export type ApiSortOrder = 'ASC' | 'DESC';

export type ApiPageRequest = {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: ApiSortOrder;
};

/**
 * Shared list pagination / sorting for Research Intelligence API (US100).
 * Response envelope matches History (`HistoryPage`).
 */
export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string,
  badRequest: (message: string) => Error,
): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${name} must be a positive integer`);
  }
  return parsed;
}

export function parseApiPageRequest(
  input: {
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  options: {
    allowedSortBy: readonly string[];
    defaultSortBy: string;
    defaultSortOrder?: ApiSortOrder;
    badRequest: (message: string) => Error;
  },
): ApiPageRequest {
  const page = parsePositiveInt(input.page, 1, 'page', options.badRequest);
  const pageSize = parsePositiveInt(input.pageSize, 20, 'pageSize', options.badRequest);
  const sortBy = input.sortBy ?? options.defaultSortBy;
  if (!options.allowedSortBy.includes(sortBy)) {
    throw options.badRequest(`sortBy must be one of: ${options.allowedSortBy.join(', ')}`);
  }
  const sortOrder = (input.sortOrder ?? options.defaultSortOrder ?? 'DESC') as ApiSortOrder;
  if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
    throw options.badRequest('sortOrder must be one of: ASC, DESC');
  }

  return { page, pageSize, sortBy, sortOrder };
}

export function sortItems<T>(
  items: T[],
  sortBy: string,
  sortOrder: ApiSortOrder,
  valueOf: (item: T, field: string) => string | number,
): T[] {
  const direction = sortOrder === 'ASC' ? 1 : -1;
  return [...items].sort((left, right) => {
    const leftValue = valueOf(left, sortBy);
    const rightValue = valueOf(right, sortBy);
    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });
}

export function paginateItems<T>(items: T[], pageRequest: ApiPageRequest): HistoryPage<T> {
  const pageSize = Math.max(1, pageRequest.pageSize);
  const currentPage = Math.max(1, pageRequest.page);
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const start = (currentPage - 1) * pageSize;
  const pageItems = start >= totalItems ? [] : items.slice(start, start + pageSize);

  return {
    items: pageItems,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  };
}

export function toHistoryPage<T>(
  items: T[],
  pageRequest: ApiPageRequest,
  valueOf: (item: T, field: string) => string | number,
): HistoryPage<T> {
  return paginateItems(
    sortItems(items, pageRequest.sortBy, pageRequest.sortOrder, valueOf),
    pageRequest,
  );
}
