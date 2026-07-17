import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { StrategyParams } from '@trp/research';
import type { CampaignSession } from '../campaign-session/campaign-session';
import { CampaignReportService } from '../research-campaign/campaign-report.service';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import { ResearchCampaignService } from '../research-campaign/research-campaign.service';
import type { ReplayCampaignConfig } from './replay-campaign-config';
import type { ReplayContext } from './replay-context';
import type { ReplayResult } from './replay-result';
import { ReplayStatus } from './replay-status';

/**
 * Prepares and executes Campaign Replay from a CampaignSession (US066–US067).
 * Reuses ResearchCampaignService; does not write History/Persistence when executing.
 */
@Injectable()
export class CampaignReplayService {
  constructor(
    private readonly campaigns: ResearchCampaignService,
    private readonly reports: CampaignReportService,
  ) {}

  create(session: CampaignSession): ReplayResult {
    const context = this.buildContext(session);
    return this.toReadyResult(context);
  }

  /**
   * Builds an in-memory ReplayContext (validate session → config + report copy).
   */
  buildContext(session: CampaignSession): ReplayContext {
    this.assertValidSession(session);

    const campaignConfig = this.restoreCampaignConfig(session);
    const report = cloneReport(session.report);

    return {
      sourceSession: session,
      campaignConfig,
      report,
    };
  }

  /**
   * Executes a transient replay via ResearchCampaignService.
   * Flow: session → ReplayContext → ResearchCampaignService → CampaignReport → ReplayResult.
   * Status: READY → RUNNING → COMPLETED | FAILED.
   * No Repository / Persistence / History writes (`persistSession: false`).
   */
  async execute(session: CampaignSession): Promise<ReplayResult> {
    const context = this.buildContext(session);
    const replayId = randomUUID();
    const startedAt = new Date().toISOString();
    const { campaignConfig } = context;

    const running: ReplayResult = {
      replayId,
      sourceSessionId: context.sourceSession.id,
      startedAt,
      status: ReplayStatus.RUNNING,
      campaignConfig,
      report: context.report,
    };

    if (campaignConfig.paramsList.length === 0) {
      return {
        ...running,
        completedAt: new Date().toISOString(),
        status: ReplayStatus.FAILED,
      };
    }

    try {
      const campaignResult = await this.campaigns.run(
        {
          datasetId: campaignConfig.datasetId,
          strategyId: campaignConfig.strategyId,
          paramsList: campaignConfig.paramsList,
        },
        { persistSession: false },
      );

      const report = this.reports.build(campaignResult.summary, campaignResult.experiments, {
        sliceIdentity: campaignResult.sliceIdentity,
      });

      return {
        replayId,
        sourceSessionId: context.sourceSession.id,
        startedAt,
        completedAt: new Date().toISOString(),
        status: ReplayStatus.COMPLETED,
        campaignConfig,
        report,
      };
    } catch {
      return {
        replayId,
        sourceSessionId: context.sourceSession.id,
        startedAt,
        completedAt: new Date().toISOString(),
        status: ReplayStatus.FAILED,
        campaignConfig,
        report: context.report,
      };
    }
  }

  private toReadyResult(context: ReplayContext): ReplayResult {
    return {
      replayId: randomUUID(),
      startedAt: new Date().toISOString(),
      sourceSessionId: context.sourceSession.id,
      status: ReplayStatus.READY,
      campaignConfig: context.campaignConfig,
      report: context.report,
    };
  }

  private restoreCampaignConfig(session: CampaignSession): ReplayCampaignConfig {
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

  private assertValidSession(
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
      throw new BadRequestException(
        'Campaign session metadata.engineVersion is required for replay',
      );
    }
  }
}

function cloneReport(report: CampaignReport): CampaignReport {
  return {
    ...report,
    recommendations: [...report.recommendations],
  };
}
