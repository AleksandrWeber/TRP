import type { InsightDomainService } from '../../../insight/insight-domain.service';
import { InsightGenerationService } from '../../../insight/insight-generation.service';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readWorkspaceId } from '../../workspace-context';
import {
  readCrossAnalysisFindings,
  readCrossAnalysisPrepared,
  writeCrossAnalysisResult,
} from './cross-analysis-pipeline-context';
import { CROSS_ANALYSIS_PIPELINE_STEP_METADATA } from './cross-analysis-step-metadata';

/**
 * Cross-analysis stage: persist findings as Insights (US097).
 * Mapping is delegated to InsightGenerationService.
 * InsightDomainService is the only write path.
 */
export class PersistCrossAnalysisStep extends AbstractPipelineStep {
  constructor(
    private readonly insights: InsightDomainService,
    private readonly insightGeneration: InsightGenerationService,
  ) {
    super(CROSS_ANALYSIS_PIPELINE_STEP_METADATA.persist);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const workspaceId = readWorkspaceId(context);
    const prepared = readCrossAnalysisPrepared(context);
    const findings = readCrossAnalysisFindings(context);

    const generatedInsightIds: string[] = [];
    for (const finding of findings) {
      const created = this.insights.create({
        ...this.insightGeneration.toInsightInput(finding),
        workspaceId,
      });
      generatedInsightIds.push(created.id);
    }

    return writeCrossAnalysisResult(context, {
      comparedCampaignIds: prepared.comparedCampaignIds,
      findings,
      statistics: {
        campaignCount: prepared.sessions.length,
        experimentCount: prepared.experimentIds.length,
        knowledgeEntryCount: prepared.knowledgeEntries.length,
        insightCount: prepared.insights.length,
        findingCount: findings.length,
      },
      generatedInsightIds,
    });
  }
}
