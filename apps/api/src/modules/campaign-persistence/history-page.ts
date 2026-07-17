export type HistorySortBy = 'createdAt' | 'completedAt' | 'status';

export type HistorySortDirection = 'ASC' | 'DESC';

export type HistoryPageRequest = {
  page: number;
  pageSize: number;
  sortBy: HistorySortBy;
  sortDirection: HistorySortDirection;
};

export type HistoryPage<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};
