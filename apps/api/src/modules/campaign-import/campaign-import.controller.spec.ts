import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignImportController } from './campaign-import.controller';
import { ImportFormat } from './import-format';
import { ImportValidationError } from './import-validation.error';

describe('CampaignImportController', () => {
  let campaignImport: { import: ReturnType<typeof vi.fn> };
  let controller: CampaignImportController;

  const session = (): CampaignSession => ({
    id: 'sess-1',
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-meta',
      tags: ['smoke'],
    },
    report: {
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
      createdAt: '2026-07-17T10:04:00.000Z',
    },
  });

  beforeEach(() => {
    campaignImport = { import: vi.fn() };
    controller = new CampaignImportController(campaignImport as never);
  });

  it('successfully imports and returns CampaignSession', () => {
    const restored = session();
    campaignImport.import.mockReturnValue(restored);
    const payload = JSON.stringify(restored);

    const result = controller.import({ format: 'json', payload });

    expect(campaignImport.import).toHaveBeenCalledWith(payload, ImportFormat.JSON);
    expect(result).toBe(restored);
  });

  it('response contains restored metadata', () => {
    const restored = session();
    campaignImport.import.mockReturnValue(restored);

    const result = controller.import({ format: 'json', payload: JSON.stringify(restored) });

    expect(result.metadata).toEqual({
      engineVersion: '1.0.3',
      datasetId: 'ds-meta',
      tags: ['smoke'],
    });
  });

  it('response contains restored report', () => {
    const restored = session();
    campaignImport.import.mockReturnValue(restored);

    const result = controller.import({ format: 'json', payload: JSON.stringify(restored) });

    expect(result.report.campaignId).toBe('camp-1');
    expect(result.report.verdict).toBe('PASS');
    expect(result.report).toEqual(restored.report);
  });

  it('rejects unsupported format with 400', () => {
    expect(() => controller.import({ format: 'csv', payload: '{}' })).toThrow(BadRequestException);
    expect(campaignImport.import).not.toHaveBeenCalled();
  });

  it('rejects empty payload with 400', () => {
    expect(() => controller.import({ format: 'json', payload: '' })).toThrow(BadRequestException);
    expect(campaignImport.import).not.toHaveBeenCalled();
  });

  it('maps malformed JSON ImportValidationError to 400', () => {
    campaignImport.import.mockImplementation(() => {
      throw new ImportValidationError('Invalid JSON payload', 'payload');
    });

    expect(() => controller.import({ format: 'json', payload: '{bad' })).toThrow(
      BadRequestException,
    );
    expect(() => controller.import({ format: 'json', payload: '{bad' })).toThrow(/Invalid JSON/);
  });

  it('maps invalid schema ImportValidationError to 400', () => {
    campaignImport.import.mockImplementation(() => {
      throw new ImportValidationError('Campaign session JSON must be an object', 'schema');
    });

    expect(() => controller.import({ format: 'json', payload: '[]' })).toThrow(BadRequestException);
  });

  it('maps validation error to 400', () => {
    campaignImport.import.mockImplementation(() => {
      throw new ImportValidationError('metadata is required', 'metadata');
    });

    expect(() =>
      controller.import({ format: 'json', payload: JSON.stringify({ id: 'x' }) }),
    ).toThrow(BadRequestException);
  });
});
