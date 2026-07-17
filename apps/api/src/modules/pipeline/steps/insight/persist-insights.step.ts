import type { InsightDomainService } from '../../../insight/insight-domain.service';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readInsightDrafts, writePersistedInsights } from './insight-pipeline-context';
import { INSIGHT_PIPELINE_STEP_METADATA } from './insight-step-metadata';

/**
 * Insight stage: persist drafts via InsightDomainService (US096).
 * InsightDomainService is the only write path.
 */
export class PersistInsightsStep extends AbstractPipelineStep {
  constructor(private readonly insights: InsightDomainService) {
    super(INSIGHT_PIPELINE_STEP_METADATA.persist);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const drafts = readInsightDrafts(context);
    const persisted = drafts.map((draft) => this.insights.create(draft));
    return writePersistedInsights(context, persisted);
  }
}
