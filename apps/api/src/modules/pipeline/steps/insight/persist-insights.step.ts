import type { InsightDomainService } from '../../../insight/insight-domain.service';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readWorkspaceId } from '../../workspace-context';
import { readInsightDrafts, writePersistedInsights } from './insight-pipeline-context';
import { INSIGHT_PIPELINE_STEP_METADATA } from './insight-step-metadata';

/**
 * Insight stage: persist drafts via InsightDomainService (US096).
 * InsightDomainService is the only write path.
 * Drafts do not carry workspaceId — stamped here from the PipelineContext (US109).
 */
export class PersistInsightsStep extends AbstractPipelineStep {
  constructor(private readonly insights: InsightDomainService) {
    super(INSIGHT_PIPELINE_STEP_METADATA.persist);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const workspaceId = readWorkspaceId(context);
    const drafts = readInsightDrafts(context);
    const persisted = drafts.map((draft) => this.insights.create({ ...draft, workspaceId }));
    return writePersistedInsights(context, persisted);
  }
}
