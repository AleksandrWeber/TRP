import type { InsightDomainService } from '../../../insight/insight-domain.service';
import type { PipelineRegistry } from '../../pipeline-registry';
import { CompareCrossAnalysisStep } from './compare-cross-analysis.step';
import { PersistCrossAnalysisStep } from './persist-cross-analysis.step';
import { PrepareCrossAnalysisStep } from './prepare-cross-analysis.step';

export type CrossAnalysisPipelineStepDeps = {
  insights: InsightDomainService;
};

/**
 * Registers Cross-Campaign Analysis PipelineSteps (US097).
 * Registration only — does not modify PipelineRegistry implementation.
 */
export function registerCrossAnalysisPipelineSteps(
  registry: PipelineRegistry,
  deps: CrossAnalysisPipelineStepDeps,
): void {
  registry.register(new PrepareCrossAnalysisStep());
  registry.register(new CompareCrossAnalysisStep());
  registry.register(new PersistCrossAnalysisStep(deps.insights));
}
