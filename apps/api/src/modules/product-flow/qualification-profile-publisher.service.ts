import { Inject, Injectable } from '@nestjs/common';
import type {
  CompleteQualificationRun,
  QualificationRunResult,
} from '../market-qualification/ports/market-qualification.port';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  type MarketQualificationQueryPort,
  type MarketQualificationServicePort,
} from '../market-qualification/ports/market-qualification.port';
import type {
  MarketProfileSummary,
  PublishMarketProfile,
  PublishProfileResult,
} from '../market-profile/ports/market-profile.port';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
  type MarketProfileQueryPort,
  type MarketProfileServicePort,
} from '../market-profile/ports/market-profile.port';

const FLAGS = Object.freeze({
  forcesTrade: false as const,
  authorizesSession: false as const,
});

export type CompleteQualificationAndPublishCommand = CompleteQualificationRun &
  Readonly<{
    exchangeScopeId: string;
    marketSymbol: string;
    publishedBy: string;
    publishedAt?: string;
    volatility: PublishMarketProfile['volatility'];
    liquidity: PublishMarketProfile['liquidity'];
    trend: PublishMarketProfile['trend'];
    structure: PublishMarketProfile['structure'];
    confidenceSummary?: PublishMarketProfile['confidenceSummary'];
  }>;

export type QualificationProfilePublishResult = QualificationRunResult &
  Readonly<{
    profilePublish?: PublishProfileResult;
  }>;

/**
 * PC-15 15-b — Qualification completion publishes a Market Profile version.
 *
 * Qualification remains qualification owner (complete is delegated).
 * Profile remains profile-version owner (publish is delegated).
 * Qualification never imports Profile. Profile never owns Qualification.
 * Dimension payloads stay caller-supplied. No scoring. No new calculations.
 */
@Injectable()
export class QualificationProfilePublisherService {
  constructor(
    @Inject(MARKET_QUALIFICATION_SERVICE_PORT)
    private readonly qualification: MarketQualificationServicePort,
    @Inject(MARKET_QUALIFICATION_QUERY_PORT)
    private readonly qualificationQuery: MarketQualificationQueryPort,
    @Inject(MARKET_PROFILE_SERVICE_PORT)
    private readonly profile: MarketProfileServicePort,
    @Inject(MARKET_PROFILE_QUERY_PORT)
    private readonly profileQuery: MarketProfileQueryPort,
  ) {}

  completeAndPublish(
    command: CompleteQualificationAndPublishCommand,
  ): QualificationProfilePublishResult {
    const existing = this.findPublishedForRun(command);
    if (existing) {
      return this.alreadyPublished(command, existing);
    }

    const completed = this.completeIfNeeded(command);
    if (completed.outcome !== 'completed') {
      return Object.freeze({ ...completed });
    }

    const publish = this.profile.publishProfileVersion({
      workspaceId: command.workspaceId,
      exchangeScopeId: command.exchangeScopeId,
      marketSymbol: command.marketSymbol,
      qualificationRunId: command.qualificationRunId,
      volatility: command.volatility,
      liquidity: command.liquidity,
      trend: command.trend,
      structure: command.structure,
      confidenceSummary: this.resolveConfidenceSummary(command, completed),
      publishedBy: command.publishedBy,
      publishedAt: command.publishedAt ?? command.completedAt,
    });

    return Object.freeze({
      ...completed,
      ...(publish.outcome === 'published' ? { publishedProfileId: publish.marketProfileId } : {}),
      profilePublish: publish,
      ...(publish.outcome === 'rejected'
        ? {
            rejectionReasons: [
              ...(completed.rejectionReasons ?? []),
              ...(publish.rejectionReasons ?? []),
            ],
          }
        : {}),
    });
  }

  private completeIfNeeded(
    command: CompleteQualificationAndPublishCommand,
  ): QualificationRunResult {
    const run = this.qualificationQuery.getQualificationRun({
      workspaceId: command.workspaceId,
      qualificationRunId: command.qualificationRunId,
    });
    if (run?.status === 'completed') {
      const target = {
        workspaceId: command.workspaceId,
        exchangeScopeId: command.exchangeScopeId,
        marketSymbol: command.marketSymbol,
      };
      const qualificationState = this.qualificationQuery.getQualificationState(target);
      const marketConfidence = this.qualificationQuery.getMarketConfidence(target);
      const marketHealth = this.qualificationQuery.getMarketHealth(target);
      return Object.freeze({
        outcome: 'completed' as const,
        qualificationRunId: run.qualificationRunId,
        qualificationState,
        ...(marketConfidence ? { marketConfidence } : {}),
        ...(marketHealth ? { marketHealth } : {}),
        ...FLAGS,
      });
    }

    return this.qualification.completeQualificationRun({
      workspaceId: command.workspaceId,
      qualificationRunId: command.qualificationRunId,
      completedAt: command.completedAt,
      confidence: command.confidence,
      health: command.health,
    });
  }

  private alreadyPublished(
    command: CompleteQualificationAndPublishCommand,
    existing: MarketProfileSummary,
  ): QualificationProfilePublishResult {
    const completed = this.completeIfNeeded(command);
    const marketProfile = this.profileQuery.getProfileByVersion({
      workspaceId: command.workspaceId,
      exchangeScopeId: command.exchangeScopeId,
      marketSymbol: command.marketSymbol,
      version: existing.version,
    });
    return Object.freeze({
      ...completed,
      outcome: completed.outcome === 'completed' ? 'completed' : completed.outcome,
      publishedProfileId: existing.marketProfileId,
      profilePublish: Object.freeze({
        outcome: 'published' as const,
        marketProfileId: existing.marketProfileId,
        version: existing.version,
        ...(marketProfile ? { marketProfile } : {}),
        ...FLAGS,
      }),
    });
  }

  private findPublishedForRun(
    command: CompleteQualificationAndPublishCommand,
  ): MarketProfileSummary | null {
    return (
      this.profileQuery
        .listProfileVersions({
          workspaceId: command.workspaceId,
          exchangeScopeId: command.exchangeScopeId,
          marketSymbol: command.marketSymbol,
        })
        .find((summary) => summary.qualificationRunId === command.qualificationRunId) ?? null
    );
  }

  private resolveConfidenceSummary(
    command: CompleteQualificationAndPublishCommand,
    completed: QualificationRunResult,
  ): PublishMarketProfile['confidenceSummary'] {
    if (command.confidenceSummary) {
      return {
        ...command.confidenceSummary,
        sourceRunId: command.qualificationRunId,
      };
    }
    const snapshot = completed.marketConfidence;
    if (snapshot) {
      return {
        level: snapshot.level,
        ...(snapshot.score !== undefined ? { score: snapshot.score } : {}),
        sourceRunId: command.qualificationRunId,
        rationaleSummary: snapshot.rationaleSummary,
      };
    }
    return {
      level: 'unknown',
      sourceRunId: command.qualificationRunId,
      rationaleSummary: 'pass-through from completed qualification; no profile scoring',
    };
  }
}
