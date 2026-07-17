import type { KnowledgeDomainService } from '../../../knowledge/knowledge-domain.service';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readWorkspaceId } from '../../workspace-context';
import { readExtractedKnowledge, writeKnowledgeEntry } from './knowledge-pipeline-context';
import { KNOWLEDGE_PIPELINE_STEP_METADATA } from './knowledge-step-metadata';

/**
 * Knowledge stage: upsert one KnowledgeEntry per Experiment (US090).
 * Extracted from KnowledgeDomainService.createFromExperiment → create().
 */
export class UpsertKnowledgeEntryStep extends AbstractPipelineStep {
  constructor(private readonly knowledge: KnowledgeDomainService) {
    super(KNOWLEDGE_PIPELINE_STEP_METADATA.upsert);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const extracted = readExtractedKnowledge(context);
    const entry = this.knowledge.create({
      workspaceId: readWorkspaceId(context),
      experimentId: extracted.experimentId,
      title: extracted.title,
      summary: extracted.summary,
      tags: extracted.tags,
      insights: extracted.insights,
      metadata: extracted.metadata,
      createdAt: extracted.createdAt,
    });
    return writeKnowledgeEntry(context, entry);
  }
}
