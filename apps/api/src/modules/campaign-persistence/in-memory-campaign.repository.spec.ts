import { describe, expect, it } from 'vitest';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { CampaignRecord } from './campaign-record';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';

const WORKSPACE_ID = 'ws-1';

describe('InMemoryCampaignRepository', () => {
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
    lowestDrawdown: 10,
    verdict: 'PASS',
    recommendations: ['ok'],
    createdAt: '2026-07-17T12:00:00.000Z',
  });

  const record = (
    overrides: Partial<CampaignRecord> & Pick<CampaignRecord, 'id'>,
  ): CampaignRecord => ({
    sessionId: overrides.id,
    workspaceId: WORKSPACE_ID,
    status: CampaignSessionStatus.CREATED,
    createdAt: '2026-07-17T12:00:00.000Z',
    completedAt: null,
    metadata: { engineVersion: '1.0.3' },
    report: report(),
    ...overrides,
  });

  it('save() and findById() round-trip a record', () => {
    const repo = new InMemoryCampaignRepository();
    const saved = record({
      id: 'a',
      sessionId: 'a',
      status: CampaignSessionStatus.COMPLETED,
      completedAt: '2026-07-17T13:00:00.000Z',
      metadata: { engineVersion: '1.0.3', tags: ['t'] },
    });

    repo.save(saved);

    expect(repo.findById('a', WORKSPACE_ID)).toEqual(saved);
  });

  it('findById() returns null when missing', () => {
    const repo = new InMemoryCampaignRepository();
    expect(repo.findById('missing', WORKSPACE_ID)).toBeNull();
  });

  it('findById() returns null when workspace does not match', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a' }));

    expect(repo.findById('a', 'ws-2')).toBeNull();
  });

  it('exists() reflects saved records', () => {
    const repo = new InMemoryCampaignRepository();
    expect(repo.exists('a', WORKSPACE_ID)).toBe(false);
    repo.save(record({ id: 'a' }));
    expect(repo.exists('a', WORKSPACE_ID)).toBe(true);
    expect(repo.exists('a', 'ws-2')).toBe(false);
  });

  it('delete() removes a record', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a' }));

    repo.delete('a', WORKSPACE_ID);

    expect(repo.exists('a', WORKSPACE_ID)).toBe(false);
    expect(repo.findById('a', WORKSPACE_ID)).toBeNull();
  });

  it('delete() does not remove a record from another workspace', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a' }));

    repo.delete('a', 'ws-2');

    expect(repo.exists('a', WORKSPACE_ID)).toBe(true);
  });

  it('findAll() returns every stored record for the workspace', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a' }));
    repo.save(record({ id: 'b' }));
    repo.save(record({ id: 'c', workspaceId: 'ws-2' }));

    const all = repo.findAll(WORKSPACE_ID);

    expect(all).toHaveLength(2);
    expect(all.map((item) => item.id).sort()).toEqual(['a', 'b']);
    expect(repo.findAll('ws-2')).toHaveLength(1);
  });

  it('stores multiple CampaignRecords independently', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a', status: CampaignSessionStatus.CREATED }));
    repo.save(record({ id: 'b', status: CampaignSessionStatus.FAILED }));
    repo.save(record({ id: 'c', status: CampaignSessionStatus.COMPLETED }));

    expect(repo.findById('a', WORKSPACE_ID)?.status).toBe(CampaignSessionStatus.CREATED);
    expect(repo.findById('b', WORKSPACE_ID)?.status).toBe(CampaignSessionStatus.FAILED);
    expect(repo.findById('c', WORKSPACE_ID)?.status).toBe(CampaignSessionStatus.COMPLETED);
    expect(repo.findAll(WORKSPACE_ID)).toHaveLength(3);
  });

  it('deleting one record does not affect others', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a' }));
    repo.save(record({ id: 'b' }));
    repo.save(record({ id: 'c' }));

    repo.delete('b', WORKSPACE_ID);

    expect(repo.exists('a', WORKSPACE_ID)).toBe(true);
    expect(repo.exists('b', WORKSPACE_ID)).toBe(false);
    expect(repo.exists('c', WORKSPACE_ID)).toBe(true);
    expect(
      repo
        .findAll(WORKSPACE_ID)
        .map((item) => item.id)
        .sort(),
    ).toEqual(['a', 'c']);
  });

  it('save() overwrites an existing id', () => {
    const repo = new InMemoryCampaignRepository();
    repo.save(record({ id: 'a', status: CampaignSessionStatus.CREATED }));
    repo.save(record({ id: 'a', status: CampaignSessionStatus.COMPLETED }));

    expect(repo.findById('a', WORKSPACE_ID)?.status).toBe(CampaignSessionStatus.COMPLETED);
    expect(repo.findAll(WORKSPACE_ID)).toHaveLength(1);
  });
});
