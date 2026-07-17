import { describe, expect, it, vi } from 'vitest';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignPersistenceService } from './campaign-persistence.service';
import type { CampaignRecord } from './campaign-record';
import type { CampaignRepository } from './campaign-repository';
import { CampaignSessionMapper } from './campaign-session.mapper';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';

describe('CampaignPersistenceService', () => {
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

  const session = (
    overrides: Partial<CampaignSession> & Pick<CampaignSession, 'id'> = { id: 'session-1' },
  ): CampaignSession => ({
    status: CampaignSessionStatus.CREATED,
    createdAt: '2026-07-17T11:00:00.000Z',
    report: report(),
    metadata: { engineVersion: '1.0.3', datasetId: 'ds-1', tags: ['tag'] },
    ...overrides,
  });

  const createService = (repository: CampaignRepository, mapper = new CampaignSessionMapper()) =>
    new CampaignPersistenceService(repository, mapper);

  it('save() maps CampaignSession then delegates to repository', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };
    const mapper = new CampaignSessionMapper();
    const toRecord = vi.spyOn(mapper, 'toRecord');
    const input = session({
      id: 'session-1',
      status: CampaignSessionStatus.COMPLETED,
      completedAt: '2026-07-17T12:00:00.000Z',
    });

    createService(repository, mapper).save(input);

    expect(toRecord).toHaveBeenCalledWith(input);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-1',
        sessionId: 'session-1',
        status: CampaignSessionStatus.COMPLETED,
        completedAt: '2026-07-17T12:00:00.000Z',
      }),
    );
  });

  it('findById() loads CampaignSession and never exposes CampaignRecord', () => {
    const stored: CampaignRecord = {
      id: 'session-1',
      sessionId: 'session-1',
      status: CampaignSessionStatus.FAILED,
      createdAt: '2026-07-17T11:00:00.000Z',
      completedAt: '2026-07-17T12:30:00.000Z',
      metadata: { engineVersion: '1.0.3', tags: ['x'] },
      report: report(),
    };
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn().mockReturnValue(stored),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    const found = createService(repository).findById('session-1');

    expect(found).toEqual({
      id: 'session-1',
      status: CampaignSessionStatus.FAILED,
      createdAt: '2026-07-17T11:00:00.000Z',
      completedAt: '2026-07-17T12:30:00.000Z',
      metadata: { engineVersion: '1.0.3', tags: ['x'] },
      report: report(),
    });
    expect(found).not.toHaveProperty('sessionId');
  });

  it('findById() returns null when repository misses', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn().mockReturnValue(null),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    expect(createService(repository).findById('missing')).toBeNull();
  });

  it('findAll() / exists() / delete() delegate correctly', () => {
    const repository: CampaignRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockReturnValue([
        {
          id: 'a',
          sessionId: 'a',
          status: CampaignSessionStatus.CREATED,
          createdAt: '2026-07-17T11:00:00.000Z',
          completedAt: null,
          metadata: { engineVersion: '1.0.3' },
          report: report({ campaignId: 'camp-a' }),
        },
      ]),
      exists: vi.fn().mockReturnValue(true),
      delete: vi.fn(),
    };
    const service = createService(repository);

    expect(service.findAll().map((item) => item.id)).toEqual(['a']);
    expect(service.exists('a')).toBe(true);
    service.delete('a');
    expect(repository.delete).toHaveBeenCalledWith('a');
  });

  it('save and load round-trip status, metadata, and timestamps', () => {
    const repository = new InMemoryCampaignRepository();
    const service = createService(repository);
    const input = session({
      id: 'session-42',
      status: CampaignSessionStatus.COMPLETED,
      createdAt: '2026-07-17T11:00:00.000Z',
      completedAt: '2026-07-17T12:00:00.000Z',
      metadata: { engineVersion: '1.0.3', datasetId: 'ds-9', tags: ['persist'] },
    });

    service.save(input);
    const loaded = service.findById('session-42');

    expect(loaded).toEqual(input);
    expect(loaded?.status).toBe(CampaignSessionStatus.COMPLETED);
    expect(loaded?.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-9',
      tags: ['persist'],
    });
    expect(loaded?.createdAt).toBe('2026-07-17T11:00:00.000Z');
    expect(loaded?.completedAt).toBe('2026-07-17T12:00:00.000Z');
  });

  it('keeps multiple sessions isolated', () => {
    const repository = new InMemoryCampaignRepository();
    const service = createService(repository);

    service.save(
      session({
        id: 's1',
        status: CampaignSessionStatus.CREATED,
        metadata: { engineVersion: '1.0.3', tags: ['one'] },
      }),
    );
    service.save(
      session({
        id: 's2',
        status: CampaignSessionStatus.FAILED,
        completedAt: '2026-07-17T13:00:00.000Z',
        metadata: { engineVersion: '1.0.3', tags: ['two'] },
      }),
    );

    service.delete('s1');

    expect(service.exists('s1')).toBe(false);
    expect(service.findById('s2')?.status).toBe(CampaignSessionStatus.FAILED);
    expect(service.findById('s2')?.metadata.tags).toEqual(['two']);
    expect(service.findAll()).toHaveLength(1);
  });

  it('propagates repository exceptions from save()', () => {
    const repository: CampaignRepository = {
      save: vi.fn(() => {
        throw new Error('store failed');
      }),
      findById: vi.fn(),
      findAll: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    };

    expect(() => createService(repository).save(session({ id: 'x' }))).toThrow('store failed');
  });
});
