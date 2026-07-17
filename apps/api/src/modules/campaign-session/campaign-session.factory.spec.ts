import { describe, expect, it } from 'vitest';
import { RESEARCH_ENGINE_VERSION } from '../knowledge/knowledge.version';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { CampaignSessionFactory } from './campaign-session.factory';
import { CampaignSessionStatus } from './campaign-session-status';

describe('CampaignSessionFactory', () => {
  const factory = new CampaignSessionFactory();

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

  it('creates a valid session with generated id and CREATED status', () => {
    const session = factory.create({ report: report() });

    expect(session.id).toEqual(expect.any(String));
    expect(session.id.length).toBeGreaterThan(0);
    expect(session.status).toBe(CampaignSessionStatus.CREATED);
    expect(session.createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(session.createdAt))).toBe(false);
    expect(session.completedAt).toBeUndefined();
    expect(session.report).toEqual(report());
    expect(session.metadata).toEqual({
      engineVersion: RESEARCH_ENGINE_VERSION,
    });
  });

  it('generates unique ids per session', () => {
    const a = factory.create({ report: report() });
    const b = factory.create({ report: report() });
    expect(a.id).not.toBe(b.id);
  });

  it('assigns the provided report', () => {
    const source = report();
    const session = factory.create({ report: source });
    expect(session.report).toBe(source);
  });

  it('initializes metadata with optional datasetId and tags', () => {
    const session = factory.create({
      report: report(),
      metadata: {
        datasetId: 'ds-99',
        tags: ['smoke', 'donchian'],
      },
    });

    expect(session.metadata.engineVersion).toBe(RESEARCH_ENGINE_VERSION);
    expect(session.metadata.datasetId).toBe('ds-99');
    expect(session.metadata.tags).toEqual(['smoke', 'donchian']);
  });

  it('allows overriding engineVersion in metadata', () => {
    const session = factory.create({
      report: report(),
      metadata: { engineVersion: '9.9.9' },
    });

    expect(session.metadata.engineVersion).toBe('9.9.9');
  });

  it('leaves completedAt undefined on create', () => {
    const session = factory.create({ report: report() });
    expect('completedAt' in session ? session.completedAt : undefined).toBeUndefined();
  });
});
