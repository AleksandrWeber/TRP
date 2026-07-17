import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { ExperimentDomainService } from './experiment-domain.service';

function sampleReport(overrides?: Partial<CampaignReport>): CampaignReport {
  return {
    campaignId: 'camp-1',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 1,
    passCount: 1,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-run-1',
    bestProfitFactor: 1.2,
    bestReturn: 3,
    bestExpectancy: 1,
    lowestDrawdown: 8,
    verdict: 'PASS',
    recommendations: ['ok'],
    createdAt: '2026-07-17T10:04:00.000Z',
    ...overrides,
  };
}

function sampleSession(overrides?: Partial<CampaignSession>): CampaignSession {
  return {
    id: overrides?.id ?? 'sess-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    report: overrides?.report ?? sampleReport(),
    metadata: overrides?.metadata ?? {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      tags: ['campaign'],
    },
  };
}

describe('ExperimentDomainService (US076)', () => {
  let service: ExperimentDomainService;

  beforeEach(() => {
    service = new ExperimentDomainService();
  });

  it('creates an experiment from a session', () => {
    const session = sampleSession();
    const experiment = service.createFromSession({ session });

    expect(experiment.experimentId.length).toBeGreaterThan(0);
    expect(experiment.sessionId).toBe('sess-1');
    expect(experiment.createdAt).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(experiment.createdAt))).toBe(false);
    expect(experiment.currentVersion).toBe(1);
    expect(experiment.versions).toHaveLength(1);
  });

  it('creates the first version from the session report', () => {
    const session = sampleSession();
    const experiment = service.createFromSession({ session });
    const version = experiment.versions[0];

    expect(version.version).toBe(1);
    expect(version.sourceSessionId).toBe('sess-1');
    expect(version.report.campaignId).toBe('camp-1');
    expect(version.report.verdict).toBe('PASS');
    expect(version.replayId).toBeUndefined();
    expect(version.createdAt).toEqual(expect.any(String));
  });

  it('creates an additional version', () => {
    const experiment = service.createFromSession({ session: sampleSession() });
    const replayReport = sampleReport({
      campaignId: 'camp-replay',
      verdict: 'NEEDS_REVIEW',
      recommendations: ['review fees'],
    });

    const updated = service.createVersion(experiment.experimentId, {
      report: replayReport,
      sourceSessionId: 'sess-replay',
      replayId: 'replay-1',
    });

    expect(updated?.currentVersion).toBe(2);
    expect(updated?.versions).toHaveLength(2);
    expect(updated?.versions[1]).toMatchObject({
      version: 2,
      sourceSessionId: 'sess-replay',
      replayId: 'replay-1',
      report: expect.objectContaining({ campaignId: 'camp-replay', verdict: 'NEEDS_REVIEW' }),
    });
  });

  it('preserves version history', () => {
    const experiment = service.createFromSession({ session: sampleSession() });
    service.createVersion(experiment.experimentId, {
      report: sampleReport({ campaignId: 'camp-v2' }),
      sourceSessionId: 'sess-2',
    });
    service.createVersion(experiment.experimentId, {
      report: sampleReport({ campaignId: 'camp-v3' }),
      sourceSessionId: 'sess-3',
      replayId: 'replay-x',
    });

    const stored = service.get(experiment.experimentId)!;

    expect(stored.currentVersion).toBe(3);
    expect(stored.versions.map((v) => v.version)).toEqual([1, 2, 3]);
    expect(stored.versions.map((v) => v.report.campaignId)).toEqual([
      'camp-1',
      'camp-v2',
      'camp-v3',
    ]);
    expect(stored.versions[0].sourceSessionId).toBe('sess-1');
    expect(stored.versions[2].replayId).toBe('replay-x');
  });

  it('assigns and clones metadata', () => {
    const tags = ['manual'];
    const experiment = service.createFromSession({
      session: sampleSession(),
      metadata: {
        engineVersion: '1.0.3',
        datasetId: 'ds-2',
        strategyId: 'ema-crossover',
        tags,
        source: 'manual',
      },
    });

    tags.push('mutated');

    expect(experiment.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-2',
      strategyId: 'ema-crossover',
      tags: ['manual'],
      source: 'manual',
    });
  });

  it('derives metadata from session when not provided', () => {
    const experiment = service.createFromSession({
      session: sampleSession({
        metadata: {
          engineVersion: '1.0.3',
          datasetId: 'ds-1',
          tags: ['from-session'],
        },
      }),
    });

    expect(experiment.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      tags: ['from-session'],
      strategyId: 'donchian-breakout',
    });
  });

  it('lists experiments', () => {
    const a = service.createFromSession({ session: sampleSession({ id: 's-a' }) });
    const b = service.createFromSession({ session: sampleSession({ id: 's-b' }) });

    expect(service.list().map((e) => e.experimentId)).toEqual([a.experimentId, b.experimentId]);
  });

  it('gets an experiment by id', () => {
    const created = service.createFromSession({ session: sampleSession() });

    expect(service.get(created.experimentId)).toBe(created);
    expect(service.get('missing')).toBeNull();
  });

  it('returns null when creating a version for unknown experiment', () => {
    expect(
      service.createVersion('missing', {
        report: sampleReport(),
        sourceSessionId: 'sess-x',
      }),
    ).toBeNull();
  });
});
