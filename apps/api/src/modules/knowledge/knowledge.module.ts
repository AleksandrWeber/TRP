import { forwardRef, Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerKnowledgePipelineSteps } from '../pipeline/steps/knowledge/register-knowledge-steps';
import { WorkspaceModule } from '../workspace';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeDomainService } from './knowledge-domain.service';
import { KnowledgeExtractionService } from './knowledge-extraction.service';
import { KnowledgeService } from './knowledge.service';
import { InMemoryKnowledgeRepository } from './repositories/in-memory-knowledge.repository';
import { KNOWLEDGE_REPOSITORY } from './repositories/knowledge.repository.token';
import { PrismaKnowledgeRepository } from './repositories/prisma-knowledge.repository';

/**
 * Knowledge Nest module (US075–US079, US090, US102, US104).
 * Domain KnowledgeRepository — InMemory or Prisma by PERSISTENCE_DRIVER.
 * forwardRef(PipelineModule) — TD-009 (pre-existing).
 */
@Module({
  imports: [forwardRef(() => PipelineModule), WorkspaceModule],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    KnowledgeExtractionService,
    {
      provide: KNOWLEDGE_REPOSITORY,
      useFactory: async (metrics: Metrics) => {
        const repo = await createRepositoryByDriver({
          createMemory: () => new InMemoryKnowledgeRepository(),
          createPrisma: (client) => new PrismaKnowledgeRepository(client),
        });
        return instrumentRepository(repo, metrics, 'knowledge');
      },
      inject: [METRICS],
    },
    KnowledgeDomainService,
  ],
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
