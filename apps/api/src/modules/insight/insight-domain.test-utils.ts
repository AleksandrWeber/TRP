import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineHookRegistry } from '../pipeline/pipeline-hook-registry';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { registerInsightPipelineSteps } from '../pipeline/steps/insight/register-insight-steps';
import { InsightDomainService } from './insight-domain.service';

/**
 * Wires InsightDomainService with PipelineExecutor + Insight steps (US096 tests).
 */
export function createInsightDomainService(): {
  service: InsightDomainService;
  templates: PipelineTemplateService;
  pipelines: PipelineDomainService;
  executor: PipelineExecutor;
  registry: PipelineRegistry;
} {
  const registry = new PipelineRegistry();
  const pipelines = new PipelineDomainService();
  const templates = new PipelineTemplateService(pipelines);
  const executor = new PipelineExecutor(registry, new PipelineHookRegistry());
  const service = new InsightDomainService(executor, templates, pipelines);

  registerInsightPipelineSteps(registry, { insights: service });

  return { service, templates, pipelines, executor, registry };
}
