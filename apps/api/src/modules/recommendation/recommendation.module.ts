import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { RepositoryPrismaLifecycle } from '../../persistence/repository-prisma-lifecycle';
import { RepositoryPrismaLifecycleModule } from '../../persistence/repository-prisma-lifecycle.module';
import { WorkspaceModule } from '../workspace';
import { RecommendationController } from './recommendation.controller';
import { RecommendationDomainService } from './recommendation-domain.service';
import { InMemoryRecommendationRepository } from './repositories/in-memory-recommendation.repository';
import { PrismaRecommendationRepository } from './repositories/prisma-recommendation.repository';
import { RECOMMENDATION_REPOSITORY } from './repositories/recommendation.repository.token';

/**
 * Recommendation Nest module (US098, US100, US102, US104).
 * Storage via RecommendationRepository — InMemory or Prisma by RESEARCH_PERSISTENCE_DRIVER
 * (PERSISTENCE_DRIVER fallback, then memory).
 */
@Module({
  imports: [RepositoryPrismaLifecycleModule, WorkspaceModule],
  controllers: [RecommendationController],
  providers: [
    {
      provide: RECOMMENDATION_REPOSITORY,
      useFactory: async (metrics: Metrics, clients: RepositoryPrismaLifecycle) => {
        const repo = await createRepositoryByDriver({
          group: 'research',
          createMemory: () => new InMemoryRecommendationRepository(),
          createPrisma: (client) => new PrismaRecommendationRepository(client),
          onHydrationFailure: 'fail',
          repositoryName: 'recommendation',
          clients,
        });
        return instrumentRepository(repo, metrics, 'recommendation');
      },
      inject: [METRICS, RepositoryPrismaLifecycle],
    },
    RecommendationDomainService,
  ],
  exports: [RecommendationDomainService],
})
export class RecommendationModule {}
