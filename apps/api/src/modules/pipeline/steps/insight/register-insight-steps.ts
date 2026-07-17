import type { InsightDomainService } from '../../../insight/insight-domain.service';
import type { PipelineRegistry } from '../../pipeline-registry';
import { ExtractInsightsStep } from './extract-insights.step';
import { PersistInsightsStep } from './persist-insights.step';
import { PrepareInsightExtractionStep } from './prepare-insight-extraction.step';

export type InsightPipelineStepDeps = {
  insights: InsightDomainService;
};

/**
 * Registers Insight PipelineStep implementations on a PipelineRegistry (US096).
 * Does not execute pipelines — registration only.
 */
export function registerInsightPipelineSteps(
  registry: PipelineRegistry,
  deps: InsightPipelineStepDeps,
): void {
  registry.register(new PrepareInsightExtractionStep());
  registry.register(new ExtractInsightsStep());
  registry.register(new PersistInsightsStep(deps.insights));
}
