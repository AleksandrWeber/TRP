import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
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
 * CampaignRepository — InMemory or Prisma by PERSISTENCE_DRIVER.
 */
@Module({
  imports: [WorkspaceModule],
  controllers: [CampaignHistoryController],
  providers: [
    CampaignSessionMapper,
    {
      provide: CAMPAIGN_REPOSITORY,
      useFactory: async (metrics: Metrics) => {
        const repo = await createRepositoryByDriver({
          createMemory: () => new InMemoryCampaignRepository(),
          createPrisma: (client) => new PrismaCampaignRepository(client),
        });
        return instrumentRepository(repo, metrics, 'campaign');
      },
      inject: [METRICS],
    },
    CampaignPersistenceService,
    CampaignHistoryService,
  ],
  exports: [CampaignPersistenceService, CampaignHistoryService],
})
export class CampaignPersistenceModule {}
