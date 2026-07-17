import { AbstractPipelineStep } from '../../abstract-pipeline-step';
import type { PipelineContext } from '../../pipeline-context';
import { readKnowledgeExperiment, writePreparedKnowledge } from './knowledge-pipeline-context';
import { resolveCurrentReport } from './knowledge-session.helpers';
import { KNOWLEDGE_PIPELINE_STEP_METADATA } from './knowledge-step-metadata';

/**
 * Knowledge stage: validate experiment and resolve current report (US090).
 * Extracted from KnowledgeExtractionService.extract prelude.
 */
export class PrepareKnowledgeExtractionStep extends AbstractPipelineStep {
  constructor() {
    super(KNOWLEDGE_PIPELINE_STEP_METADATA.prepare);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const experiment = readKnowledgeExperiment(context);
    const report = resolveCurrentReport(experiment);
    return writePreparedKnowledge(context, experiment, report);
  }
}
