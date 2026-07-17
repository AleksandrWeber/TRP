import type { KnowledgeExtractionService } from '../../../knowledge/knowledge-extraction.service';
import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readPreparedExperiment, writeExtractedKnowledge } from './knowledge-pipeline-context';
import { KNOWLEDGE_PIPELINE_STEP_METADATA } from './knowledge-step-metadata';

/**
 * Knowledge stage: deterministic extract from Experiment.currentVersion.report (US090).
 * Extracted from KnowledgeDomainService.createFromExperiment → KnowledgeExtractionService.extract.
 */
export class ExtractKnowledgeStep extends AbstractPipelineStep {
  constructor(private readonly extraction: KnowledgeExtractionService) {
    super(KNOWLEDGE_PIPELINE_STEP_METADATA.extract);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const experiment = readPreparedExperiment(context);
    const extracted = this.extraction.extract(experiment);
    return writeExtractedKnowledge(context, extracted);
  }
}
