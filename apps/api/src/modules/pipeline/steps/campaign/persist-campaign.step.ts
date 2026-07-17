import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import type { CampaignPersistenceService } from '../../../campaign-persistence/campaign-persistence.service';
import type { CampaignSessionFactory } from '../../../campaign-session/campaign-session.factory';
import { CampaignSessionStatus } from '../../../campaign-session/campaign-session-status';
import { readCampaignInput, readPersistSession, readReport } from './campaign-context';
import { CAMPAIGN_PIPELINE_STEP_METADATA } from './campaign-step-metadata';

/**
 * Campaign stage: persist completed campaign session when enabled (US087).
 * Extracted from ResearchCampaignService.persistSession (COMPLETED path).
 */
export class PersistCampaignStep extends AbstractPipelineStep {
  constructor(
    private readonly sessionFactory: CampaignSessionFactory,
    private readonly persistence: CampaignPersistenceService,
  ) {
    super(CAMPAIGN_PIPELINE_STEP_METADATA.persist);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!readPersistSession(context)) {
      return {
        ...context,
        metadata: {
          ...context.metadata,
          persisted: false,
        },
      };
    }

    const input = readCampaignInput(context);
    const report = readReport(context);
    const session = this.sessionFactory.create({
      report,
      metadata: { datasetId: input.datasetId },
    });
    this.persistence.save({
      ...session,
      status: CampaignSessionStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    return {
      ...context,
      metadata: {
        ...context.metadata,
        persisted: true,
        sessionId: session.id,
      },
    };
  }
}
