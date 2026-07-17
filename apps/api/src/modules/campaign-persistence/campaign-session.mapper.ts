import { Injectable } from '@nestjs/common';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignSessionMetadata } from '../campaign-session/campaign-session-metadata';
import type { CampaignRecord } from './campaign-record';

/**
 * Maps CampaignSession ↔ CampaignRecord.
 * Data transformation only — no persistence logic.
 */
@Injectable()
export class CampaignSessionMapper {
  toRecord(session: CampaignSession): CampaignRecord {
    return {
      id: session.id,
      sessionId: session.id,
      workspaceId: session.workspaceId,
      status: session.status,
      createdAt: session.createdAt,
      completedAt: session.completedAt ?? null,
      metadata: cloneMetadata(session.metadata),
      report: cloneReport(session.report),
    };
  }

  toSession(record: CampaignRecord): CampaignSession {
    const session: CampaignSession = {
      id: record.sessionId,
      workspaceId: record.workspaceId,
      status: record.status,
      createdAt: record.createdAt,
      report: cloneReport(record.report),
      metadata: cloneMetadata(record.metadata),
    };

    if (record.completedAt != null) {
      session.completedAt = record.completedAt;
    }

    return session;
  }
}

function cloneMetadata(metadata: CampaignSessionMetadata): CampaignSessionMetadata {
  const cloned: CampaignSessionMetadata = {
    engineVersion: metadata.engineVersion,
  };
  if (metadata.datasetId !== undefined) {
    cloned.datasetId = metadata.datasetId;
  }
  if (metadata.tags !== undefined) {
    cloned.tags = [...metadata.tags];
  }
  return cloned;
}

function cloneReport(report: CampaignReport): CampaignReport {
  const cloned: CampaignReport = {
    campaignId: report.campaignId,
    strategyId: report.strategyId,
    datasetId: report.datasetId,
    totalRuns: report.totalRuns,
    passCount: report.passCount,
    failCount: report.failCount,
    needsReviewCount: report.needsReviewCount,
    bestExperimentId: report.bestExperimentId,
    bestProfitFactor: report.bestProfitFactor,
    bestReturn: report.bestReturn,
    bestExpectancy: report.bestExpectancy,
    lowestDrawdown: report.lowestDrawdown,
    verdict: report.verdict,
    recommendations: [...report.recommendations],
    createdAt: report.createdAt,
  };
  if (report.sliceIdentity !== undefined) {
    cloned.sliceIdentity = report.sliceIdentity;
  }
  return cloned;
}
