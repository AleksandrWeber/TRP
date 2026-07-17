import { Module } from '@nestjs/common';
import { CampaignHistoryController } from './campaign-history.controller';
import { CampaignHistoryService } from './campaign-history.service';
import { CampaignPersistenceService } from './campaign-persistence.service';
import { CAMPAIGN_REPOSITORY } from './campaign-repository.token';
import { CampaignSessionMapper } from './campaign-session.mapper';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';

/**
 * Campaign Persistence Nest module.
 * Imported by ResearchCampaignModule for CampaignSession persistence (US055).
 */
@Module({
  controllers: [CampaignHistoryController],
  providers: [
    CampaignSessionMapper,
    {
      provide: CAMPAIGN_REPOSITORY,
      useFactory: () => new InMemoryCampaignRepository(),
    },
    CampaignPersistenceService,
    CampaignHistoryService,
  ],
  exports: [CampaignPersistenceService, CampaignHistoryService],
})
export class CampaignPersistenceModule {}
