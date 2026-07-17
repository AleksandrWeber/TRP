import { Injectable } from '@nestjs/common';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignSessionMetadata } from '../campaign-session/campaign-session-metadata';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { ImportValidationError } from './import-validation.error';

const STATUSES = new Set<string>(Object.values(CampaignSessionStatus));
const VERDICTS = new Set(['PASS', 'NEEDS_REVIEW', 'FAIL']);
/** Semver major.minor.patch (optional pre-release / build suffix not required). */
const ENGINE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Schema + domain validation for imported CampaignSession payloads (US064).
 * No Persistence / Repository dependency.
 */
@Injectable()
export class CampaignSessionValidator {
  validate(input: unknown): CampaignSession {
    if (!isRecord(input)) {
      throw new ImportValidationError('Campaign session JSON must be an object', 'schema');
    }

    const id = requireNonEmptyString(input, 'id');
    const status = requireStatus(input.status);
    const createdAt = requireTimestamp(input, 'createdAt');
    const completedAt =
      input.completedAt === undefined ? undefined : requireTimestamp(input, 'completedAt');

    if (completedAt !== undefined && Date.parse(completedAt) < Date.parse(createdAt)) {
      throw new ImportValidationError(
        'completedAt must be greater than or equal to createdAt',
        'completedAt',
      );
    }

    const metadata = this.validateMetadata(input.metadata);
    const report = this.validateReport(input.report);

    return {
      id,
      status,
      createdAt,
      ...(completedAt !== undefined ? { completedAt } : {}),
      metadata,
      report,
    };
  }

  validateMetadata(value: unknown): CampaignSessionMetadata {
    if (value === undefined || value === null) {
      throw new ImportValidationError('Campaign session metadata is required', 'metadata');
    }
    if (!isRecord(value)) {
      throw new ImportValidationError('Campaign session metadata must be an object', 'metadata');
    }

    const engineVersion = requireNonEmptyString(value, 'engineVersion', 'metadata.engineVersion');
    if (!ENGINE_VERSION_PATTERN.test(engineVersion)) {
      throw new ImportValidationError(
        'metadata.engineVersion must be a semver string (major.minor.patch)',
        'metadata.engineVersion',
      );
    }

    const metadata: CampaignSessionMetadata = { engineVersion };

    if (value.datasetId !== undefined) {
      metadata.datasetId = requireStringWhenPresent(value, 'datasetId', 'metadata.datasetId');
    }

    if (value.tags !== undefined) {
      if (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string')) {
        throw new ImportValidationError(
          'metadata.tags must be a string array when present',
          'metadata.tags',
        );
      }
      metadata.tags = value.tags;
    }

    return metadata;
  }

  validateReport(value: unknown): CampaignReport {
    if (value === undefined || value === null) {
      throw new ImportValidationError('Campaign session report is required', 'report');
    }
    if (!isRecord(value)) {
      throw new ImportValidationError('Campaign session report must be an object', 'report');
    }

    const verdict = value.verdict;
    if (typeof verdict !== 'string' || !VERDICTS.has(verdict)) {
      throw new ImportValidationError(
        'report.verdict must be PASS, NEEDS_REVIEW, or FAIL',
        'report.verdict',
      );
    }

    if (
      !Array.isArray(value.recommendations) ||
      !value.recommendations.every((item) => typeof item === 'string')
    ) {
      throw new ImportValidationError(
        'report.recommendations must be a string array',
        'report.recommendations',
      );
    }

    const report: CampaignReport = {
      campaignId: requireNonEmptyString(value, 'campaignId', 'report.campaignId'),
      strategyId: requireNonEmptyString(value, 'strategyId', 'report.strategyId'),
      datasetId: requireNonEmptyString(value, 'datasetId', 'report.datasetId'),
      totalRuns: requireNumber(value, 'totalRuns', 'report.totalRuns'),
      passCount: requireNumber(value, 'passCount', 'report.passCount'),
      failCount: requireNumber(value, 'failCount', 'report.failCount'),
      needsReviewCount: requireNumber(value, 'needsReviewCount', 'report.needsReviewCount'),
      bestExperimentId: requireNullableString(value, 'bestExperimentId', 'report.bestExperimentId'),
      bestProfitFactor: requireNullableNumber(value, 'bestProfitFactor', 'report.bestProfitFactor'),
      bestReturn: requireNullableNumber(value, 'bestReturn', 'report.bestReturn'),
      bestExpectancy: requireNullableNumber(value, 'bestExpectancy', 'report.bestExpectancy'),
      lowestDrawdown: requireNullableNumber(value, 'lowestDrawdown', 'report.lowestDrawdown'),
      verdict: verdict as CampaignReport['verdict'],
      recommendations: value.recommendations,
      createdAt: requireTimestamp(value, 'createdAt', 'report.createdAt'),
    };

    if (value.sliceIdentity !== undefined) {
      report.sliceIdentity = requireStringWhenPresent(
        value,
        'sliceIdentity',
        'report.sliceIdentity',
      );
    }

    return report;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(source: Record<string, unknown>, key: string, field = key): string {
  const value = source[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ImportValidationError(`${field} must be a non-empty string`, field);
  }
  return value;
}

function requireStringWhenPresent(
  source: Record<string, unknown>,
  key: string,
  field = key,
): string {
  const value = source[key];
  if (typeof value !== 'string') {
    throw new ImportValidationError(`${field} must be a string when present`, field);
  }
  return value;
}

function requireStatus(value: unknown): CampaignSessionStatus {
  if (typeof value !== 'string' || !STATUSES.has(value)) {
    throw new ImportValidationError(
      `status must be one of: ${Object.values(CampaignSessionStatus).join(', ')}`,
      'status',
    );
  }
  return value as CampaignSessionStatus;
}

function requireTimestamp(source: Record<string, unknown>, key: string, field = key): string {
  const value = requireNonEmptyString(source, key, field);
  if (Number.isNaN(Date.parse(value))) {
    throw new ImportValidationError(`${field} must be a valid ISO-8601 timestamp`, field);
  }
  return value;
}

function requireNumber(source: Record<string, unknown>, key: string, field = key): number {
  const value = source[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ImportValidationError(`${field} must be a number`, field);
  }
  return value;
}

function requireNullableNumber(
  source: Record<string, unknown>,
  key: string,
  field = key,
): number | null {
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ImportValidationError(`${field} must be a number or null`, field);
  }
  return value;
}

function requireNullableString(
  source: Record<string, unknown>,
  key: string,
  field = key,
): string | null {
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new ImportValidationError(`${field} must be a string or null`, field);
  }
  return value;
}
