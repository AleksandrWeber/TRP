import type { Experiment } from '../../../experiments/experiment';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
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
  extracted: KnowledgeEntry,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      extracted,
    },
  };
}

export function readExtractedKnowledge(context: PipelineContext): KnowledgeEntry {
  return context.variables.extracted as KnowledgeEntry;
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
