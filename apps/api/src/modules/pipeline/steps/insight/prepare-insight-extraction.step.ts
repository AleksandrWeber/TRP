import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import {
  readInsightExtractionInput,
  writeInsightExtractionContext,
  type InsightExtractionContext,
} from './insight-pipeline-context';
import { INSIGHT_PIPELINE_STEP_METADATA } from './insight-step-metadata';

/**
 * Insight stage: collect session / experiment / Knowledge refs (US096).
 */
export class PrepareInsightExtractionStep extends AbstractPipelineStep {
  constructor() {
    super(INSIGHT_PIPELINE_STEP_METADATA.prepare);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const input = readInsightExtractionInput(context);

    const campaignSessionId = input.campaignSessionId ?? input.session?.id ?? undefined;

    const experimentIds =
      input.experimentIds.length > 0
        ? [...input.experimentIds]
        : unique(
            input.knowledgeEntries
              .map((entry) => entry.experimentId)
              .filter((id): id is string => Boolean(id)),
          );

    const knowledgeEntries = input.knowledgeEntries.map((entry) => ({ ...entry }));
    const knowledgeEntryIds = knowledgeEntries.map((entry) => entry.knowledgeId);

    const extraction: InsightExtractionContext = {
      experimentIds,
      knowledgeEntries,
      knowledgeEntryIds,
    };
    if (campaignSessionId !== undefined) {
      extraction.campaignSessionId = campaignSessionId;
    }

    return writeInsightExtractionContext(context, extraction);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
