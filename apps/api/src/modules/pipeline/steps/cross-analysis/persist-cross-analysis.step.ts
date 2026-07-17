import type { CreateInsightInput } from '../../../insight/insight-domain.service';
import type { InsightDomainService } from '../../../insight/insight-domain.service';
import { InsightSource } from '../../../insight/insight-source';
import { InsightType } from '../../../insight/insight-type';
import type { CrossCampaignFinding } from '../../../cross-campaign-analysis/cross-campaign-finding';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import {
  readCrossAnalysisFindings,
  readCrossAnalysisPrepared,
  writeCrossAnalysisResult,
} from './cross-analysis-pipeline-context';
import { CROSS_ANALYSIS_PIPELINE_STEP_METADATA } from './cross-analysis-step-metadata';

/**
 * Cross-analysis stage: persist findings as Insights (US097).
 * InsightDomainService is the only write path.
 */
export class PersistCrossAnalysisStep extends AbstractPipelineStep {
  constructor(private readonly insights: InsightDomainService) {
    super(CROSS_ANALYSIS_PIPELINE_STEP_METADATA.persist);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const prepared = readCrossAnalysisPrepared(context);
    const findings = readCrossAnalysisFindings(context);

    const generatedInsightIds: string[] = [];
    for (const finding of findings) {
      const created = this.insights.create(toInsightInput(finding));
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

function toInsightInput(finding: CrossCampaignFinding): CreateInsightInput {
  return {
    campaignSessionId: finding.campaignIds[0],
    experimentId: finding.experimentIds[0],
    knowledgeEntryIds: finding.knowledgeEntryIds,
    type: mapFindingType(finding.kind),
    title: finding.title,
    summary: finding.summary,
    confidence: finding.confidence,
    sources: [InsightSource.Campaign, InsightSource.Knowledge],
    metadata: {
      model: 'cross-campaign-deterministic',
      promptVersion: 'cross-analysis-1.0.0',
    },
  };
}

function mapFindingType(kind: CrossCampaignFinding['kind']): InsightType {
  switch (kind) {
    case 'repeated_finding':
      return InsightType.PATTERN;
    case 'recurring_pattern':
      return InsightType.PATTERN;
    case 'conflicting_conclusion':
      return InsightType.ANOMALY;
    case 'stable_trend':
      return InsightType.TREND;
    case 'unique_observation':
      return InsightType.OBSERVATION;
  }
}
