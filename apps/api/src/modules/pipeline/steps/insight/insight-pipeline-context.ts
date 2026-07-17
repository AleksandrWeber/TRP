import type { CampaignSession } from '../../../campaign-session/campaign-session';
import type { InsightDraft } from '../../../insight/insight-domain.service';
import type { Insight } from '../../../insight/insight';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
import type { PipelineContext } from '../../pipeline-context';

/**
 * Typed accessors for Insight PipelineContext payloads (US096).
 * Context remains structurally generic — helpers only cast known keys.
 */

export type InsightExtractionInput = {
  campaignSessionId?: string;
  experimentIds: string[];
  knowledgeEntries: KnowledgeEntry[];
  session?: CampaignSession;
};

export type InsightExtractionContext = {
  campaignSessionId?: string;
  experimentIds: string[];
  knowledgeEntryIds: string[];
  knowledgeEntries: KnowledgeEntry[];
};

export function readInsightExtractionInput(context: PipelineContext): InsightExtractionInput {
  const knowledgeEntries = Array.isArray(context.input.knowledgeEntries)
    ? (context.input.knowledgeEntries as KnowledgeEntry[])
    : [];

  const experimentIds = Array.isArray(context.input.experimentIds)
    ? (context.input.experimentIds as string[])
    : [];

  const input: InsightExtractionInput = {
    experimentIds,
    knowledgeEntries,
  };

  if (typeof context.input.campaignSessionId === 'string') {
    input.campaignSessionId = context.input.campaignSessionId;
  }

  if (context.input.session !== undefined) {
    input.session = context.input.session as CampaignSession;
  }

  return input;
}

export function writeInsightExtractionContext(
  context: PipelineContext,
  extraction: InsightExtractionContext,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      insightExtraction: extraction,
    },
  };
}

export function readInsightExtractionContext(context: PipelineContext): InsightExtractionContext {
  return context.variables.insightExtraction as InsightExtractionContext;
}

export function writeInsightDrafts(
  context: PipelineContext,
  drafts: InsightDraft[],
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      insightDrafts: drafts,
    },
  };
}

export function readInsightDrafts(context: PipelineContext): InsightDraft[] {
  const drafts = context.variables.insightDrafts;
  return Array.isArray(drafts) ? (drafts as InsightDraft[]) : [];
}

export function writePersistedInsights(
  context: PipelineContext,
  insights: Insight[],
): PipelineContext {
  return {
    ...context,
    output: {
      ...context.output,
      insights,
    },
  };
}

export function readPersistedInsights(context: PipelineContext): Insight[] {
  const insights = context.output.insights;
  return Array.isArray(insights) ? (insights as Insight[]) : [];
}
