import { describe, expect, it } from 'vitest';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignSessionValidator } from './campaign-session.validator';
import { ImportValidationError } from './import-validation.error';

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

describe('CampaignSessionValidator', () => {
  const validator = new CampaignSessionValidator();

  it('accepts a valid session', () => {
    const source = sampleSession();
    expect(validator.validate(source)).toEqual(source);
  });

  it('rejects invalid schema (non-object)', () => {
    expect(() => validator.validate([])).toThrow(ImportValidationError);
    expect(() => validator.validate('session')).toThrow(/must be an object/);
  });

  it('rejects missing metadata', () => {
    const rest = { ...sampleSession(), metadata: undefined };
    delete (rest as { metadata?: unknown }).metadata;
    expect(() => validator.validate(rest)).toThrow(ImportValidationError);
    expect(() => validator.validate(rest)).toThrow(/metadata is required/);
  });

  it('rejects missing report', () => {
    const rest = { ...sampleSession() };
    delete (rest as { report?: unknown }).report;
    expect(() => validator.validate(rest)).toThrow(ImportValidationError);
    expect(() => validator.validate(rest)).toThrow(/report is required/);
  });

  it('rejects invalid version', () => {
    const session = sampleSession();
    session.metadata.engineVersion = 'not-a-version';
    expect(() => validator.validate(session)).toThrow(ImportValidationError);
    expect(() => validator.validate(session)).toThrow(/semver/);
  });

  it('rejects invalid timestamps', () => {
    const session = sampleSession();
    session.createdAt = 'not-a-date';
    expect(() => validator.validate(session)).toThrow(ImportValidationError);
    expect(() => validator.validate(session)).toThrow(/ISO-8601/);
  });

  it('rejects completedAt before createdAt', () => {
    const session = sampleSession();
    session.completedAt = '2026-07-17T09:00:00.000Z';
    expect(() => validator.validate(session)).toThrow(/completedAt must be greater/);
  });

  it('rejects invalid metadata shape', () => {
    expect(() => validator.validateMetadata('bad')).toThrow(/metadata must be an object/);
  });

  it('rejects invalid report shape', () => {
    expect(() => validator.validateReport(null)).toThrow(/report is required/);
  });

  it('rejects missing required session fields', () => {
    const session = sampleSession() as Record<string, unknown>;
    delete session.id;
    expect(() => validator.validate(session)).toThrow(/id must be a non-empty string/);
  });
});
