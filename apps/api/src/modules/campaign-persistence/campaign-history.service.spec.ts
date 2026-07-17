import { describe, expect, it, vi } from 'vitest';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignHistoryService } from './campaign-history.service';
import type { CampaignRecord } from './campaign-record';
import type { CampaignRepository } from './campaign-repository';
import { CampaignSessionMapper } from './campaign-session.mapper';
import type { HistoryPageRequest } from './history-page';

describe('CampaignHistoryService', () => {
  const report = (overrides: Partial<CampaignReport> = {}): CampaignReport => ({
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 1.2,
    bestReturn: 3,
    bestExpectancy: 1,
    lowestDrawdown: 8,
    verdict: 'PASS',
    recommendations: ['ok'],
    createdAt: '2026-07-17T10:00:00.000Z',
    ...overrides,
  });

  const record = (
    overrides: Partial<CampaignRecord> & Pick<CampaignRecord, 'id'>,
  ): CampaignRecord => ({
    sessionId: overrides.id,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T11:00:00.000Z',
    completedAt: '2026-07-17T12:00:00.000Z',
    metadata: { engineVersion: '1.0.3', datasetId: 'ds-1' },
    report: report(),
    ...overrides,
  });

  const createService = (repository: CampaignRepository) =>
    new CampaignHistoryService(repository, new CampaignSessionMapper());

  it('getById() returns CampaignSession and never CampaignRecord', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn().mockReturnValue(
        record({
          id: 'session-1',
          status: CampaignSessionStatus.COMPLETED,
        }),
      ),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    const found = createService(repository).getById('session-1');

    expect(repository.findById).toHaveBeenCalledWith('session-1');
    expect(found).toEqual({
      id: 'session-1',
      status: CampaignSessionStatus.COMPLETED,
      createdAt: '2026-07-17T11:00:00.000Z',
      completedAt: '2026-07-17T12:00:00.000Z',
      metadata: { engineVersion: '1.0.3', datasetId: 'ds-1' },
      report: report(),
    });
    expect(found).not.toHaveProperty('sessionId');
  });

  it('getById() returns null for unknown id', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn().mockReturnValue(null),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    expect(createService(repository).getById('missing')).toBeNull();
    expect(repository.findById).toHaveBeenCalledWith('missing');
  });

  it('getAll() returns empty list when repository is empty', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockReturnValue([]),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    expect(createService(repository).getAll()).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('getAll() returns CampaignSession list only', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi
        .fn()
        .mockReturnValue([
          record({ id: 'a', report: report({ campaignId: 'camp-a' }) }),
          record({ id: 'b', status: CampaignSessionStatus.FAILED }),
        ]),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    const all = createService(repository).getAll();

    expect(all).toHaveLength(2);
    expect(all.map((item) => item.id)).toEqual(['a', 'b']);
    for (const item of all) {
      expect(item).toHaveProperty('report');
      expect(item).toHaveProperty('metadata');
      expect(item).not.toHaveProperty('sessionId');
    }
  });

  it('exists() delegates to repository', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      exists: vi.fn().mockReturnValue(true),
      delete: vi.fn(),
    };

    expect(createService(repository).exists('session-1')).toBe(true);
    expect(repository.exists).toHaveBeenCalledWith('session-1');
  });
});

