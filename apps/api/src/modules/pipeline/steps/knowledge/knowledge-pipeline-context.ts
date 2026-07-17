import type { Experiment } from '../../../experiments/experiment';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
import type { KnowledgeEntryDraft } from '../../../knowledge/knowledge-extraction.service';
import type { PipelineContext } from '../../pipeline-context';

/**
 * Typed accessors for Knowledge PipelineContext payloads (US090).
 * Context remains structurally generic — helpers only cast known keys.
 */

export function readKnowledgeExperiment(context: PipelineContext): Experiment {
  return context.input.experiment as Experiment;
}

export function writePreparedKnowledge(
  context: PipelineContext,
  experiment: Experiment,
  report: CampaignReport,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      experiment,
      report,
    },
  };
}

export function readPreparedExperiment(context: PipelineContext): Experiment {
  return (context.variables.experiment ?? context.input.experiment) as Experiment;
}

export function writeExtractedKnowledge(
  context: PipelineContext,
  extracted: KnowledgeEntryDraft,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      extracted,
    },
  };
}

export function readExtractedKnowledge(context: PipelineContext): KnowledgeEntryDraft {
  return context.variables.extracted as KnowledgeEntryDraft;
}

export function writeKnowledgeEntry(
  context: PipelineContext,
  entry: KnowledgeEntry,
): PipelineContext {
  return {
    ...context,
    output: {
      ...context.output,
      knowledgeEntry: entry,
    },
  };
}

export function readKnowledgeEntry(context: PipelineContext): KnowledgeEntry {
  return context.output.knowledgeEntry as KnowledgeEntry;
}
