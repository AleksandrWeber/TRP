import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { RepositoryPrismaLifecycle } from '../../persistence/repository-prisma-lifecycle';
import { RepositoryPrismaLifecycleModule } from '../../persistence/repository-prisma-lifecycle.module';
import { WorkspaceModule } from '../workspace';
import { CampaignHistoryController } from './campaign-history.controller';
import { CampaignHistoryService } from './campaign-history.service';
import { CampaignPersistenceService } from './campaign-persistence.service';
import { CAMPAIGN_REPOSITORY } from './campaign-repository.token';
import { CampaignSessionMapper } from './campaign-session.mapper';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';
import { PrismaCampaignRepository } from './repositories/prisma-campaign.repository';

/**
 * Campaign Persistence Nest module (US055, US104).
 * CampaignRepository — InMemory or Prisma by RESEARCH_PERSISTENCE_DRIVER
 * (PERSISTENCE_DRIVER fallback, then memory).
 */
@Module({
  imports: [RepositoryPrismaLifecycleModule, WorkspaceModule],
  controllers: [CampaignHistoryController],
  providers: [
    CampaignSessionMapper,
    {
      provide: CAMPAIGN_REPOSITORY,
      useFactory: async (metrics: Metrics, clients: RepositoryPrismaLifecycle) => {
        const repo = await createRepositoryByDriver({
          group: 'research',
          createMemory: () => new InMemoryCampaignRepository(),
          createPrisma: (client) => new PrismaCampaignRepository(client),
          onHydrationFailure: 'fail',
          repositoryName: 'campaign',
          clients,
        });
        return instrumentRepository(repo, metrics, 'campaign');
      },
      inject: [METRICS, RepositoryPrismaLifecycle],
    },
    CampaignPersistenceService,
    CampaignHistoryService,
  ],
  exports: [CampaignPersistenceService, CampaignHistoryService],
})
export class CampaignPersistenceModule {}
