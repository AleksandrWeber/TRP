import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { WorkspaceModule } from '../workspace';
import { RecommendationController } from './recommendation.controller';
import { RecommendationDomainService } from './recommendation-domain.service';
import { InMemoryRecommendationRepository } from './repositories/in-memory-recommendation.repository';
import { PrismaRecommendationRepository } from './repositories/prisma-recommendation.repository';
import { RECOMMENDATION_REPOSITORY } from './repositories/recommendation.repository.token';

/**
 * Recommendation Nest module (US098, US100, US102, US104).
 * Storage via RecommendationRepository — InMemory or Prisma by PERSISTENCE_DRIVER.
 */
@Module({
  imports: [WorkspaceModule],
  controllers: [RecommendationController],
  providers: [
    {
      provide: RECOMMENDATION_REPOSITORY,
      useFactory: async (metrics: Metrics) => {
        const repo = await createRepositoryByDriver({
          createMemory: () => new InMemoryRecommendationRepository(),
          createPrisma: (client) => new PrismaRecommendationRepository(client),
        });
        return instrumentRepository(repo, metrics, 'recommendation');
      },
      inject: [METRICS],
    },
    RecommendationDomainService,
  ],
  exports: [RecommendationDomainService],
})
export class RecommendationModule {}
