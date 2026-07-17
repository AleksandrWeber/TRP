import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RESEARCH_ENGINE_VERSION } from '../knowledge/knowledge.version';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSession } from './campaign-session';
import type { CampaignSessionMetadata } from './campaign-session-metadata';
import { CampaignSessionStatus } from './campaign-session-status';

export type CreateCampaignSessionInput = {
  report: CampaignReport;
  metadata?: Partial<CampaignSessionMetadata>;
};

/**
 * Creates new CampaignSession instances in CREATED state.
 * No persistence — domain factory only.
 */
@Injectable()
export class CampaignSessionFactory {
  create(input: CreateCampaignSessionInput): CampaignSession {
    const metadata: CampaignSessionMetadata = {
      engineVersion: input.metadata?.engineVersion ?? RESEARCH_ENGINE_VERSION,
    };

    if (input.metadata?.datasetId !== undefined) {
      metadata.datasetId = input.metadata.datasetId;
    }

    if (input.metadata?.tags !== undefined) {
      metadata.tags = [...input.metadata.tags];
    }

    return {
      id: randomUUID(),
      status: CampaignSessionStatus.CREATED,
      createdAt: new Date().toISOString(),
      report: input.report,
      metadata,
    };
  }
}
