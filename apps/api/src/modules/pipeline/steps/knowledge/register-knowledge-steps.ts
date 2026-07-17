import type { KnowledgeDomainService } from '../../../knowledge/knowledge-domain.service';
import type { KnowledgeExtractionService } from '../../../knowledge/knowledge-extraction.service';
import type { PipelineRegistry } from '../../pipeline-registry';
import { ExtractKnowledgeStep } from './extract-knowledge.step';
import { PrepareKnowledgeExtractionStep } from './prepare-knowledge-extraction.step';
import { UpsertKnowledgeEntryStep } from './upsert-knowledge-entry.step';

export type KnowledgePipelineStepDeps = {
  extraction: KnowledgeExtractionService;
  knowledge: KnowledgeDomainService;
};

/**
 * Registers Knowledge PipelineStep implementations on a PipelineRegistry (US090).
 * Does not execute pipelines — registration only.
 */
export function registerKnowledgePipelineSteps(
  registry: PipelineRegistry,
  deps: KnowledgePipelineStepDeps,
): void {
  registry.register(new PrepareKnowledgeExtractionStep());
  registry.register(new ExtractKnowledgeStep(deps.extraction));
  registry.register(new UpsertKnowledgeEntryStep(deps.knowledge));
}
