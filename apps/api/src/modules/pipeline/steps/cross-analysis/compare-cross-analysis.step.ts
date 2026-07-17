import { compareCampaignBundles } from '../../../cross-campaign-analysis/cross-campaign-analysis.rules';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import {
  readCrossAnalysisPrepared,
  writeCrossAnalysisFindings,
} from './cross-analysis-pipeline-context';
import { CROSS_ANALYSIS_PIPELINE_STEP_METADATA } from './cross-analysis-step-metadata';

/**
 * Cross-analysis stage: deterministic campaign comparison (US097).
 * No LLM / AI providers.
 */
export class CompareCrossAnalysisStep extends AbstractPipelineStep {
  constructor() {
    super(CROSS_ANALYSIS_PIPELINE_STEP_METADATA.compare);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const prepared = readCrossAnalysisPrepared(context);
    const findings = compareCampaignBundles({
      sessions: prepared.sessions,
      knowledgeEntries: prepared.knowledgeEntries,
      insights: prepared.insights,
      experimentIds: prepared.experimentIds,
    });
    return writeCrossAnalysisFindings(context, findings);
  }
}
