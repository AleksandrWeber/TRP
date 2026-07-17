import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { extractInsightDrafts } from './insight-extraction.rules';
import { readInsightExtractionContext, writeInsightDrafts } from './insight-pipeline-context';
import { INSIGHT_PIPELINE_STEP_METADATA } from './insight-step-metadata';

/**
 * Insight stage: deterministic Insight drafts from Knowledge (US096).
 * No LLM / AI providers.
 */
export class ExtractInsightsStep extends AbstractPipelineStep {
  constructor() {
    super(INSIGHT_PIPELINE_STEP_METADATA.extract);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const extraction = readInsightExtractionContext(context);
    const drafts = extractInsightDrafts(extraction);
    return writeInsightDrafts(context, drafts);
  }
}
