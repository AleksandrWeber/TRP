import { describe, expect, it } from 'vitest';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignSessionMapper } from './campaign-session.mapper';

describe('CampaignSessionMapper', () => {
  const mapper = new CampaignSessionMapper();

  const report = (overrides: Partial<CampaignReport> = {}): CampaignReport => ({
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 2,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 1,
    bestExperimentId: 'exp-1',
    bestProfitFactor: 1.1,
    bestReturn: 2,
    bestExpectancy: 0.5,
    lowestDrawdown: 12,
    verdict: 'NEEDS_REVIEW',
    recommendations: ['review'],
    createdAt: '2026-07-17T10:00:00.000Z',
    ...overrides,
  });

  const session = (overrides: Partial<CampaignSession> = {}): CampaignSession => ({
    id: 'session-1',
    status: CampaignSessionStatus.CREATED,
    createdAt: '2026-07-17T11:00:00.000Z',
    report: report(),
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      tags: ['wf'],
    },
    ...overrides,
  });

  it('maps CampaignSession to CampaignRecord both directions', () => {
    const source = session({
      status: CampaignSessionStatus.COMPLETED,
      completedAt: '2026-07-17T12:00:00.000Z',
    });

    const record = mapper.toRecord(source);
    expect(record).toEqual({
      id: 'session-1',
      sessionId: 'session-1',
      status: CampaignSessionStatus.COMPLETED,
      createdAt: '2026-07-17T11:00:00.000Z',
      completedAt: '2026-07-17T12:00:00.000Z',
      metadata: {
        engineVersion: '1.0.3',
        datasetId: 'ds-1',
        tags: ['wf'],
      },
      report: report(),
    });

    expect(mapper.toSession(record)).toEqual(source);
  });

  it('maps missing completedAt to null on record and omits it on session', () => {
    const record = mapper.toRecord(session());
    expect(record.completedAt).toBeNull();

    const restored = mapper.toSession(record);
    expect(restored.completedAt).toBeUndefined();
  });

  it('persists status and metadata fields', () => {
    const record = mapper.toRecord(
      session({
        status: CampaignSessionStatus.FAILED,
        metadata: { engineVersion: '9.9.9', tags: ['a', 'b'] },
      }),
    );

    expect(record.status).toBe(CampaignSessionStatus.FAILED);
    expect(record.metadata).toEqual({ engineVersion: '9.9.9', tags: ['a', 'b'] });
  });

  it('copies nested report and metadata so mutations stay isolated', () => {
    const source = session();
    const record = mapper.toRecord(source);
    record.metadata.tags?.push('mutated');
    record.report.recommendations.push('mutated');

    expect(source.metadata.tags).toEqual(['wf']);
    expect(source.report.recommendations).toEqual(['review']);
  });
});
