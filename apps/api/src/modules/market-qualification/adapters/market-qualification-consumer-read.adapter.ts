/**
 * RC-25 Epic 6 — Qualification consumer read adapter.
 *
 * Maps QueryPort views → immutable consumer projections.
 * Never mutates Qualification state.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  type MarketConfidenceProjection,
  type MarketHealthProjection,
  type QualificationConsumerSummary,
  type QualificationLifecycleStatusProjection,
} from '../domain/market-qualification-consumer-read-model';
import type {
  MarketQualificationConsumerReadPort,
  QualificationConsumerTargetQuery,
} from '../ports/market-qualification-consumer.port';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../ports/market-qualification.port';

const CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

@Injectable()
export class MarketQualificationConsumerReadAdapter implements MarketQualificationConsumerReadPort {
  constructor(
    @Inject(MARKET_QUALIFICATION_QUERY_PORT)
    private readonly query: MarketQualificationQueryPort,
  ) {}

  getLifecycleStatus(
    query: QualificationConsumerTargetQuery,
  ): QualificationLifecycleStatusProjection | null {
    const state = this.query.getQualificationState(query);
    if (!state) return null;
    return Object.freeze({
      workspaceId: state.workspaceId,
      exchangeScopeId: query.exchangeScopeId,
      marketSymbol: query.marketSymbol,
      targetId: state.targetId,
      state: state.state,
      ...(state.activeRunId ? { activeRunId: state.activeRunId } : {}),
      ...(state.latestCompletedRunId ? { latestCompletedRunId: state.latestCompletedRunId } : {}),
      updatedAt: state.updatedAt,
      ...CONSUMER_FLAGS,
    });
  }

  getConfidenceProjection(
    query: QualificationConsumerTargetQuery,
  ): MarketConfidenceProjection | null {
    const confidence = this.query.getMarketConfidence(query);
    if (!confidence) return null;
    return Object.freeze({
      workspaceId: confidence.workspaceId,
      exchangeScopeId: query.exchangeScopeId,
      marketSymbol: query.marketSymbol,
      targetId: confidence.targetId,
      level: confidence.level,
      ...(confidence.score !== undefined ? { score: confidence.score } : {}),
      rationaleSummary: confidence.rationaleSummary,
      sourceRunId: confidence.sourceRunId,
      asOf: confidence.asOf,
      ...CONSUMER_FLAGS,
    });
  }

  getHealthProjection(query: QualificationConsumerTargetQuery): MarketHealthProjection | null {
    const health = this.query.getMarketHealth(query);
    if (!health) return null;
    return Object.freeze({
      workspaceId: health.workspaceId,
      exchangeScopeId: query.exchangeScopeId,
      marketSymbol: query.marketSymbol,
      targetId: health.targetId,
      status: health.status,
      indicatorCount: health.indicators.length,
      sourceRunId: health.sourceRunId,
      asOf: health.asOf,
      ...CONSUMER_FLAGS,
    });
  }

  getQualificationSummary(
    query: QualificationConsumerTargetQuery,
  ): QualificationConsumerSummary | null {
    const target = this.query.getQualificationTarget(query);
    if (!target) return null;

    const lifecycle = this.getLifecycleStatus(query);
    const confidence = this.getConfidenceProjection(query);
    const health = this.getHealthProjection(query);
    const runs = this.query.listQualificationRuns(query);
    const latestRun = runs.length > 0 ? runs[runs.length - 1] : undefined;

    return Object.freeze({
      workspaceId: target.workspaceId,
      exchangeScopeId: target.exchangeScopeId,
      marketSymbol: target.marketSymbol,
      targetId: target.targetId,
      lifecycle,
      confidence,
      health,
      ...(latestRun ? { latestRunStatus: latestRun.status } : {}),
      ...CONSUMER_FLAGS,
    });
  }
}
