import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import {
  readCrossAnalysisInput,
  writeCrossAnalysisPrepared,
  type CrossAnalysisPrepared,
} from './cross-analysis-pipeline-context';
import { CROSS_ANALYSIS_PIPELINE_STEP_METADATA } from './cross-analysis-step-metadata';

/**
 * Cross-analysis stage: collect Campaign / Knowledge / Insight / Experiment refs (US097).
 */
export class PrepareCrossAnalysisStep extends AbstractPipelineStep {
  constructor() {
    super(CROSS_ANALYSIS_PIPELINE_STEP_METADATA.prepare);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const input = readCrossAnalysisInput(context);
    const sessions = input.sessions.map((session) => ({ ...session }));
    const knowledgeEntries = input.knowledgeEntries.map((entry) => ({ ...entry }));
    const insights = input.insights.map((insight) => ({ ...insight }));

    const experimentIds =
      input.experimentIds && input.experimentIds.length > 0
        ? [...input.experimentIds]
        : unique([
            ...knowledgeEntries.map((e) => e.experimentId),
            ...sessions
              .map((s) => s.report.bestExperimentId)
              .filter((id): id is string => Boolean(id)),
            ...insights.map((i) => i.experimentId).filter((id): id is string => Boolean(id)),
          ]);

    const prepared: CrossAnalysisPrepared = {
      sessions,
      knowledgeEntries,
      insights,
      experimentIds,
      comparedCampaignIds: sessions.map((s) => s.id),
    };

    return writeCrossAnalysisPrepared(context, prepared);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