describe('CampaignHistoryService.search filters', () => {
  const report = (): CampaignReport => ({
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 1.2,
    bestReturn: 3,
    bestExpectancy: 1,
    lowestDrawdown: 8,
    verdict: 'PASS',
    recommendations: ['ok'],
    createdAt: '2026-07-17T10:00:00.000Z',
  });

  const record = (
    overrides: Partial<CampaignRecord> & Pick<CampaignRecord, 'id'>,
  ): CampaignRecord => ({
    sessionId: overrides.id,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T11:00:00.000Z',
    completedAt: '2026-07-17T12:00:00.000Z',
    metadata: { engineVersion: '1.0.3', datasetId: 'ds-1' },
    report: report(),
    ...overrides,
  });

  const allPage = (): HistoryPageRequest => ({
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortDirection: 'ASC',
  });

  const seed = (): { service: CampaignHistoryService; findAll: ReturnType<typeof vi.fn> } => {
    const findAll = vi.fn().mockReturnValue([
      record({
        id: 's1',
        status: CampaignSessionStatus.COMPLETED,
        metadata: { engineVersion: '1.0.3', datasetId: 'ds-1', tags: ['wf', 'smoke'] },
      }),
      record({
        id: 's2',
        status: CampaignSessionStatus.FAILED,
        metadata: { engineVersion: '1.0.3', datasetId: 'ds-2', tags: ['wf'] },
      }),
      record({
        id: 's3',
        status: CampaignSessionStatus.CREATED,
        completedAt: null,
        metadata: { engineVersion: '9.9.9', datasetId: 'ds-1', tags: ['smoke'] },
      }),
    ]);
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll,
      exists: vi.fn(),
      delete: vi.fn(),
    };
    return {
      service: new CampaignHistoryService(repository, new CampaignSessionMapper()),
      findAll,
    };
  };

  it('filter by status', () => {
    const { service, findAll } = seed();
    const result = service.search({ status: CampaignSessionStatus.FAILED }, allPage());

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result.items.map((item) => item.id)).toEqual(['s2']);
  });

  it('filter by engineVersion', () => {
    const { service } = seed();
    expect(
      service.search({ engineVersion: '9.9.9' }, allPage()).items.map((item) => item.id),
    ).toEqual(['s3']);
  });

  it('filter by datasetId', () => {
    const { service } = seed();
    expect(service.search({ datasetId: 'ds-2' }, allPage()).items.map((item) => item.id)).toEqual([
      's2',
    ]);
  });

  it('filter by tags (all required tags must be present)', () => {
    const { service } = seed();
    expect(service.search({ tags: ['wf'] }, allPage()).items.map((item) => item.id)).toEqual([
      's1',
      's2',
    ]);
    expect(
      service.search({ tags: ['wf', 'smoke'] }, allPage()).items.map((item) => item.id),
    ).toEqual(['s1']);
  });

  it('combines multiple filters with AND', () => {
    const { service } = seed();
    const result = service.search(
      {
        status: CampaignSessionStatus.COMPLETED,
        datasetId: 'ds-1',
        engineVersion: '1.0.3',
        tags: ['smoke'],
      },
      allPage(),
    );

    expect(result.items.map((item) => item.id)).toEqual(['s1']);
    expect(result.items[0]).not.toHaveProperty('sessionId');
  });

  it('no filters returns all', () => {
    const { service, findAll } = seed();
    expect(service.search({}, allPage()).items.map((item) => item.id)).toEqual(['s1', 's2', 's3']);
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('no matches returns empty list', () => {
    const { service } = seed();
    const result = service.search(
      { status: CampaignSessionStatus.FAILED, datasetId: 'ds-1' },
      allPage(),
    );
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});

describe('CampaignHistoryService.search pagination & sorting', () => {
  const report = (): CampaignReport => ({
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 1.2,
    bestReturn: 3,
    bestExpectancy: 1,
    lowestDrawdown: 8,
    verdict: 'PASS',
    recommendations: ['ok'],
    createdAt: '2026-07-17T10:00:00.000Z',
  });

  const record = (
    overrides: Partial<CampaignRecord> & Pick<CampaignRecord, 'id'>,
  ): CampaignRecord => ({
    sessionId: overrides.id,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T11:00:00.000Z',
    completedAt: '2026-07-17T12:00:00.000Z',
    metadata: { engineVersion: '1.0.3', datasetId: 'ds-1' },
    report: report(),
    ...overrides,
  });

  const seedFive = () => {
    const findAll = vi.fn().mockReturnValue([
      record({
        id: 'a',
        status: CampaignSessionStatus.CREATED,
        createdAt: '2026-07-17T10:00:00.000Z',
        completedAt: null,
      }),
      record({
        id: 'b',
        status: CampaignSessionStatus.COMPLETED,
        createdAt: '2026-07-17T11:00:00.000Z',
        completedAt: '2026-07-17T11:30:00.000Z',
      }),
      record({
        id: 'c',
        status: CampaignSessionStatus.FAILED,
        createdAt: '2026-07-17T12:00:00.000Z',
        completedAt: '2026-07-17T12:30:00.000Z',
      }),
      record({
        id: 'd',
        status: CampaignSessionStatus.COMPLETED,
        createdAt: '2026-07-17T13:00:00.000Z',
        completedAt: '2026-07-17T13:30:00.000Z',
      }),
      record({
        id: 'e',
        status: CampaignSessionStatus.FAILED,
        createdAt: '2026-07-17T14:00:00.000Z',
        completedAt: '2026-07-17T14:30:00.000Z',
      }),
    ]);
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll,
      exists: vi.fn(),
      delete: vi.fn(),
    };
    return new CampaignHistoryService(repository, new CampaignSessionMapper());
  };

  it('returns first page', () => {
    const service = seedFive();
    const page = service.search(
      {},
      { page: 1, pageSize: 2, sortBy: 'createdAt', sortDirection: 'ASC' },
    );

    expect(page.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page.currentPage).toBe(1);
    expect(page.pageSize).toBe(2);
    expect(page.totalItems).toBe(5);
    expect(page.totalPages).toBe(3);
  });

  it('returns second page', () => {
    const service = seedFive();
    const page = service.search(
      {},
      { page: 2, pageSize: 2, sortBy: 'createdAt', sortDirection: 'ASC' },
    );

    expect(page.items.map((item) => item.id)).toEqual(['c', 'd']);
    expect(page.currentPage).toBe(2);
    expect(page.totalItems).toBe(5);
    expect(page.totalPages).toBe(3);
  });

  it('page out of range returns empty items with totals', () => {
    const service = seedFive();
    const page = service.search(
      {},
      { page: 9, pageSize: 2, sortBy: 'createdAt', sortDirection: 'ASC' },
    );

    expect(page.items).toEqual([]);
    expect(page.currentPage).toBe(9);
    expect(page.totalItems).toBe(5);
    expect(page.totalPages).toBe(3);
  });

  it('sorts ascending by createdAt', () => {
    const service = seedFive();
    const page = service.search(
      {},
      { page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: 'ASC' },
    );
    expect(page.items.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('sorts descending by createdAt', () => {
    const service = seedFive();
    const page = service.search(
      {},
      { page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: 'DESC' },
    );
    expect(page.items.map((item) => item.id)).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  it('sorts by status and completedAt', () => {
    const service = seedFive();
    const byStatus = service.search(
      {},
      { page: 1, pageSize: 10, sortBy: 'status', sortDirection: 'ASC' },
    );
    expect(byStatus.items.map((item) => item.status)).toEqual([
      CampaignSessionStatus.COMPLETED,
      CampaignSessionStatus.COMPLETED,
      CampaignSessionStatus.CREATED,
      CampaignSessionStatus.FAILED,
      CampaignSessionStatus.FAILED,
    ]);

    const byCompleted = service.search(
      {},
      { page: 1, pageSize: 10, sortBy: 'completedAt', sortDirection: 'ASC' },
    );
    expect(byCompleted.items.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('applies pagination after filtering', () => {
    const service = seedFive();
    const page = service.search(
      { status: CampaignSessionStatus.FAILED },
      { page: 1, pageSize: 1, sortBy: 'createdAt', sortDirection: 'ASC' },
    );

    expect(page.items.map((item) => item.id)).toEqual(['c']);
    expect(page.totalItems).toBe(2);
    expect(page.totalPages).toBe(2);
  });
});
