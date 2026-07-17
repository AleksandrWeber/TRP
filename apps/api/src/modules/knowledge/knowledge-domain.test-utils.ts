import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineHookRegistry } from '../pipeline/pipeline-hook-registry';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { registerKnowledgePipelineSteps } from '../pipeline/steps/knowledge/register-knowledge-steps';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';

/**
 * Wires KnowledgeDomainService with PipelineExecutor + Knowledge steps (US090 tests).
 */
export function createKnowledgeDomainService(extraction = new KnowledgeExtractionService()): {
  service: KnowledgeDomainService;
  extraction: KnowledgeExtractionService;
  templates: PipelineTemplateService;
  pipelines: PipelineDomainService;
  executor: PipelineExecutor;
  registry: PipelineRegistry;
} {
  const registry = new PipelineRegistry();
  const pipelines = new PipelineDomainService();
  const templates = new PipelineTemplateService(pipelines);
  const executor = new PipelineExecutor(registry, new PipelineHookRegistry());
  const service = new KnowledgeDomainService(executor, templates, pipelines);

  registerKnowledgePipelineSteps(registry, {
    extraction,
    knowledge: service,
  });

  return { service, extraction, templates, pipelines, executor, registry };
}
