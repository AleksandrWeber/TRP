import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { CampaignReplayService } from './campaign-replay.service';
import { ReplayStatus } from './replay-status';

function sampleSession(overrides?: Partial<CampaignSession>): CampaignSession {
  return {
    id: 'sess-source-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-meta',
      tags: ['replay', 'smoke'],
      paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
    },
    report: {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 2,
      passCount: 1,
      failCount: 1,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 1.4,
      bestReturn: 5,
      bestExpectancy: 0.9,
      lowestDrawdown: 11,
      verdict: 'PASS',
      recommendations: ['keep baseline'],
      createdAt: '2026-07-17T10:04:00.000Z',
      sliceIdentity: 'ds-1:0-99:TRAIN',
    },
    ...overrides,
  };
}

function regeneratedReport(): CampaignReport {
  return {
    campaignId: 'camp-replayed',
    strategyId: 'donchian-breakout',
    datasetId: 'ds-1',
    totalRuns: 2,
    passCount: 2,
    failCount: 0,
    needsReviewCount: 0,
    bestExperimentId: 'exp-new',
    bestProfitFactor: 2.1,
    bestReturn: 8,
    bestExpectancy: 1.2,
    lowestDrawdown: 7,
    verdict: 'PASS',
    recommendations: ['replay regenerated'],
    createdAt: '2026-07-17T12:00:00.000Z',
  };
}

describe('CampaignReplayService', () => {
  let campaigns: { run: ReturnType<typeof vi.fn> };
  let reports: { build: ReturnType<typeof vi.fn> };
  let service: CampaignReplayService;
  let persistence: { save: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    campaigns = { run: vi.fn() };
    reports = { build: vi.fn() };
    persistence = { save: vi.fn() };
    service = new CampaignReplayService(campaigns as never, reports as never);
  });

  describe('create (US066)', () => {
    it('creates a replay with READY status', () => {
      const result = service.create(sampleSession());

      expect(result.status).toBe(ReplayStatus.READY);
      expect(result.completedAt).toBeUndefined();
      expect(result.startedAt).toEqual(expect.any(String));
    });

    it('generates a replayId', () => {
      const a = service.create(sampleSession());
      const b = service.create(sampleSession());

      expect(a.replayId).toEqual(expect.any(String));
      expect(a.replayId).not.toBe(b.replayId);
    });

    it('links the source session', () => {
      const session = sampleSession();
      expect(service.create(session).sourceSessionId).toBe(session.id);
    });

    it('restores campaignConfig from session including paramsList', () => {
      expect(service.create(sampleSession()).campaignConfig).toEqual({
        campaignId: 'camp-1',
        strategyId: 'donchian-breakout',
        datasetId: 'ds-1',
        engineVersion: '1.0.3',
        paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
        sliceIdentity: 'ds-1:0-99:TRAIN',
        tags: ['replay', 'smoke'],
      });
    });

    it('copies report from the source session', () => {
      const session = sampleSession();
      const result = service.create(session);

      expect(result.report).toEqual(session.report);
      expect(result.report).not.toBe(session.report);
    });

    it('rejects invalid session', () => {
      expect(() => service.create(null as never)).toThrow(BadRequestException);
      expect(() => service.create({ ...sampleSession(), id: '' })).toThrow(BadRequestException);
    });
  });

  describe('execute (US067)', () => {
    it('successfully replays via ResearchCampaignService', async () => {
      const session = sampleSession();
      const fresh = regeneratedReport();
      campaigns.run.mockResolvedValue({
        summary: { campaignId: 'camp-replayed' },
        experiments: [],
      });
      reports.build.mockReturnValue(fresh);

      const result = await service.execute(session);

      expect(result.status).toBe(ReplayStatus.COMPLETED);
      expect(result.completedAt).toEqual(expect.any(String));
      expect(result.report).toEqual(fresh);
      expect(result.report).not.toEqual(session.report);
    });

    it('status transitions end in COMPLETED after READY preparation path', async () => {
      const ready = service.create(sampleSession());
      expect(ready.status).toBe(ReplayStatus.READY);

      campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
      reports.build.mockReturnValue(regeneratedReport());

      const done = await service.execute(sampleSession());
      expect(done.status).toBe(ReplayStatus.COMPLETED);
      expect([ReplayStatus.READY, ReplayStatus.RUNNING, ReplayStatus.COMPLETED]).toContain(
        ReplayStatus.COMPLETED,
      );
    });

    it('reuses campaignConfig for ResearchCampaignService.run', async () => {
      campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
      reports.build.mockReturnValue(regeneratedReport());

      const result = await service.execute(sampleSession());

      expect(campaigns.run).toHaveBeenCalledWith(
        {
          datasetId: 'ds-1',
          strategyId: 'donchian-breakout',
          paramsList: [{ channelPeriod: 10 }, { channelPeriod: 20 }],
        },
        { persistSession: false },
      );
      expect(result.campaignConfig.paramsList).toEqual([
        { channelPeriod: 10 },
        { channelPeriod: 20 },
      ]);
    });

    it('links source session on execute', async () => {
      campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
      reports.build.mockReturnValue(regeneratedReport());

      const result = await service.execute(sampleSession());
      expect(result.sourceSessionId).toBe('sess-source-1');
    });

    it('regenerates report via CampaignReportService', async () => {
      const fresh = regeneratedReport();
      campaigns.run.mockResolvedValue({
        summary: { marker: 'summary' },
        experiments: [{ id: 'e1' }],
        sliceIdentity: 'ds-1:0-99:TRAIN',
      });
      reports.build.mockReturnValue(fresh);

      await service.execute(sampleSession());

      expect(reports.build).toHaveBeenCalledWith({ marker: 'summary' }, [{ id: 'e1' }], {
        sliceIdentity: 'ds-1:0-99:TRAIN',
      });
    });

    it('returns FAILED on execution error', async () => {
      campaigns.run.mockRejectedValue(new Error('boom'));

      const result = await service.execute(sampleSession());

      expect(result.status).toBe(ReplayStatus.FAILED);
      expect(result.completedAt).toEqual(expect.any(String));
      expect(result.report.campaignId).toBe('camp-1');
    });

    it('returns FAILED when paramsList is missing', async () => {
      const session = sampleSession({
        metadata: { engineVersion: '1.0.3', tags: ['x'] },
      });

      const result = await service.execute(session);

      expect(result.status).toBe(ReplayStatus.FAILED);
      expect(campaigns.run).not.toHaveBeenCalled();
    });

    it('does not interact with repository / persistence', async () => {
      campaigns.run.mockResolvedValue({ summary: {}, experiments: [] });
      reports.build.mockReturnValue(regeneratedReport());

      await service.execute(sampleSession());

      expect(campaigns.run).toHaveBeenCalledWith(expect.any(Object), { persistSession: false });
      expect(persistence.save).not.toHaveBeenCalled();
    });
  });
});
