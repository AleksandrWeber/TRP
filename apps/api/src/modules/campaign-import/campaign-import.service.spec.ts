import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignImportService } from './campaign-import.service';
import { CampaignSessionValidator } from './campaign-session.validator';
import { ImportFormat } from './import-format';
import { ImportValidationError } from './import-validation.error';
import { JsonCampaignImporter } from './json-campaign.importer';

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

function createImporter(): JsonCampaignImporter {
  return new JsonCampaignImporter(new CampaignSessionValidator());
}

function createService(): CampaignImportService {
  return new CampaignImportService([createImporter()]);
}

describe('CampaignImportService / JsonCampaignImporter (US064)', () => {
  const service = createService();
  const importer = createImporter();

  it('imports a valid session', () => {
    const source = sampleSession();
    const session = service.import(JSON.stringify(source), ImportFormat.JSON);
    expect(session).toEqual(source);
  });

  it('rejects malformed JSON', () => {
    expect(() => service.import('{not-json', ImportFormat.JSON)).toThrow(ImportValidationError);
    expect(() => service.import('{not-json', ImportFormat.JSON)).toThrow(/Invalid JSON/);
  });

  it('rejects missing metadata', () => {
    const rest = { ...sampleSession() };
    delete (rest as { metadata?: unknown }).metadata;
    expect(() => service.import(JSON.stringify(rest), ImportFormat.JSON)).toThrow(
      ImportValidationError,
    );
  });

  it('rejects missing report', () => {
    const rest = { ...sampleSession() };
    delete (rest as { report?: unknown }).report;
    expect(() => service.import(JSON.stringify(rest), ImportFormat.JSON)).toThrow(
      ImportValidationError,
    );
  });

  it('rejects invalid version', () => {
    const source = sampleSession();
    source.metadata.engineVersion = '1.0';
    expect(() => service.import(JSON.stringify(source), ImportFormat.JSON)).toThrow(/semver/);
  });

  it('rejects invalid timestamps', () => {
    const source = sampleSession();
    source.createdAt = 'yesterday';
    expect(() => service.import(JSON.stringify(source), ImportFormat.JSON)).toThrow(/ISO-8601/);
  });

  it('rejects invalid schema', () => {
    expect(() => service.import('[]', ImportFormat.JSON)).toThrow(/must be an object/);
  });

  it('rejects unsupported import format', () => {
    expect(() => service.import('{}', 'CSV' as ImportFormat)).toThrow(BadRequestException);
  });

  it('restores metadata and report on valid JSON', () => {
    const source = sampleSession();
    const session = importer.import(JSON.stringify(source));
    expect(session.metadata).toEqual(source.metadata);
    expect(session.report).toEqual(source.report);
  });
});
