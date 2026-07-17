import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignExportService } from './campaign-export.service';
import { CsvCampaignExporter } from './csv-campaign.exporter';
import { ExportFormat } from './export-format';
import { JsonCampaignExporter } from './json-campaign.exporter';

function sampleSession(): CampaignSession {
  return {
    id: 'sess-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-meta',
      tags: ['smoke', 'donchian'],
    },
    report: {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 3,
      passCount: 1,
      failCount: 1,
      needsReviewCount: 1,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 1.5,
      bestReturn: 4.2,
      bestExpectancy: 0.8,
      lowestDrawdown: 12.5,
      verdict: 'PASS',
      recommendations: ['keep baseline', 'review fail configs'],
      createdAt: '2026-07-17T10:04:00.000Z',
      sliceIdentity: 'slice:0-99',
    },
  };
}

function createService(): CampaignExportService {
  return new CampaignExportService([new JsonCampaignExporter(), new CsvCampaignExporter()]);
}

describe('CampaignExportService', () => {
  const service = createService();

  it('exports JSON containing session metadata and report', () => {
    const session = sampleSession();
    const content = service.export(session, ExportFormat.JSON);
    const parsed = JSON.parse(content) as CampaignSession;

    expect(parsed.id).toBe('sess-1');
    expect(parsed.status).toBe(CampaignSessionStatus.COMPLETED);
    expect(parsed.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-meta',
      tags: ['smoke', 'donchian'],
    });
    expect(parsed.report).toEqual(session.report);
    expect(parsed.report.verdict).toBe('PASS');
    expect(parsed.report.campaignId).toBe('camp-1');
  });

  it('exports CSV containing session metadata and report fields', () => {
    const content = service.export(sampleSession(), ExportFormat.CSV);
    const lines = content.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('sessionId');
    expect(lines[0]).toContain('engineVersion');
    expect(lines[0]).toContain('verdict');
    expect(lines[0]).toContain('recommendations');

    expect(lines[1]).toContain('sess-1');
    expect(lines[1]).toContain(CampaignSessionStatus.COMPLETED);
    expect(lines[1]).toContain('1.0.3');
    expect(lines[1]).toContain('ds-meta');
    expect(lines[1]).toContain('smoke;donchian');
    expect(lines[1]).toContain('camp-1');
    expect(lines[1]).toContain('donchian-breakout');
    expect(lines[1]).toContain('PASS');
    expect(lines[1]).toContain('keep baseline;review fail configs');
    expect(lines[1]).toContain('1.5');
    expect(lines[1]).toContain('slice:0-99');
  });

  it('rejects invalid export format', () => {
    expect(() => service.export(sampleSession(), 'XML' as ExportFormat)).toThrow(
      BadRequestException,
    );
    expect(() => service.export(sampleSession(), 'XML' as ExportFormat)).toThrow(
      /Unsupported export format/,
    );
  });

  it('JSON exporter produces parseable CampaignSession shape', () => {
    const exporter = new JsonCampaignExporter();
    const content = exporter.export(sampleSession());
    expect(exporter.format).toBe(ExportFormat.JSON);
    expect(JSON.parse(content).report.bestExperimentId).toBe('exp-1');
  });

  it('CSV exporter escapes commas and quotes in fields', () => {
    const session = sampleSession();
    session.report.recommendations = ['keep, baseline', 'say "ok"'];
    const exporter = new CsvCampaignExporter();
    const content = exporter.export(session);

    expect(content).toContain('"keep, baseline;say ""ok"""');
  });
});
