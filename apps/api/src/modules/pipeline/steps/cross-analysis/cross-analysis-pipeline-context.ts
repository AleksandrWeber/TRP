import type { CampaignSession } from '../../../campaign-session/campaign-session';
import type {
  CrossCampaignAnalysisResult,
  CrossCampaignAnalysisResultPayload,
} from '../../../cross-campaign-analysis/cross-campaign-analysis-result';
import type { CrossCampaignFinding } from '../../../cross-campaign-analysis/cross-campaign-finding';
import type { Insight } from '../../../insight/insight';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
import type { PipelineContext } from '../../pipeline-context';

/**
 * Typed accessors for Cross-Campaign Analysis PipelineContext (US097).
 * Context remains structurally generic.
 */

export type CrossAnalysisInput = {
  sessions: CampaignSession[];
  knowledgeEntries: KnowledgeEntry[];
  insights: Insight[];
  experimentIds?: string[];
};

export type CrossAnalysisPrepared = {
  sessions: CampaignSession[];
  knowledgeEntries: KnowledgeEntry[];
  insights: Insight[];
  experimentIds: string[];
  comparedCampaignIds: string[];
};

export function readCrossAnalysisInput(context: PipelineContext): CrossAnalysisInput {
  return {
    sessions: Array.isArray(context.input.sessions)
      ? (context.input.sessions as CampaignSession[])
      : [],
    knowledgeEntries: Array.isArray(context.input.knowledgeEntries)
      ? (context.input.knowledgeEntries as KnowledgeEntry[])
      : [],
    insights: Array.isArray(context.input.insights) ? (context.input.insights as Insight[]) : [],
    experimentIds: Array.isArray(context.input.experimentIds)
      ? (context.input.experimentIds as string[])
      : undefined,
  };
}

export function writeCrossAnalysisPrepared(
  context: PipelineContext,
  prepared: CrossAnalysisPrepared,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      crossAnalysisPrepared: prepared,
    },
  };
}

export function readCrossAnalysisPrepared(context: PipelineContext): CrossAnalysisPrepared {
  return context.variables.crossAnalysisPrepared as CrossAnalysisPrepared;
}

export function writeCrossAnalysisFindings(
  context: PipelineContext,
  findings: CrossCampaignFinding[],
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      crossAnalysisFindings: findings,
    },
  };
}

export function readCrossAnalysisFindings(context: PipelineContext): CrossCampaignFinding[] {
  const findings = context.variables.crossAnalysisFindings;
  return Array.isArray(findings) ? (findings as CrossCampaignFinding[]) : [];
}

export function writeCrossAnalysisResult(
  context: PipelineContext,
  result: CrossCampaignAnalysisResultPayload,
): PipelineContext {
  return {
    ...context,
    output: {
      ...context.output,
      crossCampaignAnalysisResult: result,
    },
  };
}

export function readCrossAnalysisResult(
  context: PipelineContext,
): CrossCampaignAnalysisResultPayload {
  return context.output.crossCampaignAnalysisResult as CrossCampaignAnalysisResultPayload;
}

export type { CrossCampaignAnalysisResult };
