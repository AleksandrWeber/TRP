import { BadRequestException } from '@nestjs/common';
import type { StrategyParams } from '@trp/research';
import type { CampaignSession } from '../../../campaign-session/campaign-session';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';
import type { ReplayCampaignConfig } from '../../../campaign-replay/replay-campaign-config';

/**
 * Shared replay helpers extracted from CampaignReplayService (US089).
 * Used by Replay PipelineSteps and sync create()/buildContext().
 */

export function assertValidReplaySession(
  session: CampaignSession | null | undefined,
): asserts session is CampaignSession {
  if (session === null || session === undefined) {
    throw new BadRequestException('Campaign session is required for replay');
  }

  if (typeof session !== 'object' || Array.isArray(session)) {
    throw new BadRequestException('Invalid campaign session for replay');
  }

  if (typeof session.id !== 'string' || session.id.length === 0) {
    throw new BadRequestException('Campaign session id is required for replay');
  }

  if (!session.report || typeof session.report !== 'object') {
    throw new BadRequestException('Campaign session report is required for replay');
  }

  if (!session.metadata || typeof session.metadata !== 'object') {
    throw new BadRequestException('Campaign session metadata is required for replay');
  }

  if (
    typeof session.report.campaignId !== 'string' ||
    typeof session.report.strategyId !== 'string' ||
    typeof session.report.datasetId !== 'string'
  ) {
    throw new BadRequestException('Campaign session report is missing campaign identity fields');
  }

  if (
    typeof session.metadata.engineVersion !== 'string' ||
    session.metadata.engineVersion.length === 0
  ) {
    throw new BadRequestException('Campaign session metadata.engineVersion is required for replay');
  }
}

export function restoreReplayCampaignConfig(session: CampaignSession): ReplayCampaignConfig {
  const { report, metadata } = session;
  const paramsList: StrategyParams[] = Array.isArray(metadata.paramsList)
    ? metadata.paramsList.map((params) => ({ ...params }))
    : [];

  const config: ReplayCampaignConfig = {
    campaignId: report.campaignId,
    strategyId: report.strategyId,
    datasetId: report.datasetId,
    engineVersion: metadata.engineVersion,
    paramsList,
  };

  if (report.sliceIdentity !== undefined) {
    config.sliceIdentity = report.sliceIdentity;
  }

  if (metadata.tags !== undefined) {
    config.tags = [...metadata.tags];
  }

  return config;
}

export function cloneReplayReport(report: CampaignReport): CampaignReport {
  return {
    ...report,
    recommendations: [...report.recommendations],
  };
}
