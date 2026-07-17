import { forwardRef, Inject, Module, OnModuleInit } from '@nestjs/common';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerKnowledgePipelineSteps } from '../pipeline/steps/knowledge/register-knowledge-steps';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';
import { KnowledgeService } from './knowledge.service';

/**
 * Knowledge Nest module (US075–US079, US090).
 * Domain CRUD + extraction; createFromExperiment via PipelineExecutor + Knowledge steps.
 * forwardRef(PipelineModule) breaks Knowledge → Pipeline → Experiments → Knowledge cycle.
 */
@Module({
  imports: [forwardRef(() => PipelineModule)],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeExtractionService, KnowledgeDomainService],
  exports: [KnowledgeService, KnowledgeExtractionService, KnowledgeDomainService],
})
export class KnowledgeModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(KnowledgeExtractionService)
    private readonly extraction: KnowledgeExtractionService,
    @Inject(KnowledgeDomainService)
    private readonly knowledge: KnowledgeDomainService,
  ) {}

  onModuleInit(): void {
    if (this.registry.get('knowledge.prepare')) return;

    registerKnowledgePipelineSteps(this.registry, {
      extraction: this.extraction,
      knowledge: this.knowledge,
    });
  }
}
