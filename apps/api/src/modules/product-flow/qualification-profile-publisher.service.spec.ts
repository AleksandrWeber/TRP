import { describe, expect, it, vi } from 'vitest';
import type { QualificationRunResult } from '../market-qualification/ports/market-qualification.port';
import type { MarketProfile } from '../market-profile/domain/market-profile';
import type { PublishProfileResult } from '../market-profile/ports/market-profile.port';
import {
  QualificationProfilePublisherService,
  type CompleteQualificationAndPublishCommand,
} from './qualification-profile-publisher.service';

const at = '2026-08-15T16:00:00.000Z';
const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

function dimensionPayloads() {
  return {
    volatility: {
      regimeLabel: 'moderate',
      metrics: { realized_range: 0.02, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    liquidity: {
      regimeLabel: 'moderate',
      metrics: { volume_level: 1, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    trend: {
      regimeLabel: 'low',
      metrics: { directional_bias: 0, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    structure: {
      characteristics: [
        { key: 'symbol_status', value: 'active' },
        { key: 'data_quality_flag', value: 'ok' },
      ],
    },
  };
}

function completeCommand(
  overrides?: Partial<CompleteQualificationAndPublishCommand>,
): CompleteQualificationAndPublishCommand {
  return {
    ...TARGET,
    qualificationRunId: 'run-1',
    completedAt: at,
    publishedBy: 'op-1',
    publishedAt: at,
    confidence: {
      level: 'medium',
      score: 0.6,
      rationaleSummary: 'caller-supplied only',
      asOf: at,
    },
    ...dimensionPayloads(),
    ...overrides,
  };
}

function completedResult(overrides?: Partial<QualificationRunResult>): QualificationRunResult {
  return Object.freeze({
    outcome: 'completed',
    qualificationRunId: 'run-1',
    qualificationState: Object.freeze({
      targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      workspaceId: 'ws-1',
      state: 'qualified',
      updatedAt: at,
      authorityClass: 'research_artifact',
    }) as QualificationRunResult['qualificationState'],
    marketConfidence: Object.freeze({
      targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      workspaceId: 'ws-1',
      level: 'medium',
      score: 0.6,
      rationaleSummary: 'caller-supplied only',
      sourceRunId: 'run-1',
      asOf: at,
      forcesTrade: false,
      authorityClass: 'research_artifact',
    }) as QualificationRunResult['marketConfidence'],
    forcesTrade: false,
    authorizesSession: false,
    ...overrides,
  });
}

function publishedResult(version = 1): PublishProfileResult {
  const marketProfile = Object.freeze({
    marketProfileId: `mkt-profile:v${version}`,
    workspaceId: TARGET.workspaceId,
    targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
    exchangeScopeId: TARGET.exchangeScopeId,
    marketSymbol: TARGET.marketSymbol,
    version,
    qualificationRunId: 'run-1',
    publishedAt: at,
    publishedBy: 'op-1',
    authorityClass: 'research_artifact',
    forcesTrade: false,
  }) as MarketProfile;
  return Object.freeze({
    outcome: 'published',
    marketProfileId: marketProfile.marketProfileId,
    version,
    marketProfile,
    forcesTrade: false,
    authorizesSession: false,
  });
}

function harness(overrides?: {
  runStatus?: string | null;
  complete?: QualificationRunResult;
  publish?: PublishProfileResult;
  existingVersions?: ReadonlyArray<{
    marketProfileId: string;
    qualificationRunId: string;
    version: number;
  }>;
}) {
  const complete = overrides?.complete ?? completedResult();
  const publish = overrides?.publish ?? publishedResult();
  const qualification = {
    completeQualificationRun: vi.fn(() => complete),
    failQualificationRun: vi.fn(),
    cancelQualificationRun: vi.fn(),
  };
  const qualificationQuery = {
    getQualificationRun: vi.fn(() =>
      overrides?.runStatus === null
        ? null
        : Object.freeze({
            qualificationRunId: 'run-1',
            workspaceId: TARGET.workspaceId,
            targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
            status: overrides?.runStatus ?? 'running',
            forcesTrade: false,
            authorizesSession: false,
          }),
    ),
    getQualificationState: vi.fn(() => complete.qualificationState),
    getMarketConfidence: vi.fn(() => complete.marketConfidence ?? null),
    getMarketHealth: vi.fn(() => complete.marketHealth ?? null),
  };
  const profile = {
    publishProfileVersion: vi.fn(() => publish),
  };
  const profileQuery = {
    listProfileVersions: vi.fn(() =>
      Object.freeze(
        (overrides?.existingVersions ?? []).map((row) =>
          Object.freeze({
            marketProfileId: row.marketProfileId,
            workspaceId: TARGET.workspaceId,
            targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
            exchangeScopeId: TARGET.exchangeScopeId,
            marketSymbol: TARGET.marketSymbol,
            version: row.version,
            qualificationRunId: row.qualificationRunId,
            publishedAt: at,
            authorityClass: 'research_artifact' as const,
            forcesTrade: false as const,
            authorizesSession: false as const,
          }),
        ),
      ),
    ),
    getProfileByVersion: vi.fn(() => publish.marketProfile ?? null),
    getLatestProfile: vi.fn(() => publish.marketProfile ?? null),
  };
  const publisher = new QualificationProfilePublisherService(
    qualification as never,
    qualificationQuery as never,
    profile as never,
    profileQuery as never,
  );
  return { publisher, qualification, qualificationQuery, profile, profileQuery };
}

describe('PC-15 15-b — QualificationProfilePublisherService', () => {
  it('completes Qualification then publishes a Profile version', () => {
    const { publisher, qualification, profile } = harness();
    const result = publisher.completeAndPublish(completeCommand());

    expect(qualification.completeQualificationRun).toHaveBeenCalledTimes(1);
    expect(profile.publishProfileVersion).toHaveBeenCalledTimes(1);
    expect(profile.publishProfileVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        qualificationRunId: 'run-1',
        publishedBy: 'op-1',
        volatility: expect.objectContaining({ regimeLabel: 'moderate' }),
      }),
    );
    expect(result.outcome).toBe('completed');
    expect(result.publishedProfileId).toBe('mkt-profile:v1');
    expect(result.profilePublish?.outcome).toBe('published');
    expect(result.profilePublish?.version).toBe(1);
  });

  it('does not publish when Qualification fails to complete', () => {
    const { publisher, profile } = harness({
      complete: completedResult({
        outcome: 'failed',
        rejectionReasons: ['reasons'],
      }),
    });
    const result = publisher.completeAndPublish(completeCommand());

    expect(profile.publishProfileVersion).not.toHaveBeenCalled();
    expect(result.outcome).toBe('failed');
    expect(result.publishedProfileId).toBeUndefined();
  });

  it('does not publish when Qualification is cancelled', () => {
    const { publisher, profile } = harness({
      complete: completedResult({
        outcome: 'cancelled',
        rejectionReasons: ['cancelled'],
      }),
    });
    const result = publisher.completeAndPublish(completeCommand());

    expect(profile.publishProfileVersion).not.toHaveBeenCalled();
    expect(result.outcome).toBe('cancelled');
    expect(result.publishedProfileId).toBeUndefined();
  });

  it('does not publish a second version for the same completed run', () => {
    const { publisher, qualification, profile } = harness({
      runStatus: 'completed',
      existingVersions: [
        { marketProfileId: 'mkt-profile:v1', qualificationRunId: 'run-1', version: 1 },
      ],
    });
    const result = publisher.completeAndPublish(completeCommand());

    expect(qualification.completeQualificationRun).not.toHaveBeenCalled();
    expect(profile.publishProfileVersion).not.toHaveBeenCalled();
    expect(result.publishedProfileId).toBe('mkt-profile:v1');
    expect(result.profilePublish?.version).toBe(1);
  });

  it('passes through caller-supplied confidence and does not invent scores', () => {
    const { publisher, profile } = harness();
    publisher.completeAndPublish(completeCommand());

    expect(profile.publishProfileVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        confidenceSummary: expect.objectContaining({
          level: 'medium',
          score: 0.6,
          sourceRunId: 'run-1',
          rationaleSummary: 'caller-supplied only',
        }),
      }),
    );
  });
});
