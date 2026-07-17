import { Inject, Module, OnModuleInit } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerInsightPipelineSteps } from '../pipeline/steps/insight/register-insight-steps';
import { WorkspaceModule } from '../workspace';
import { InsightController } from './insight.controller';
import { InsightDomainService } from './insight-domain.service';
import { InMemoryInsightRepository } from './repositories/in-memory-insight.repository';
import { INSIGHT_REPOSITORY } from './repositories/insight.repository.token';
import { PrismaInsightRepository } from './repositories/prisma-insight.repository';

/**
 * Insight Nest module (US095–US096, US100, US102, US104).
 * Storage via InsightRepository — InMemory or Prisma by PERSISTENCE_DRIVER.
 */
@Module({
  imports: [PipelineModule, WorkspaceModule],
  controllers: [InsightController],
  providers: [
    {
      provide: INSIGHT_REPOSITORY,
      useFactory: async (metrics: Metrics) => {
        const repo = await createRepositoryByDriver({
          createMemory: () => new InMemoryInsightRepository(),
          createPrisma: (client) => new PrismaInsightRepository(client),
        });
        return instrumentRepository(repo, metrics, 'insight');
      },
      inject: [METRICS],
    },
    InsightDomainService,
  ],
  exports: [InsightDomainService],
})
export class InsightModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(InsightDomainService)
    private readonly insights: InsightDomainService,
  ) {}

  onModuleInit(): void {
    if (this.registry.get('insights.prepare')) return;

    registerInsightPipelineSteps(this.registry, {
      insights: this.insights,
    });
  }
}
